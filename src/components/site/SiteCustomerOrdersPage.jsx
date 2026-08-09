import "../../styles/site/customer-orders.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  Headphones,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  Store,
  X
} from "lucide-react";
import { apiPath } from "../../utils/api";
import { subscribeForOrderPush } from "../../utils/notifications";
import { formatPrice } from "../../utils/price";
import {
  getCustomerOrderIdFromPath,
  getCustomerOrdersPath,
  readCurrentCustomerOrder,
  saveCurrentCustomerOrder
} from "./customerOrders";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { PHONE, RESTAURANT, SOCIAL_LINKS, getSiteHomePath, telHref } from "./siteData";

const CUSTOMER_ACTION_WINDOW_SECONDS = 150;
const CHANGEABLE_STATUSES = new Set(["new", "accepted"]);
const CLOSED_STATUSES = new Set(["delivered", "cancelled", "payment_failed"]);

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    const error = new Error(data.error || "Не удалось выполнить запрос");
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

function isLocalPreview() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function makeLocalPreviewOrder(id = "demo-current-order") {
  const paidAt = new Date(Date.now() - 38_000).toISOString();
  const acceptedAt = new Date(Date.now() - 26_000).toISOString();
  return {
    id,
    publicId: "A10482",
    status: "accepted",
    statusLabel: "Принят",
    createdAt: paidAt,
    updatedAt: acceptedAt,
    paidAt,
    acceptedAt,
    mode: "delivery",
    address: "Чебоксары, ул. Константина Иванова, 81",
    entrance: "2",
    flat: "46",
    requestedTime: "Как можно скорее",
    total: 1680,
    subtotal: 1680,
    payment: "Онлайн, демо-оплата",
    paymentStatus: "paid",
    paymentProvider: "demo",
    paymentDemo: true,
    items: [
      { productId: "signature-vv-pizza", name: "Фирменная пицца «Вместе Вкуснее»", qty: 1, unitPrice: 890, weight: "30 см" },
      { productId: "summer-tuna-poke", name: "Поке с тунцом", qty: 1, unitPrice: 560, weight: "290 г" },
      { productId: "mors", name: "Морс", qty: 2, unitPrice: 115, weight: "0,3 л" }
    ],
    statusHistory: [
      { status: "new", statusLabel: "Получен", changedAt: paidAt, note: "Оплата подтверждена" },
      { status: "accepted", statusLabel: "Принят", changedAt: acceptedAt, note: "Ресторан подтвердил заказ" }
    ]
  };
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getActionStartedAt(order) {
  const receivedEvent = (order?.statusHistory || []).find(
    (event) => event?.status === "new" && event?.changedAt
  );
  return order?.paidAt || receivedEvent?.changedAt || order?.createdAt || "";
}

function getRemainingSeconds(order, now) {
  if (!order || !CHANGEABLE_STATUSES.has(order.status)) return 0;
  const expiresAtFromServer = order.actions?.cancel?.expiresAt;
  const start = new Date(getActionStartedAt(order)).getTime();
  const expiresAt = expiresAtFromServer
    ? new Date(expiresAtFromServer).getTime()
    : start + CUSTOMER_ACTION_WINDOW_SECONDS * 1000;
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function getOrderStages(order) {
  const delivery = order?.mode !== "pickup";
  return [
    {
      status: "new",
      label: "Заказ получен",
      description: "Передали заказ ресторану",
      Icon: CheckCircle2
    },
    {
      status: "accepted",
      label: "Подтверждён",
      description: "Ресторан принял заказ",
      Icon: PackageCheck
    },
    {
      status: "cooking",
      label: "Готовим",
      description: "Кухня собирает ваш заказ",
      Icon: ChefHat
    },
    ...(delivery
      ? [
          {
            status: "courier",
            label: "У курьера",
            description: "Заказ едет к вам",
            Icon: Bike
          }
        ]
      : []),
    {
      status: "delivered",
      label: delivery ? "Доставлен" : "Выдан",
      description: delivery ? "Заказ у вас" : "Заказ забрали в ресторане",
      Icon: Check
    }
  ];
}

function getStageTime(order, stageStatus) {
  const event = (order?.statusHistory || []).find((item) => item.status === stageStatus);
  return event?.changedAt || "";
}

function getStatusMessage(order) {
  if (!order) return "";
  if (order.status === "payment_pending") return "Ждём подтверждение оплаты";
  if (order.status === "new") return "Ресторан уже видит заказ";
  if (order.status === "accepted") return "Заказ подтверждён и передан в работу";
  if (order.status === "cooking") return "Кухня готовит ваш заказ";
  if (order.status === "courier") return "Курьер направляется к вам";
  if (order.status === "delivered") return order.mode === "pickup" ? "Заказ выдан" : "Заказ доставлен";
  if (order.status === "cancelled") return "Заказ отменён";
  if (order.status === "payment_failed") return "Оплата не завершена";
  return order.statusLabel || "Заказ в работе";
}

function getEtaText(order) {
  if (order?.status === "courier") return "Курьер уже в пути";
  if (order?.status === "delivered") return "Заказ завершён";
  if (order?.status === "cancelled") return "Заказ отменён";
  if (order?.requestedTime) return order.requestedTime;
  return order?.mode === "pickup" ? RESTAURANT.pickupEta : RESTAURANT.deliveryEta;
}

function getOrderItemDetails(item) {
  return [
    item.weight,
    Array.isArray(item.addons) && item.addons.length
      ? `Добавки: ${item.addons.map((addon) => addon.name).join(", ")}`
      : "",
    Array.isArray(item.removed) && item.removed.length ? `Без: ${item.removed.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

function getStatusClass(status) {
  if (status === "cancelled" || status === "payment_failed") return "is-danger";
  if (status === "delivered") return "is-complete";
  return "is-active";
}

function CustomerOrdersList({ orders, loading, onRefresh }) {
  return (
    <section className="site-orders-list-page">
      <div className="site-order-page-heading">
        <div>
          <span>Личный кабинет</span>
          <h1>Мои заказы</h1>
          <p>Текущие и завершённые заказы в одном месте.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
          Обновить
        </button>
      </div>

      {loading && !orders.length ? (
        <div className="site-order-loading" role="status">
          <RefreshCw size={22} className="is-spinning" />
          Загружаем заказы
        </div>
      ) : null}

      {!loading && !orders.length ? (
        <div className="site-orders-empty">
          <ShoppingBag size={28} />
          <h2>Заказов пока нет</h2>
          <p>После оформления заказ появится здесь, и его можно будет отслеживать.</p>
          <a href={`${getSiteHomePath()}#menu`}>Перейти в меню</a>
        </div>
      ) : null}

      <div className="site-orders-list">
        {orders.map((order) => (
          <a className="site-orders-list-card" href={getCustomerOrdersPath(order.id)} key={order.id}>
            <div className="site-orders-list-card-head">
              <span className={`site-order-status-pill ${getStatusClass(order.status)}`}>
                {order.statusLabel || getStatusMessage(order)}
              </span>
              <time>{formatDateTime(order.createdAt)}</time>
            </div>
            <div className="site-orders-list-card-main">
              <div>
                <b>Заказ №{order.publicId || String(order.id).slice(-8)}</b>
                <span>
                  {(order.items || []).slice(0, 2).map((item) => `${item.name} × ${item.qty}`).join(", ")}
                  {(order.items || []).length > 2 ? ` и ещё ${(order.items || []).length - 2}` : ""}
                </span>
              </div>
              <strong>{formatPrice(order.total || 0)} ₽</strong>
              <ChevronRight size={20} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function OrderProgress({ order }) {
  const stages = getOrderStages(order);
  const currentIndex = stages.findIndex((stage) => stage.status === order.status);
  const completed = order.status === "delivered";

  return (
    <section className={`site-order-progress ${order.status === "cancelled" ? "is-cancelled" : ""}`}>
      <div className="site-order-section-head">
        <div>
          <span>Статус заказа</span>
          <h2>{getStatusMessage(order)}</h2>
        </div>
        {!CLOSED_STATUSES.has(order.status) ? (
          <span className="site-order-live"><i /> Обновляется автоматически</span>
        ) : null}
      </div>

      {order.status === "cancelled" ? (
        <div className="site-order-cancelled-message">
          <X size={20} />
          <div>
            <b>Заказ отменён</b>
            <span>{order.cancelReason || "Отмена оформлена в личном кабинете."}</span>
            {order.refundStatus === "requested" ? (
              <small>Запрос на возврат оплаты передан ресторану.</small>
            ) : null}
            {order.refundStatus === "not_required_demo" ? (
              <small>Это демо-оплата: деньги не списывались.</small>
            ) : null}
          </div>
        </div>
      ) : (
        <ol className="site-order-timeline">
          {stages.map((stage, index) => {
            const isDone = completed || (currentIndex >= 0 && index < currentIndex);
            const isActive = !completed && index === Math.max(0, currentIndex);
            const stageTime = getStageTime(order, stage.status);
            const Icon = stage.Icon;
            return (
              <li
                className={isDone ? "is-done" : isActive ? "is-current" : "is-pending"}
                key={stage.status}
              >
                <span className="site-order-timeline-marker">
                  <Icon size={18} />
                </span>
                <div>
                  <b>{stage.label}</b>
                  <span>{isActive ? stage.description : isDone ? "Готово" : stage.description}</span>
                </div>
                <time>{stageTime ? formatShortTime(stageTime) : ""}</time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function OrderItems({ order }) {
  return (
    <section className="site-order-items-card">
      <div className="site-order-section-head">
        <div>
          <span>Состав</span>
          <h2>Ваш заказ</h2>
        </div>
        <b>{(order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)} шт.</b>
      </div>
      <div className="site-order-items-list">
        {(order.items || []).map((item, index) => {
          const details = getOrderItemDetails(item);
          return (
            <article key={`${item.productId || item.name}-${index}`}>
              <span className="site-order-item-number">{index + 1}</span>
              <div>
                <b>{item.name}</b>
                {details ? <small>{details}</small> : null}
              </div>
              <span>{item.qty} шт.</span>
              <strong>{formatPrice(Number(item.unitPrice || 0) * Number(item.qty || 0))} ₽</strong>
            </article>
          );
        })}
      </div>
      <div className="site-order-total-row">
        <span>Итого</span>
        <strong>{formatPrice(order.total || 0)} ₽</strong>
      </div>
    </section>
  );
}

function OrderActionDialog({ type, order, submitting, error, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const isCancel = type === "cancel";

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  return (
    <div className="site-order-dialog-layer">
      <button className="site-order-dialog-scrim" type="button" aria-label="Закрыть" onClick={onClose} />
      <section className="site-order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title">
        <button className="site-order-dialog-close" type="button" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
        <span className="site-order-dialog-icon">
          {isCancel ? <CircleHelp size={22} /> : <MessageCircle size={22} />}
        </span>
        <h2 id="order-dialog-title">{isCancel ? "Отменить заказ?" : "Что изменить в заказе?"}</h2>
        <p>
          {isCancel
            ? "Ресторан остановит выполнение. Для реальной онлайн-оплаты возврат будет оформлен после проверки."
            : "Напишите, что убрать, добавить или заменить. Ресторан подтвердит изменение состава и итоговой суммы по телефону."}
        </p>
        <label>
          <span>{isCancel ? "Причина, необязательно" : "Изменения"}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={isCancel ? "Например: заказал по ошибке" : "Например: убрать лук из пиццы, добавить один морс"}
            maxLength={600}
            autoFocus
          />
        </label>
        {error ? <p className="site-order-dialog-error">{error}</p> : null}
        <div className="site-order-dialog-actions">
          <button type="button" className="is-secondary" onClick={onClose} disabled={submitting}>
            Не сейчас
          </button>
          <button
            type="button"
            className={isCancel ? "is-danger" : "is-primary"}
            onClick={() => onSubmit(text)}
            disabled={submitting || (!isCancel && text.trim().length < 4)}
          >
            {submitting
              ? "Отправляем..."
              : isCancel
                ? "Да, отменить"
                : "Отправить изменения"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CustomerOrderDetails({
  order,
  now,
  refreshing,
  notice,
  onRefresh,
  onOpenAction,
  onCopyOrderNumber
}) {
  const stages = getOrderStages(order);
  const remainingSeconds = getRemainingSeconds(order, now);
  const canChange = remainingSeconds > 0;
  const orderNumber = order.publicId || String(order.id).slice(-8).toUpperCase();
  const changeRequest = order.customerChangeRequest;

  return (
    <section className="site-order-page">
      <div className="site-order-breadcrumbs">
        <a href={getCustomerOrdersPath()}><ArrowLeft size={16} />Мои заказы</a>
        <span>Заказ №{orderNumber}</span>
      </div>

      <header className="site-order-hero">
        <div className="site-order-hero-copy">
          <span className={`site-order-status-pill ${getStatusClass(order.status)}`}>
            {order.statusLabel || getStatusMessage(order)}
          </span>
          <h1>Заказ №{orderNumber}</h1>
          <p>Оформлен {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="site-order-eta">
          <Clock3 size={21} />
          <span>
            <small>{order.status === "courier" ? "Доставка" : "Ожидаемое время"}</small>
            <b>{getEtaText(order)}</b>
          </span>
        </div>
        <button
          className="site-order-refresh"
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Обновить статус заказа"
        >
          <RefreshCw size={18} className={refreshing ? "is-spinning" : ""} />
        </button>
      </header>

      {notice ? <div className="site-order-notice" role="status"><Check size={17} />{notice}</div> : null}

      <div className="site-order-layout">
        <div className="site-order-main-column">
          <OrderProgress order={order} stages={stages} />

          {changeRequest ? (
            <div className="site-order-change-request">
              <MessageCircle size={19} />
              <div>
                <b>Запрос на изменение отправлен</b>
                <span>{changeRequest.text}</span>
                <small>Ресторан свяжется с вами, если изменится состав или сумма.</small>
              </div>
            </div>
          ) : null}

          <OrderItems order={order} />
        </div>

        <aside className="site-order-side-column">
          <section className="site-order-info-card">
            <h2>{order.mode === "pickup" ? "Самовывоз" : "Доставка"}</h2>
            <div>
              {order.mode === "pickup" ? <Store size={18} /> : <MapPin size={18} />}
              <span>
                <b>{order.address || RESTAURANT.address}</b>
                {order.mode === "pickup" ? <small>Пиццерия «Вместе Вкуснее»</small> : null}
              </span>
            </div>
            <div>
              <CreditCard size={18} />
              <span>
                <b>{order.paymentStatus === "paid" ? "Оплачено онлайн" : order.payment || "Онлайн-оплата"}</b>
                {order.paymentDemo ? <small>Демонстрационная оплата</small> : null}
              </span>
            </div>
          </section>

          {!CLOSED_STATUSES.has(order.status) ? (
            <section className={`site-order-quick-actions ${canChange ? "is-available" : ""}`}>
              <div className="site-order-action-window">
                <span>
                  <Clock3 size={17} />
                  {canChange ? "Можно изменить или отменить" : "Самостоятельные изменения закрыты"}
                </span>
                {canChange ? <strong>{formatCountdown(remainingSeconds)}</strong> : null}
              </div>
              <p>
                {canChange
                  ? "В первые 2,5 минуты изменения и отмена доступны прямо здесь."
                  : "Если что-то нужно изменить, позвоните в ресторан: команда проверит, что ещё можно сделать."}
              </p>
              {canChange ? (
                <div>
                  <button type="button" className="is-primary" onClick={() => onOpenAction("change")}>
                    <MessageCircle size={17} />Изменить состав
                  </button>
                  <button type="button" className="is-danger" onClick={() => onOpenAction("cancel")}>
                    <X size={17} />Отменить заказ
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="site-order-contact-card">
            <h2>Нужна помощь?</h2>
            <p>По заказу быстрее всего ответит ресторан.</p>
            <a href={telHref(PHONE)}>
              <Phone size={18} />
              <span><b>Позвонить в ресторан</b><small>{PHONE}</small></span>
            </a>
            <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noreferrer">
              <Headphones size={18} />
              <span><b>Написать в поддержку</b><small>Telegram</small></span>
            </a>
          </section>

          <button
            className="site-order-copy"
            type="button"
            onClick={onCopyOrderNumber}
          >
            <Copy size={16} />Скопировать номер заказа
          </button>
        </aside>
      </div>
    </section>
  );
}

function CustomerOrdersContent({ siteCustomer, isCustomerLoading, openAuthModal }) {
  const orderId = useMemo(() => getCustomerOrderIdFromPath(), []);
  const localPreviewOrder = useMemo(
    () =>
      isLocalPreview() && (!orderId || orderId.startsWith("demo-"))
        ? makeLocalPreviewOrder(orderId || "demo-current-order")
        : null,
    [orderId]
  );
  const cachedOrder = useMemo(
    () => readCurrentCustomerOrder(orderId) || localPreviewOrder,
    [localPreviewOrder, orderId]
  );
  const [order, setOrder] = useState(cachedOrder);
  const [orders, setOrders] = useState(() => (cachedOrder ? [cachedOrder] : []));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [dialogType, setDialogType] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState("");

  useBodyScrollLock(Boolean(dialogType), () => {
    if (!actionSubmitting) setDialogType("");
  });

  useEffect(() => {
    if (!order && localPreviewOrder) {
      setOrder(localPreviewOrder);
      setOrders([localPreviewOrder]);
    }
  }, [localPreviewOrder, order]);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!siteCustomer?.id) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError("");

    try {
      const endpoint = orderId
        ? `${apiPath("customerOrders")}/${encodeURIComponent(orderId)}`
        : apiPath("customerOrders");
      const data = await fetch(endpoint, { credentials: "include" }).then(readJson);
      if (orderId) {
        setOrder(saveCurrentCustomerOrder(data.order));
      } else {
        setOrders(data.orders || []);
        if (data.orders?.[0]) saveCurrentCustomerOrder(data.orders[0]);
      }
    } catch (error) {
      if (!cachedOrder || !isLocalPreview()) {
        setLoadError(error.message || "Не удалось загрузить заказ");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cachedOrder, orderId, siteCustomer?.id]);

  useEffect(() => {
    if (isCustomerLoading) return;
    if (!siteCustomer?.id) {
      setLoading(false);
      return;
    }
    loadOrders();
  }, [isCustomerLoading, loadOrders, siteCustomer?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!siteCustomer?.id || !orderId || CLOSED_STATUSES.has(order?.status)) return undefined;
    const timer = window.setInterval(() => loadOrders({ silent: true }), 12_000);
    return () => window.clearInterval(timer);
  }, [loadOrders, order?.status, orderId, siteCustomer?.id]);

  async function setupCustomerPush() {
    if (pushLoading) return;
    setPushLoading(true);
    setPushStatus("Запрашиваем разрешение...");
    try {
      const push = await subscribeForOrderPush();
      if (!push.ok || !push.subscription) {
        setPushStatus(push.message);
        return;
      }

      await fetch(apiPath("customerPush"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: push.subscription })
      }).then(readJson);
      setPushStatus("Уведомления о статусах включены.");
    } catch (error) {
      setPushStatus(error.message || "Не удалось включить уведомления");
    } finally {
      setPushLoading(false);
    }
  }

  async function submitAction(text) {
    if (!order?.id || !dialogType) return;
    setActionSubmitting(true);
    setActionError("");

    try {
      const suffix = dialogType === "cancel" ? "cancel" : "change-request";
      const data = await fetch(
        `${apiPath("customerOrders")}/${encodeURIComponent(order.id)}/${suffix}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dialogType === "cancel" ? { reason: text } : { text })
        }
      ).then(readJson);
      setOrder(saveCurrentCustomerOrder(data.order));
      setDialogType("");
      setNotice(dialogType === "cancel" ? "Заказ отменён." : "Изменения отправлены ресторану.");
    } catch (error) {
      if (isLocalPreview() && order) {
        const nextOrder = dialogType === "cancel"
          ? {
              ...order,
              status: "cancelled",
              statusLabel: "Отменён",
              cancelReason: text.trim() || "Отменён гостем в первые 2,5 минуты",
              cancelledAt: new Date().toISOString(),
              refundStatus: order.paymentDemo ? "not_required_demo" : "requested"
            }
          : {
              ...order,
              customerChangeRequest: {
                text: text.trim(),
                status: "pending",
                createdAt: new Date().toISOString()
              }
            };
        setOrder(saveCurrentCustomerOrder(nextOrder));
        setDialogType("");
        setNotice(dialogType === "cancel" ? "Демо-заказ отменён." : "Демо-запрос отправлен ресторану.");
      } else {
        setActionError(error.message || "Не удалось выполнить действие");
      }
    } finally {
      setActionSubmitting(false);
    }
  }

  if (isCustomerLoading) {
    return <div className="site-order-loading"><RefreshCw size={22} className="is-spinning" />Открываем кабинет</div>;
  }

  if (!siteCustomer?.id) {
    return (
      <section className="site-order-auth-gate">
        <ShoppingBag size={30} />
        <h1>Войдите, чтобы увидеть заказ</h1>
        <p>Заказы доступны только владельцу аккаунта, с которого они были оформлены.</p>
        <button type="button" onClick={openAuthModal}>Войти в кабинет</button>
        <a href={getSiteHomePath()}>Вернуться на сайт</a>
      </section>
    );
  }

  if (loadError && !(orderId ? order : orders.length)) {
    return (
      <section className="site-order-auth-gate">
        <CircleHelp size={30} />
        <h1>Не удалось открыть заказ</h1>
        <p>{loadError}</p>
        <button type="button" onClick={() => loadOrders()}>Попробовать ещё раз</button>
        <a href={getCustomerOrdersPath()}>Мои заказы</a>
      </section>
    );
  }

  return (
    <>
      <div className={`site-order-push-card ${pushStatus.includes("включены") ? "is-active" : ""}`}>
        <BellRing size={18} />
        <div>
          <b>Статусы заказа в уведомлениях</b>
          <span>{pushStatus || "Сообщим, когда ресторан примет заказ, начнёт готовить и передаст курьеру."}</span>
        </div>
        <button type="button" onClick={setupCustomerPush} disabled={pushLoading}>
          {pushLoading ? "Включаем..." : pushStatus.includes("включены") ? "Включено" : "Включить"}
        </button>
      </div>
      {orderId ? (
        loading && !order ? (
          <div className="site-order-loading"><RefreshCw size={22} className="is-spinning" />Загружаем заказ</div>
        ) : order ? (
          <CustomerOrderDetails
            order={order}
            now={now}
            refreshing={refreshing}
            notice={notice}
            onRefresh={() => loadOrders({ silent: true })}
            onOpenAction={(type) => {
              setActionError("");
              setDialogType(type);
            }}
            onCopyOrderNumber={() => {
              navigator.clipboard?.writeText(String(order.id));
              setNotice("Номер заказа скопирован.");
            }}
          />
        ) : null
      ) : (
        <CustomerOrdersList orders={orders} loading={loading} onRefresh={() => loadOrders({ silent: true })} />
      )}

      {dialogType && order ? (
        <OrderActionDialog
          type={dialogType}
          order={order}
          submitting={actionSubmitting}
          error={actionError}
          onClose={() => {
            if (!actionSubmitting) setDialogType("");
          }}
          onSubmit={submitAction}
        />
      ) : null}
    </>
  );
}

export function SiteCustomerOrdersPage() {
  const fallbackCustomer = isLocalPreview()
    ? { id: "local_order_preview", name: "Гость", email: "" }
    : null;

  return (
    <SitePublicShell
      className="site-customer-orders-page is-header-compact"
      fallbackCustomer={fallbackCustomer}
    >
      {({ siteCustomer, isCustomerLoading, openAuthModal }) => (
        <>
          <CustomerOrdersContent
            siteCustomer={siteCustomer}
            isCustomerLoading={isCustomerLoading}
            openAuthModal={openAuthModal}
          />
          <SiteFooter />
        </>
      )}
    </SitePublicShell>
  );
}
