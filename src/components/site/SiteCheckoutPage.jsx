import "../../styles/site/checkout.css";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  Store,
  Truck,
  UserRound,
  X
} from "lucide-react";
import { DELIVERY_MIN_ORDER_AMOUNT, getDeliveryMinimumRemaining } from "../../../shared/order-rules";
import { evaluatePromoCart } from "../../../shared/promo-rules";
import { apiPath } from "../../utils/api";
import { METRIKA_GOALS, reachMetrikaGoal } from "../../utils/analytics";
import {
  getDeliveryLoadMessage,
  getOrderTimingAvailability,
  getTimeSlots,
  normalizeDeliverySettings
} from "../../utils/deliveryTiming";
import { formatPrice } from "../../utils/price";
import { normalizePhone } from "../../utils/validators";
import { getCartItemDetails, getCartItemImage, getStoredCartSummary, saveStoredPromo } from "./cartModel";
import { fetchCurrentSiteCustomer, forgetSiteCustomer, rememberSiteCustomer } from "./customerSession";
import { savePendingPayment } from "./paymentFlow";
import { SiteAddressModal } from "./SiteAddressFlow";
import { readSiteFulfillment, saveSiteFulfillment } from "./siteFulfillment";
import { SiteAuthModal } from "./SiteAuthModal";
import { SITE_ONBOARDING_DEMO_MODE, SiteContactPhoneModal } from "./SiteContactPhoneModal";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { RESTAURANT, getSiteHomePath, pluralRu } from "./siteData";
import { useDeliverySettings } from "./hooks/useDeliverySettings";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";

function makeCheckoutOrderId() {
  const randomPart = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 18);
  return `WEB-${randomPart || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`.toUpperCase();
}

function makePickupFulfillment() {
  return {
    mode: "pickup",
    address: RESTAURANT.address,
    coords: RESTAURANT.coords,
    entrance: "",
    code: "",
    flat: "",
    floor: "",
    addressComment: ""
  };
}

function hasDeliveryAddress(fulfillment) {
  return fulfillment?.mode === "delivery" && Boolean(fulfillment.address);
}

function getInitialFulfillment() {
  const stored = readSiteFulfillment();
  if (stored.mode === "pickup" || stored.address) {
    return stored.mode === "pickup" ? makePickupFulfillment() : stored;
  }

  return makePickupFulfillment();
}

function getLocalCheckoutPreviewCustomer() {
  if (typeof window === "undefined") return null;
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocalHost || window.location.pathname !== "/dev/checkout") return null;

  return {
    id: "local_checkout_preview",
    name: "Никита",
    phone: "+7 (917) 650-35-12",
    email: "preview@vmestevkusnee.local"
  };
}

function readJson(response) {
  return response.json().catch(() => ({}));
}

function CheckoutSteps({ done = false }) {
  return (
    <div className="site-checkout-steps" aria-label="Шаги оформления">
      <span className="is-done">
        <Check size={14} />
        Корзина
      </span>
      <span className={done ? "is-done" : "is-active"}>2 Оформление заказа</span>
      <span className={done ? "is-active" : ""}>3 Заказ принят</span>
    </div>
  );
}

function isSameCalendarDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatCheckoutSlotLabel(slot, now = new Date()) {
  if (!slot?.value) return slot?.label || "Выбранное время";

  const slotDate = new Date(slot.value);
  const timeLabel = String(slot.label || "").replace(" - ", "–");
  if (isSameCalendarDay(slotDate, now)) return timeLabel;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameCalendarDay(slotDate, tomorrow)) return `Завтра, ${timeLabel}`;

  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short"
  }).format(slotDate);
  return `${dateLabel}, ${timeLabel}`;
}

function OrderSummary({ cartItems, cartItemsLabel, cartSummary, isDelivery }) {
  return (
    <aside className="site-checkout-summary" aria-label="Состав заказа">
      <h2>Состав заказа</h2>
      <div className="site-checkout-summary-list">
        {cartItems.map((item, index) => {
          const qty = Number(item.qty || 0);
          const unitPrice = Number(item.unitPrice || item.price || 0);
          const details = getCartItemDetails(item);

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
      <div className="site-checkout-summary-lines">
        <span>{cartItemsLabel}</span>
        <b>{formatPrice(cartSummary.subtotal)} ₽</b>
        {cartSummary.discount > 0 ? (
          <>
            <span>{cartSummary.discountState?.label || "Скидка"}</span>
            <b>-{formatPrice(cartSummary.discount)} ₽</b>
          </>
        ) : null}
        <span>{isDelivery ? "Доставка" : "Самовывоз"}</span>
        <b>
          {isDelivery
            ? `Бесплатно от ${formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽`
            : "Без минимальной суммы"}
        </b>
      </div>
      <div className="site-checkout-summary-total">
        <span>Сумма заказа</span>
        <b>{formatPrice(cartSummary.total)} ₽</b>
      </div>
    </aside>
  );
}

function TimePickerModal({
  mode,
  slots,
  selectedTime,
  timingAvailability,
  now,
  onSelect,
  onClose
}) {
  const title = mode === "pickup" ? "Время самовывоза" : "Время доставки";

  return (
    <div className="site-checkout-modal-layer" role="presentation">
      <button className="site-checkout-modal-scrim" type="button" aria-label="Закрыть выбор времени" onClick={onClose} />
      <section className="site-checkout-time-modal" role="dialog" aria-modal="true" aria-labelledby="site-checkout-time-title">
        <button className="site-checkout-modal-close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X size={18} />
        </button>
        <h2 id="site-checkout-time-title">{title}</h2>
        {!timingAvailability.asapAvailable ? (
          <div className="site-checkout-time-modal-note">
            <CalendarClock size={18} />
            <span>
              <b>{timingAvailability.title}</b>
              <small>{timingAvailability.message}</small>
            </span>
          </div>
        ) : null}
        <div className="site-checkout-time-grid">
          {timingAvailability.asapAvailable ? (
            <button
              className={selectedTime === "asap" ? "is-active" : ""}
              type="button"
              onClick={() => {
                onSelect("asap");
                onClose();
              }}
            >
              Побыстрее
              {selectedTime === "asap" ? <Check size={16} /> : null}
            </button>
          ) : null}
          {slots.map((slot) => (
            <button
              className={selectedTime === slot.value ? "is-active" : ""}
              type="button"
              key={slot.id}
              onClick={() => {
                onSelect(slot.value);
                onClose();
              }}
            >
              {formatCheckoutSlotLabel(slot, now)}
              {selectedTime === slot.value ? <Check size={16} /> : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SiteCheckoutPage() {
  const [cartSummary, setCartSummary] = useState(() => getStoredCartSummary());
  const cartItems = Array.isArray(cartSummary.cart) ? cartSummary.cart : [];
  const cartItemsLabel = `${cartSummary.count} ${pluralRu(cartSummary.count, "товар", "товара", "товаров")}`;
  const [customer, setCustomer] = useState(null);
  const [isOnboardingSessionComplete, setIsOnboardingSessionComplete] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState(() => getInitialFulfillment());
  const [addressModalMode, setAddressModalMode] = useState(null);
  const { deliverySettings } = useDeliverySettings();
  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings]
  );
  const [clockNow, setClockNow] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState("asap");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [promoCode, setPromoCode] = useState(cartSummary.promo?.code || "");
  const [promoStatus, setPromoStatus] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [yooKassaConfig, setYooKassaConfig] = useState({
    loaded: false,
    configured: false,
    savePaymentMethodEnabled: false,
    mode: ""
  });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const timingAvailability = useMemo(
    () =>
      getOrderTimingAvailability({
        mode: fulfillment.mode,
        settings: normalizedDeliverySettings,
        now: clockNow
      }),
    [clockNow, fulfillment.mode, normalizedDeliverySettings]
  );
  const allTimeSlots = useMemo(
    () =>
      getTimeSlots({
        mode: fulfillment.mode,
        settings: normalizedDeliverySettings,
        now: clockNow,
        count: 24
      }),
    [clockNow, fulfillment.mode, normalizedDeliverySettings]
  );
  const timeSlots = allTimeSlots.slice(0, 4);
  const selectedSlot = allTimeSlots.find((slot) => slot.value === selectedTime);
  const selectedTimeLabel =
    selectedTime === "asap"
      ? "Побыстрее"
      : formatCheckoutSlotLabel(selectedSlot, clockNow);
  const isDelivery = fulfillment.mode === "delivery";
  const deliveryMinimumRemaining = isDelivery
    ? getDeliveryMinimumRemaining(cartSummary.total)
    : 0;
  const hasRequiredOnboarding = Boolean(customer?.requiresOnboarding || customer?.requiresContactPhoneSetup);
  const showOnboardingDemo = Boolean(
    SITE_ONBOARDING_DEMO_MODE && customer?.id && !hasRequiredOnboarding && !isOnboardingSessionComplete
  );
  const needsOnboarding = hasRequiredOnboarding || showOnboardingDemo;
  const customerReady = Boolean(customer?.id && !needsOnboarding);

  useBodyScrollLock(Boolean(isAuthModalOpen || needsOnboarding || addressModalMode || isTimeModalOpen), () => {
    if (needsOnboarding) {
      return;
    }

    if (isTimeModalOpen) {
      setIsTimeModalOpen(false);
      return;
    }

    if (addressModalMode) {
      setAddressModalMode(null);
      return;
    }

    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  });

  useEffect(() => {
    reachMetrikaGoal(METRIKA_GOALS.CHECKOUT_START, {
      cart_total: Number(cartSummary.total || 0),
      items_count: cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentSiteCustomer().then((nextCustomer) => {
      if (cancelled) return;
      const resolvedCustomer = nextCustomer || getLocalCheckoutPreviewCustomer();
      setCustomer(resolvedCustomer || null);
      setIsAuthModalOpen(!resolvedCustomer?.id || new URLSearchParams(window.location.search).has("authLink"));
      setName(resolvedCustomer?.name || "");
      setPhone(resolvedCustomer?.phone ? normalizePhone(resolvedCustomer.phone) : "");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextSummary = getStoredCartSummary();
    setCartSummary(nextSummary);
    setPromoCode(nextSummary.promo?.code || "");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!allTimeSlots.length) return;

    if (!timingAvailability.asapAvailable && selectedTime === "asap") {
      setSelectedTime(allTimeSlots[0].value);
      return;
    }

    if (selectedTime !== "asap" && !allTimeSlots.some((slot) => slot.value === selectedTime)) {
      setSelectedTime(timingAvailability.asapAvailable ? "asap" : allTimeSlots[0].value);
    }
  }, [allTimeSlots, selectedTime, timingAvailability.asapAvailable]);

  useEffect(() => {
    let cancelled = false;

    fetch(apiPath("yooKassaConfig"), { credentials: "include" })
      .then(readJson)
      .then((data) => {
        if (cancelled) return;
        const configured = Boolean(data.ok !== false && data.configured);
        setYooKassaConfig({
          loaded: true,
          configured,
          savePaymentMethodEnabled: configured && Boolean(data.savePaymentMethodEnabled),
          mode: String(data.mode || "")
        });
      })
      .catch(() => {
        if (cancelled) return;
        setYooKassaConfig({
          loaded: true,
          configured: false,
          savePaymentMethodEnabled: false,
          mode: ""
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const syncCart = () => setCartSummary(getStoredCartSummary());

  function openHomeCart() {
    window.location.href = `${getSiteHomePath()}?cart=open`;
  }

  function saveFulfillment(fulfillmentDraft) {
    const nextFulfillment = saveSiteFulfillment(fulfillmentDraft);
    setFulfillment(nextFulfillment);
    setAddressModalMode(null);
    setSelectedTime("asap");
  }

  async function applyPromo(event) {
    event.preventDefault();
    const code = promoCode.trim().toUpperCase();

    if (!code || promoLoading) return;

    setPromoLoading(true);
    setPromoStatus("Проверяем промокод...");

    try {
      const response = await fetch(`${apiPath("promoCodes")}/${encodeURIComponent(code)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true || !data.promo) {
        throw new Error(data.error || "Промокод не найден. Попробуйте другой.");
      }

      const activePromo = { ...data.promo, active: true };
      const promoEvaluation = evaluatePromoCart(activePromo, cartItems);
      if (!promoEvaluation.eligible) {
        throw new Error(promoEvaluation.message);
      }
      saveStoredPromo(activePromo);
      syncCart();
      setPromoCode(data.promo.code);
      setPromoStatus(`Промокод применён: скидка ${data.promo.percent}%`);
    } catch (promoError) {
      saveStoredPromo(null);
      syncCart();
      setPromoStatus(promoError.message || "Промокод не найден. Попробуйте другой.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleAuthenticated(nextCustomer) {
    const remembered = rememberSiteCustomer(nextCustomer);
    setCustomer(remembered);
    setName(remembered?.name || "");
    setPhone(remembered?.phone ? normalizePhone(remembered.phone) : "");
    setIsAuthModalOpen(false);
  }

  async function logoutCustomer() {
    try {
      await fetch(apiPath("customerAuthLogout"), {
        method: "POST",
        credentials: "include"
      }).then(readJson);
    } catch {
      // Local preview can run without API.
    }

    forgetSiteCustomer();
    setCustomer(null);
    setIsOnboardingSessionComplete(false);
    setIsAuthModalOpen(true);
  }

  async function submitOrder() {
    if (!customerReady) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!cartItems.length) {
      setStatus("Корзина пустая. Вернитесь в меню и добавьте блюда.");
      return;
    }

    if (isDelivery && deliveryMinimumRemaining > 0) {
      setStatus(
        `Минимальная сумма доставки после скидок — ${formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽. ` +
          `Добавьте блюда ещё на ${formatPrice(deliveryMinimumRemaining)} ₽ или выберите самовывоз.`
      );
      return;
    }

    if (!name.trim()) {
      setStatus("Укажите имя.");
      return;
    }

    if (!phone.trim()) {
      setStatus("Укажите телефон.");
      return;
    }

    if (isDelivery && !hasDeliveryAddress(fulfillment)) {
      setStatus("Выберите адрес доставки.");
      return;
    }

    if (!timingAvailability.asapAvailable && selectedTime === "asap") {
      setStatus("Выберите доступное время для отложенного заказа.");
      setIsTimeModalOpen(true);
      return;
    }

    if (!yooKassaConfig.configured) {
      setStatus("Онлайн-оплата временно недоступна. Попробуйте немного позже.");
      return;
    }

    const order = {
      id: makeCheckoutOrderId(),
      createdAt: new Date().toISOString(),
      mode: fulfillment.mode,
      address: fulfillment.mode === "pickup" ? RESTAURANT.address : fulfillment.address,
      coords: fulfillment.coords,
      entrance: fulfillment.entrance,
      code: fulfillment.code,
      flat: fulfillment.flat,
      floor: fulfillment.floor,
      addressComment: fulfillment.addressComment,
      customerId: customer.id,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: customer.email || "",
      orderComment: comment.trim(),
      requestedTime: selectedTimeLabel,
      requestedAt: selectedTime === "asap" ? null : selectedTime,
      deliveryLoad: getDeliveryLoadMessage(normalizedDeliverySettings),
      payment: "Оплатить онлайн",
      paymentCardSaveRequested: saveCard,
      discount: cartSummary.discountState?.active,
      discountLabel: cartSummary.discountState?.label,
      promoCode:
        cartSummary.discountState?.source === "promo" && cartSummary.promo?.active
          ? cartSummary.promo.code
          : "",
      subtotal: cartSummary.subtotal,
      discountAmount: cartSummary.discount,
      total: cartSummary.total,
      items: cartItems.map((item) => ({
        id: item.productId || item.id,
        productId: item.productId || item.id,
        category: item.categoryId || item.category || "",
        categoryId: item.categoryId || item.category || "",
        name: item.name,
        qty: item.qty,
        price: item.unitPrice || item.price,
        lineTotal: Number(item.unitPrice || item.price || 0) * Number(item.qty || 0),
        size: item.size,
        dough: item.dough,
        weight: item.weight,
        comboItems: item.comboItems,
        customizations: item.customizations,
        addons: item.addons,
        removed: item.removed
      }))
    };

    setSubmitting(true);
    savePendingPayment({
      order,
      paymentId: "online-card",
      paymentMode: yooKassaConfig.mode,
      cartItems,
      cartSummary
    });
    reachMetrikaGoal(METRIKA_GOALS.ORDER_CREATED, {
      order_id: order.id,
      order_total: Number(order.total || 0),
      fulfillment: order.mode,
      items_count: order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    });
    setStatus("Переходим к оплате...");
    window.location.href = "/payment";
  }

  return (
    <main className="site-showcase site-checkout-page is-header-compact">
      <SiteHeader
        customer={customer}
        hasCartItems={Boolean(cartItems.length)}
        cartSummary={cartSummary}
        isCartDrawerOpen={false}
        isCartDrawerClosing={false}
        deliverySettings={normalizedDeliverySettings}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onCartClick={openHomeCart}
      />

      <section className="site-checkout-shell">
        <div className="site-checkout-flowbar">
          <CheckoutSteps done={orderSent} />
        </div>
        {orderSent ? (
          <div className="site-checkout-success">
            <Check size={34} />
            <h1>Заказ принят</h1>
            <p>Спасибо. Администратор увидит заказ, а мы начнем готовить.</p>
            <a href={getSiteHomePath()}>Вернуться на сайт</a>
          </div>
        ) : (
          <div className="site-checkout-layout">
            <section className="site-checkout-form" aria-label="Оформление заказа">
              {!customerReady ? (
                <div className="site-checkout-auth-gate">
                  <h1>Войдите, чтобы оформить заказ</h1>
                  <p>Корзина остается на месте. После входа продолжим оформление на этой странице.</p>
                  <button type="button" onClick={() => setIsAuthModalOpen(true)}>
                    Войти или зарегистрироваться
                  </button>
                </div>
              ) : (
                <>
                  <header className="site-checkout-title">
                    <div>
                      <h1>Оформление заказа</h1>
                      <p>Проверьте контакты, получение и время.</p>
                    </div>
                    <span className="site-checkout-fulfillment-pill">
                      {isDelivery ? <Truck size={16} /> : <Store size={16} />}
                      {isDelivery ? "Доставка" : "Самовывоз"}
                    </span>
                  </header>

                  <section className="site-checkout-block">
                    <header className="site-checkout-block-head">
                      <UserRound size={18} />
                      <div>
                        <h2>Контакты</h2>
                        <p>Для подтверждения и статуса заказа.</p>
                      </div>
                    </header>
                    <div className="site-checkout-fields-grid">
                      <label className="site-checkout-field">
                        <span>Имя</span>
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Как к вам обращаться"
                          autoComplete="name"
                        />
                      </label>
                      <label className="site-checkout-field">
                        <span>Номер телефона</span>
                        <input
                          value={phone}
                          onChange={(event) => setPhone(normalizePhone(event.target.value))}
                          onFocus={() => !phone && setPhone("+7 ")}
                          placeholder="+7 (999) 999-99-99"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="site-checkout-block">
                    <header className="site-checkout-block-head">
                      <MapPin size={18} />
                      <div>
                        <h2>Получение</h2>
                        <p>{isDelivery ? "Адрес и время доставки." : "Адрес пиццерии и время готовности."}</p>
                      </div>
                    </header>

                    <div className="site-checkout-address-card">
                      <span className="site-checkout-address-icon">
                        {isDelivery ? <Truck size={18} /> : <Store size={18} />}
                      </span>
                      <div className="site-checkout-address-copy">
                        <small>{isDelivery ? "Доставим по адресу" : "Забрать в пиццерии"}</small>
                        <b>{isDelivery ? fulfillment.address || "Адрес не выбран" : RESTAURANT.address}</b>
                      </div>
                      <div className="site-checkout-inline-actions">
                        <button
                          type="button"
                          onClick={() => setAddressModalMode(isDelivery ? "delivery" : "pickup")}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressModalMode(isDelivery ? "pickup" : "delivery")}
                        >
                          {isDelivery ? "Самовывоз" : "Доставка"}
                        </button>
                        {isDelivery ? (
                          <button type="button" onClick={() => setAddressModalMode("delivery")}>
                            <Plus size={14} />
                            Новый адрес
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isDelivery ? (
                      <div
                        className={`site-checkout-minimum ${deliveryMinimumRemaining > 0 ? "is-pending" : "is-ready"}`}
                        role="status"
                      >
                        <Truck size={18} />
                        <span>
                          <b>Минимальная сумма доставки — {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽</b>
                          <small>
                            {deliveryMinimumRemaining > 0
                              ? `После скидок не хватает ${formatPrice(deliveryMinimumRemaining)} ₽. Можно добавить блюда или выбрать самовывоз.`
                              : "Условие выполнено. Доставка бесплатная."}
                          </small>
                        </span>
                      </div>
                    ) : null}

                    <div className="site-checkout-time-section">
                      <div className="site-checkout-subsection-head">
                        <CalendarClock size={17} />
                        <b>{isDelivery ? "Время доставки" : "Время самовывоза"}</b>
                      </div>
                      <div className="site-checkout-time-row">
                        {timingAvailability.asapAvailable ? (
                          <button
                            className={selectedTime === "asap" ? "is-active" : ""}
                            type="button"
                            onClick={() => setSelectedTime("asap")}
                          >
                            Побыстрее
                          </button>
                        ) : null}
                        {timeSlots.slice(0, timingAvailability.asapAvailable ? 2 : 3).map((slot) => (
                          <button
                            className={selectedTime === slot.value ? "is-active" : ""}
                            type="button"
                            key={slot.id}
                            onClick={() => setSelectedTime(slot.value)}
                          >
                            {formatCheckoutSlotLabel(slot, clockNow)}
                          </button>
                        ))}
                        <button className="is-secondary" type="button" onClick={() => setIsTimeModalOpen(true)}>
                          Все варианты
                        </button>
                      </div>
                    </div>

                    {!timingAvailability.asapAvailable ? (
                      <div className="site-checkout-schedule-alert" role="status">
                        <AlertTriangle size={18} />
                        <span>
                          <b>{timingAvailability.title}</b>
                          <small>{timingAvailability.message}</small>
                        </span>
                        <button type="button" onClick={() => setIsTimeModalOpen(true)}>
                          Выбрать время
                        </button>
                      </div>
                    ) : isDelivery ? (
                      <p className="site-checkout-load-note">
                        <Clock3 size={16} />
                        {getDeliveryLoadMessage(normalizedDeliverySettings)}
                      </p>
                    ) : null}
                  </section>

                  <section className="site-checkout-block site-checkout-payment site-checkout-payment-single">
                    <header className="site-checkout-block-head">
                      <CreditCard size={18} />
                      <div>
                        <h2>Оплата</h2>
                        <p>Единственный доступный способ.</p>
                      </div>
                    </header>
                    <div className="site-checkout-payment-option" aria-label="Способ оплаты">
                      <CreditCard size={19} />
                      <span>
                        <b>Оплатить онлайн</b>
                        <small>
                          Банковская карта, СБП и другие способы
                        </small>
                      </span>
                      <Check size={17} />
                    </div>
                    {yooKassaConfig.savePaymentMethodEnabled ? (
                      <label className="site-checkout-save-card">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(event) => setSaveCard(event.target.checked)}
                        />
                        <span>Сохранить карту для будущих заказов</span>
                      </label>
                    ) : null}
                  </section>

                  <section className="site-checkout-block">
                    <header className="site-checkout-block-head">
                      <Plus size={18} />
                      <div>
                        <h2>Дополнительно</h2>
                        <p>Промокод и пожелания к заказу.</p>
                      </div>
                    </header>
                    <div className="site-checkout-extras-grid">
                      <form className="site-checkout-promo" onSubmit={applyPromo}>
                        <label className="site-checkout-field">
                          <span>Промокод</span>
                          <div>
                            <input
                              value={promoCode}
                              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                              placeholder="Введите код"
                            />
                            <button type="submit" disabled={promoLoading}>
                              {promoLoading ? "Проверяем..." : "Применить"}
                            </button>
                          </div>
                        </label>
                        {promoStatus ? <p role="status">{promoStatus}</p> : null}
                      </form>
                      <label className="site-checkout-field site-checkout-comment">
                        <span>Комментарий</span>
                        <input
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="Например: без звонка"
                        />
                      </label>
                    </div>
                  </section>

                  <div className="site-checkout-actions">
                    <button className="site-checkout-back" type="button" onClick={openHomeCart}>
                      <ArrowLeft size={18} />
                      Назад в корзину
                    </button>
                    <button
                      className="site-checkout-submit"
                      type="button"
                      onClick={submitOrder}
                      disabled={submitting || !cartItems.length || (isDelivery && deliveryMinimumRemaining > 0)}
                    >
                      {submitting
                        ? "Переходим..."
                        : isDelivery && deliveryMinimumRemaining > 0
                          ? `Добавьте ещё ${formatPrice(deliveryMinimumRemaining)} ₽`
                          : `К оплате ${formatPrice(cartSummary.total)} ₽`}
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  {status ? (
                    <p className="site-checkout-status" role="alert">
                      {status}
                    </p>
                  ) : null}
                </>
              )}
            </section>

            <OrderSummary
              cartItems={cartItems}
              cartItemsLabel={cartItemsLabel}
              cartSummary={cartSummary}
              isDelivery={isDelivery}
            />
          </div>
        )}
      </section>

      <SiteFooter />

      {isAuthModalOpen && !needsOnboarding ? (
        <SiteAuthModal
          customer={customer}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticated={handleAuthenticated}
          onLogout={logoutCustomer}
        />
      ) : null}

      {needsOnboarding ? (
        <SiteContactPhoneModal
          customer={customer}
          onSaved={handleAuthenticated}
          demoMode={showOnboardingDemo}
          onComplete={() => setIsOnboardingSessionComplete(true)}
        />
      ) : null}

      {addressModalMode ? (
        <SiteAddressModal
          initialFulfillment={{ ...fulfillment, mode: addressModalMode }}
          deliveryTitle="Передвиньте метку или укажите ваш адрес"
          deliveryLead="Цены, меню и акции зависят от адреса. Можно кликнуть по дому на карте или ввести улицу и дом."
          deliverySubmitLabel="Заказать сюда"
          onClose={() => setAddressModalMode(null)}
          onSave={saveFulfillment}
        />
      ) : null}

      {isTimeModalOpen ? (
        <TimePickerModal
          mode={fulfillment.mode}
          slots={allTimeSlots}
          selectedTime={selectedTime}
          timingAvailability={timingAvailability}
          now={clockNow}
          onSelect={setSelectedTime}
          onClose={() => setIsTimeModalOpen(false)}
        />
      ) : null}
    </main>
  );
}
