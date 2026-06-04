import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, MapPin, Send, X } from "lucide-react";
import { RESTAURANT } from "../data/config";
import { calculateCartTotals, formatPrice } from "../utils/price";
import { hasErrors, normalizePhone, validateCheckout } from "../utils/validators";

const PAYMENT_OPTIONS = [
  { id: "cash", label: "наличными", icon: Banknote },
  { id: "card", label: "картой при получении", icon: CreditCard }
];

export default function CheckoutSheet({
  cart,
  promo,
  offer,
  fulfillment,
  customer,
  onClose,
  onSubmit
}) {
  const totals = useMemo(() => calculateCartTotals(cart, promo, offer), [cart, offer, promo]);
  const [form, setForm] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    comment: "",
    payment: "cash"
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: customer.name || "",
      phone: customer.phone || ""
    }));
  }, [customer.name, customer.phone]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: key === "phone" ? normalizePhone(value) : value
    }));
    setErrors((current) => ({
      ...current,
      [key === "name" ? "customerName" : key === "phone" ? "customerPhone" : key]: ""
    }));
  }

  async function submitOrder() {
    const order = {
      createdAt: new Date().toISOString(),
      mode: fulfillment.mode,
      address: fulfillment.mode === "pickup" ? RESTAURANT.address : fulfillment.address,
      coords: fulfillment.coords,
      entrance: fulfillment.entrance,
      flat: fulfillment.flat,
      floor: fulfillment.floor,
      addressComment: fulfillment.addressComment,
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      orderComment: form.comment.trim(),
      payment: form.payment === "cash" ? "наличными" : "картой при получении",
      discount: totals.discountState.active,
      discountLabel: totals.discountState.label,
      promoCode: promo?.active ? promo.code : "",
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      total: totals.total,
      items: cart.map((item) => ({
        id: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.unitPrice,
        lineTotal: item.unitPrice * item.qty,
        size: item.size,
        dough: item.dough,
        addons: item.addons,
        removed: item.removed
      }))
    };

    const nextErrors = validateCheckout(order);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setStatus("Проверьте поля оформления.");
      return;
    }

    setSending(true);
    setStatus("Отправляем заказ...");

    try {
      const response = await fetch("/.netlify/functions/send-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Заказ не отправился");
      }

      setStatus("Заказ отправлен");
      onSubmit(order);
    } catch (error) {
      setStatus(error.message || "Не удалось отправить заказ");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Оформление заказа">
      <button className="sheet-dim" type="button" onClick={onClose} aria-label="Закрыть оформление" />
      <section className="bottom-sheet checkout-sheet">
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Последний шаг</p>
            <h2>{fulfillment.mode === "pickup" ? "Самовывоз" : "Доставка"}</h2>
          </div>
          <button className="sheet-icon-close" type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-address">
          <MapPin size={18} />
          <div>
            <b>{fulfillment.mode === "pickup" ? RESTAURANT.address : fulfillment.address}</b>
            <span>
              {fulfillment.mode === "pickup"
                ? `Забрать из пиццерии, ${RESTAURANT.pickupEta}`
                : `Курьер привезёт заказ, ${RESTAURANT.deliveryEta}`}
            </span>
          </div>
        </div>

        <label className={`field ${errors.customerName ? "has-error" : ""}`}>
          <span>Имя</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ваше имя"
            autoComplete="name"
          />
          {errors.customerName ? <small>{errors.customerName}</small> : null}
        </label>

        <label className={`field ${errors.customerPhone ? "has-error" : ""}`}>
          <span>Телефон</span>
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+7"
            inputMode="tel"
            autoComplete="tel"
          />
          {errors.customerPhone ? <small>{errors.customerPhone}</small> : null}
        </label>

        <label className="field">
          <span>Комментарий к заказу</span>
          <input
            value={form.comment}
            onChange={(event) => updateField("comment", event.target.value)}
            placeholder="Например: без звонка"
          />
        </label>

        <div className="payment-options" role="radiogroup" aria-label="Оплата">
          {PAYMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                className={form.payment === option.id ? "active" : ""}
                onClick={() => updateField("payment", option.id)}
              >
                <Icon size={18} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="checkout-total">
          <span>К оплате</span>
          <b>{formatPrice(totals.total)} ₽</b>
        </div>

        <button className="primary-action" type="button" onClick={submitOrder} disabled={sending}>
          <Send size={18} />
          {sending ? "Отправляем..." : "Отправить заказ"}
        </button>
        {status ? <p className={`sheet-status ${status === "Заказ отправлен" ? "ok" : ""}`}>{status}</p> : null}
      </section>
    </div>
  );
}
