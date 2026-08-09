import "../../styles/site/checkout.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, CreditCard, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import { DELIVERY_MIN_ORDER_AMOUNT, getDeliveryMinimumRemaining } from "../../../shared/order-rules";
import { apiPath } from "../../utils/api";
import { METRIKA_GOALS, reachMetrikaGoal } from "../../utils/analytics";
import { subscribeForOrderPush } from "../../utils/notifications";
import { formatPrice } from "../../utils/price";
import { getCartItemDetails, getCartItemImage, saveStoredCart, saveStoredPromo } from "./cartModel";
import { getCustomerOrdersPath, saveCurrentCustomerOrder } from "./customerOrders";
import { clearPendingPayment, readPendingPayment, savePendingPayment } from "./paymentFlow";
import { SiteFooter } from "./SiteFooter";
import { ASSET, getSiteHomePath, pluralRu } from "./siteData";

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Не удалось выполнить запрос");
  }
  return data;
}

function PaymentSteps({ done = false }) {
  return (
    <div className="site-checkout-steps" aria-label="Шаги оформления">
      <span className="is-done"><Check size={14} />Корзина</span>
      <span className="is-done"><Check size={14} />Оформление</span>
      <span className={done ? "is-done" : "is-active"}>{done ? "Заказ принят" : "3 Оплата"}</span>
    </div>
  );
}

function PaymentSummary({ pending }) {
  const items = pending?.cartItems || pending?.order?.items || [];
  const total = Number(pending?.order?.total || 0);
  const count = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const label = `${count} ${pluralRu(count, "товар", "товара", "товаров")}`;

  return (
    <aside className="site-checkout-summary" aria-label="Состав заказа">
      <h2>К оплате</h2>
      <div className="site-payment-summary-total"><span>{label}</span><b>{formatPrice(total)} ₽</b></div>
      <div className="site-checkout-summary-list">
        {items.slice(0, 4).map((item, index) => {
          const details = getCartItemDetails(item);
          const unitPrice = Number(item.unitPrice || item.price || 0);
          const qty = Number(item.qty || 0);
          return (
            <article key={item.uid || `${item.name}-${index}`}>
              <img src={getCartItemImage(item)} alt="" loading="lazy" />
              <div>
                <b>{item.name}</b>
                {details ? <span>{details}</span> : null}
                <small>{qty} шт.</small>
              </div>
              <strong>{formatPrice(unitPrice * qty)} ₽</strong>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

export function SitePaymentPage() {
  const [pending, setPending] = useState(() => readPendingPayment());
  const [paymentUrl, setPaymentUrl] = useState(() => readPendingPayment()?.yooKassa?.paymentUrl || "");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);
  const [returnHandled, setReturnHandled] = useState(false);
  const returnedOrderId = useMemo(() => new URLSearchParams(window.location.search).get("orderId") || "", []);

  useEffect(() => {
    setPending(readPendingPayment());
  }, []);

  useEffect(() => {
    if (returnHandled) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("provider") !== "yookassa" || !returnedOrderId) return;

    setReturnHandled(true);
    window.history.replaceState(null, "", window.location.pathname);
    checkPaymentStatus(returnedOrderId, { automatic: true });
  }, [returnHandled, returnedOrderId]);

  function validatePaymentReady() {
    if (!pending?.order) return "Заказ для оплаты не найден. Вернитесь к оформлению.";
    if (!Number(pending.order.total) || Number(pending.order.total) <= 0) return "Некорректная сумма заказа.";
    const deliveryMinimumRemaining = getDeliveryMinimumRemaining(pending.order.total);
    if (pending.order.mode === "delivery" && deliveryMinimumRemaining > 0) {
      return (
        `Минимальная сумма доставки после скидок — ${formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽. ` +
        `Добавьте блюда ещё на ${formatPrice(deliveryMinimumRemaining)} ₽ или выберите самовывоз.`
      );
    }
    return "";
  }

  function completePaidOrder(order, message = "Оплата подтверждена. Заказ передан в ресторан.") {
    const completedOrder = {
      ...(pending?.order || {}),
      ...(order || {}),
      items: order?.items || pending?.order?.items || pending?.cartItems || []
    };
    const nextPending = pending
      ? savePendingPayment({ ...pending, order: completedOrder })
      : null;
    reachMetrikaGoal(METRIKA_GOALS.PAYMENT_SUCCESS, {
      order_id: completedOrder.id || "",
      order_total: Number(completedOrder.total || 0),
      fulfillment: completedOrder.mode || ""
    });
    if (nextPending) setPending(nextPending);
    saveCurrentCustomerOrder(completedOrder);
    saveStoredCart([]);
    saveStoredPromo(null);
    clearPendingPayment();
    setPaid(true);
    setStatus(message);
    window.location.replace(getCustomerOrdersPath(completedOrder.id));
  }

  async function checkPaymentStatus(orderId = pending?.order?.id, { automatic = false } = {}) {
    if (!orderId) {
      setStatus("Не найден номер заказа для проверки.");
      return;
    }

    setSubmitting(true);
    setStatus(automatic ? "Проверяем оплату после возврата из ЮKassa..." : "Проверяем оплату в ЮKassa...");
    try {
      const data = await fetch(
        `${apiPath("yooKassaPaymentStatus")}/${encodeURIComponent(orderId)}/status`,
        { credentials: "include" }
      ).then(readJson);

      if (data.paid) {
        completePaidOrder(data.order);
        return;
      }

      const nextPending = pending
        ? savePendingPayment({ ...pending, order: { ...pending.order, ...data.order } })
        : null;
      if (nextPending) setPending(nextPending);
      setStatus(
        data.paymentStatus === "canceled"
          ? "Платеж отменен. Можно создать новую оплату."
          : "ЮKassa пока не подтвердила оплату. Если вы только что оплатили, проверьте еще раз через несколько секунд."
      );
    } catch (error) {
      setStatus(error.message || "Не удалось проверить оплату");
    } finally {
      setSubmitting(false);
    }
  }

  async function startYooKassaPayment() {
    const error = validatePaymentReady();
    if (error) {
      setStatus(error);
      return;
    }

    setSubmitting(true);
    setStatus("Создаем защищенную оплату ЮKassa...");
    try {
      let orderWithPush = pending.order;
      try {
        const push = await subscribeForOrderPush();
        if (push.ok && push.subscription) {
          orderWithPush = {
            ...pending.order,
            pushSubscription: push.subscription
          };
          const nextPending = savePendingPayment({
            ...pending,
            order: orderWithPush
          });
          setPending(nextPending);
          await fetch(apiPath("customerPush"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: push.subscription })
          }).then(readJson);
        }
      } catch {
        // Отказ от уведомлений не должен блокировать оплату.
      }

      const data = await fetch(apiPath("yooKassaCreatePayment"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithPush })
      }).then(readJson);

      const nextPending = savePendingPayment({
        ...pending,
        order: data.order || { ...pending.order, id: data.orderId },
        yooKassa: {
          mode: data.mode,
          paymentId: data.paymentId,
          paymentUrl: data.paymentUrl,
          test: Boolean(data.test)
        }
      });
      setPending(nextPending);
      setPaymentUrl(data.paymentUrl || "");

      if (data.paid) {
        completePaidOrder(data.order);
        return;
      }
      if (!data.paymentUrl) throw new Error("ЮKassa не вернула ссылку оплаты");

      reachMetrikaGoal(METRIKA_GOALS.PAYMENT_START, {
        order_id: data.order?.id || data.orderId || pending.order.id || "",
        order_total: Number(data.order?.total || pending.order.total || 0),
        fulfillment: data.order?.mode || pending.order.mode || ""
      });
      setStatus("Открываем защищенную форму ЮKassa...");
      window.location.href = data.paymentUrl;
    } catch (error) {
      setStatus(error.message || "Не удалось создать оплату ЮKassa");
    } finally {
      setSubmitting(false);
    }
  }

  if (!pending?.order && !returnedOrderId) {
    return (
      <main className="site-showcase site-checkout-page">
        <header className="site-checkout-header">
          <a className="site-checkout-brand" href={getSiteHomePath()} aria-label="На главную">
            <img src={`${ASSET}vv-logo-full.svg`} alt="" />
          </a>
          <PaymentSteps />
        </header>
        <section className="site-checkout-shell">
          <div className="site-checkout-success">
            <CreditCard size={34} />
            <h1>Нет заказа для оплаты</h1>
            <p>Вернитесь к оформлению заказа и выберите способ оплаты.</p>
            <a href="/checkout">К оформлению</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="site-showcase site-checkout-page">
      <header className="site-checkout-header">
        <a className="site-checkout-brand" href={getSiteHomePath()} aria-label="На главную">
          <img src={`${ASSET}vv-logo-full.svg`} alt="" />
        </a>
        <PaymentSteps done={paid} />
      </header>

      <section className="site-checkout-shell">
        {paid ? (
          <div className="site-checkout-success">
            <Check size={34} />
            <h1>Заказ принят</h1>
            <p>ЮKassa подтвердила оплату. Заказ уже появился у ресторана.</p>
            <a href={getSiteHomePath()}>Вернуться на сайт</a>
          </div>
        ) : (
          <div className="site-checkout-layout site-payment-layout">
            <section className="site-payment-form" aria-label="Оплата заказа">
              <button className="site-payment-back" type="button" onClick={() => (window.location.href = "/checkout")}>
                <ArrowLeft size={18} />Вернуться к оформлению
              </button>
              <div className="site-payment-card">
                  <div className="site-payment-head">
                    <CreditCard size={26} />
                    <div>
                      <p>Онлайн-оплата</p>
                      <h1>Оплата через ЮKassa</h1>
                    </div>
                  </div>

                  <div className="site-payment-external-note">
                    <ExternalLink size={42} />
                    <b>Оплата пройдет на защищенной странице ЮKassa</b>
                    <span>Доступные способы, включая банковскую карту и СБП, будут показаны на стороне платёжного сервиса.</span>
                  </div>

                  <div className="site-payment-security">
                    <span><LockKeyhole size={16} />Данные карты не передаются сайту ресторана</span>
                    <span><ShieldCheck size={16} />Заказ попадёт на кухню только после серверного подтверждения оплаты</span>
                  </div>

                  <button className="site-checkout-submit" type="button" onClick={startYooKassaPayment} disabled={submitting}>
                    {submitting
                      ? "Готовим оплату..."
                      : `Перейти к оплате ${formatPrice(pending?.order?.total || 0)} ₽`}
                    <ChevronRight size={18} />
                  </button>
                  {pending?.order?.paymentId ? (
                    <button
                      className="site-payment-link"
                      type="button"
                      onClick={() => checkPaymentStatus(pending.order.id)}
                      disabled={submitting}
                    >
                      Проверить оплату
                    </button>
                  ) : null}
                  {paymentUrl ? (
                    <a className="site-payment-link" href={paymentUrl}>Открыть оплату ещё раз</a>
                  ) : null}
                  {status ? <p className="site-checkout-status">{status}</p> : null}
              </div>
            </section>
            {pending ? <PaymentSummary pending={pending} /> : null}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
