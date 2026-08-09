import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React, { useRef, useState, useCallback, useEffect, useId, useMemo, lazy, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { CalendarDays, ChefHat, Heart, ArrowRight, X, Clock, MapPin, Pizza, Truck, CalendarCheck, CheckCircle2, Baby, Utensils, UserRound, ShoppingBag, Menu, Clock3, Activity, Star, Phone, MessageCircle, ArrowLeft, CopyPlus, ChevronDown, CakeSlice, HeartHandshake, Users } from "lucide-react";
const SITE_ORIGIN = "https://vmestevkusnee.ru";
const MASTERCLASSES_PATH = "/master-klassy";
const INDIVIDUAL_MASTERCLASS_PATH = `${MASTERCLASSES_PATH}/individualnyy-master-klass`;
const augustNinthPizzaPath = `${MASTERCLASSES_PATH}/pizza-vetchina-griby-9-avgusta-2026`;
const augustSixteenthPizzaPath = `${MASTERCLASSES_PATH}/pizza-vetchina-griby-16-avgusta-2026`;
const MASTERCLASS_EVENTS = Object.freeze([
  Object.freeze({
    id: "pizza-2026-08-09",
    slug: "pizza-vetchina-griby-9-avgusta-2026",
    path: augustNinthPizzaPath,
    legacyPaths: Object.freeze([
      `${MASTERCLASSES_PATH}/pizza-vetchina-griby-2-avgusta-2026`
    ]),
    pageMode: "archive",
    title: "Мастер-класс по приготовлению пиццы",
    cardTitle: "Пицца с ветчиной и грибами",
    pizza: "Ветчина и грибы",
    pizzaAccusative: "пиццу с ветчиной и грибами",
    pizzaInstrumental: "с ветчиной и грибами",
    toppingsAccusative: "ветчину и грибы",
    finishedPizzaLabel: "готовая пицца с ветчиной и грибами",
    startsAt: "2026-08-09T11:00:00+03:00",
    dateLabel: "Воскресенье, 9 августа 2026",
    shortDateLabel: "9 августа",
    timeLabel: "11:00",
    minimumParticipants: 8,
    pricePerParticipant: 900,
    address: "Чебоксары, улица Пирогова, 1Т",
    shortAddress: "Пирогова, 1Т",
    mapsUrl: "https://yandex.ru/maps/?text=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9F%D0%B8%D1%80%D0%BE%D0%B3%D0%BE%D0%B2%D0%B0%2C%201%D0%A2",
    status: "cancelled",
    shareUrl: `${SITE_ORIGIN}${augustNinthPizzaPath}`,
    imagePath: "/assets/site/masterclass-og.png",
    seoTitle: "Мастер-класс по пицце 9 августа не состоялся | Вместе Вкуснее",
    seoDescription: "Мастер-класс по пицце 9 августа 2026 года не состоялся: группа не набралась. На странице есть ссылка на ближайший мастер-класс с открытой записью."
  }),
  Object.freeze({
    id: "pizza-2026-08-16",
    slug: "pizza-vetchina-griby-16-avgusta-2026",
    path: augustSixteenthPizzaPath,
    legacyPaths: Object.freeze([]),
    pageMode: "registration",
    title: "Мастер-класс по приготовлению пиццы",
    cardTitle: "Пицца с ветчиной и грибами",
    pizza: "Ветчина и грибы",
    pizzaAccusative: "пиццу с ветчиной и грибами",
    pizzaInstrumental: "с ветчиной и грибами",
    toppingsAccusative: "ветчину и грибы",
    finishedPizzaLabel: "готовая пицца с ветчиной и грибами",
    startsAt: "2026-08-16T11:00:00+03:00",
    dateLabel: "Воскресенье, 16 августа 2026",
    shortDateLabel: "16 августа",
    timeLabel: "11:00",
    minimumParticipants: 8,
    pricePerParticipant: 900,
    address: "Чебоксары, улица Пирогова, 1Т",
    shortAddress: "Пирогова, 1Т",
    mapsUrl: "https://yandex.ru/maps/?text=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9F%D0%B8%D1%80%D0%BE%D0%B3%D0%BE%D0%B2%D0%B0%2C%201%D0%A2",
    status: "scheduled",
    shareUrl: `${SITE_ORIGIN}${augustSixteenthPizzaPath}`,
    imagePath: "/assets/site/masterclass-og.png",
    seoTitle: "Мастер-класс по пицце в Чебоксарах 16 августа 2026 | Вместе Вкуснее",
    seoDescription: "Мастер-класс по пицце и лимонаду для детей и взрослых в Чебоксарах. 16 августа в 11:00, участие 900 ₽: готовим вместе с пиццайоло в итальянской печи."
  })
]);
function isMasterclassRegistrationOpen(event, referenceDate = /* @__PURE__ */ new Date()) {
  const referenceTime = new Date(referenceDate).getTime();
  return Boolean(
    (event == null ? void 0 : event.pageMode) === "registration" && new Date(event.startsAt).getTime() > referenceTime
  );
}
function getActiveMasterclassEvent(referenceDate = /* @__PURE__ */ new Date()) {
  return MASTERCLASS_EVENTS.filter((event) => isMasterclassRegistrationOpen(event, referenceDate)).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
}
const MASTERCLASS_EVENT = MASTERCLASS_EVENTS.find((event) => event.pageMode === "registration") || MASTERCLASS_EVENTS[MASTERCLASS_EVENTS.length - 1];
const API_BASE = String("").replace(/\/$/, "");
const PATHS = {
  sendOrder: "/api/send-order",
  yooKassaConfig: "/api/payments/yookassa/config",
  yooKassaCreatePayment: "/api/payments/yookassa/create",
  yooKassaPaymentStatus: "/api/payments/yookassa",
  customerOrders: "/api/customer/orders",
  customerPush: "/api/customer/push",
  adminOrders: "/api/admin/orders",
  adminDashboard: "/api/admin/dashboard",
  adminPush: "/api/admin/push",
  adminSessionLogin: "/api/admin/session/login",
  adminSessionMe: "/api/admin/session/me",
  adminSessionLogout: "/api/admin/session/logout",
  adminPasskeys: "/api/admin/passkeys",
  adminPasskeyRegisterOptions: "/api/admin/passkeys/register/options",
  adminPasskeyRegisterVerify: "/api/admin/passkeys/register/verify",
  adminPasskeyAuthOptions: "/api/admin/passkeys/auth/options",
  adminPasskeyAuthVerify: "/api/admin/passkeys/auth/verify",
  pushConfig: "/api/push-config",
  siteStats: "/api/site/stats",
  siteRecentOrders: "/api/site/recent-orders",
  siteDeliverySettings: "/api/site/delivery-settings",
  siteLostItems: "/api/site/lost-items",
  siteGallery: "/api/site/gallery",
  siteCatalog: "/api/site/catalog",
  masterclassEvent: "/api/masterclasses",
  promoCodes: "/api/promo-codes",
  reviewSummary: "/api/reviews/summary",
  productReviews: "/api/reviews/products",
  adminPartners: "/api/admin/partners",
  adminPromoCodes: "/api/admin/promo-codes",
  adminReviews: "/api/admin/reviews",
  adminDeliverySettings: "/api/admin/delivery-settings",
  adminLostItems: "/api/admin/lost-items",
  adminBloggerReviewRewards: "/api/admin/blogger-review-rewards",
  adminGallery: "/api/admin/gallery",
  adminCatalog: "/api/admin/catalog",
  adminCatalogCategories: "/api/admin/catalog/categories",
  adminCatalogProducts: "/api/admin/catalog/products",
  partnerLogin: "/api/partners/login",
  partnerMe: "/api/partners/me",
  customerAuthMe: "/api/auth/me",
  customerAuthOAuthStart: "/api/auth/oauth/start",
  customerAuthLink: "/api/auth/link",
  customerAuthContactPhone: "/api/auth/contact-phone",
  customerAuthPreferences: "/api/auth/preferences",
  customerAuthOnboardingChildren: "/api/auth/onboarding/children",
  customerAuthOnboardingEmail: "/api/auth/onboarding/email",
  customerAuthEmailVerificationConfig: "/api/auth/email-verification/config",
  customerAuthEmailVerificationStart: "/api/auth/email-verification/start",
  customerAuthEmailVerificationVerify: "/api/auth/email-verification/verify",
  customerAuthLogout: "/api/auth/logout"
};
function apiPath(name) {
  const path = PATHS[name];
  if (!path) {
    throw new Error(`Unknown API path: ${name}`);
  }
  return `${API_BASE}${path}`;
}
const RESTAURANT = {
  name: "Вместе Вкуснее",
  subtitle: "Семейная пиццерия",
  address: "Чебоксары, ул. Пирогова, 1Т",
  shortAddress: "Пирогова, 1Т",
  phone: "+7 (8352) 66-77-77",
  workHours: "09:00–22:00",
  coords: {
    lat: 56.140976,
    lng: 47.223716
  },
  deliveryEta: "примерно 45 мин",
  pickupEta: "15–20 мин"
};
const BUSINESS_PROFILES = Object.freeze({
  vk: "https://vk.com/vmeste_vkusnee21",
  telegram: "https://t.me/vmestevkusneecheb",
  yandexMaps: "https://yandex.ru/maps/org/vmeste_vkusneye/99987259503/",
  twoGis: "https://2gis.ru/cheboksary/firm/70000001082005443"
});
Object.freeze(Object.values(BUSINESS_PROFILES));
const DELIVERY_URL = "/checkout";
const PARTNERS_URL = "/partners";
const PHONE = RESTAURANT.phone;
const SOCIAL_LINKS = BUSINESS_PROFILES;
const ASSET = "/assets/site/";
const DELIVERY_STORAGE_KEY = "vv_delivery_mvp_state";
const CART_DRAWER_EXIT_MS = 340;
const headerLinks = [
  { label: "Работа Вместе Вкуснее", href: "#contacts" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
  { label: "Корпоративные заказы", href: "#events" },
  { label: "Банкеты, праздники, дни рождения", href: "#events" },
  { label: "Сертификаты", href: "#contacts" },
  { label: "Потеряшки", href: "/lost" },
  { label: "Акции", href: "#menu" }
];
const categoryVisuals = {
  starter: { image: `${ASSET}concept-pizza-table.webp`, tone: "warm" },
  combo: { image: `${ASSET}concept-pizza-table.webp`, tone: "pizza" },
  breakfast: { image: `${ASSET}concept-breakfast.webp`, tone: "neutral" },
  "breakfast-addon": { image: `${ASSET}concept-breakfast.webp`, tone: "neutral" },
  summer: { image: `${ASSET}concept-menu.webp`, tone: "summer" },
  salad: { image: `${ASSET}concept-salad.jpg`, tone: "green" },
  soup: { image: `${ASSET}concept-breakfast.webp`, tone: "neutral" },
  main: { image: `${ASSET}concept-pasta.jpg`, tone: "warm" },
  side: { image: `${ASSET}concept-salad.jpg`, tone: "green" },
  pasta: { image: `${ASSET}concept-pasta.jpg`, tone: "warm" },
  dumplings: { image: `${ASSET}concept-breakfast.webp`, tone: "neutral" },
  pizza: { image: `${ASSET}concept-pizza-hero.png`, tone: "pizza" },
  waffle: { image: `${ASSET}concept-croissant.webp`, tone: "sweet" },
  kids: { image: `${ASSET}concept-kids-zone.webp`, tone: "kids" },
  bread: { image: `${ASSET}concept-pizza-table.webp`, tone: "warm" },
  dessert: { image: `${ASSET}concept-cake.webp`, tone: "sweet" },
  drink: { image: `${ASSET}concept-breakfast.webp`, tone: "drink" }
};
const emptyCartSummary = {
  cart: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  total: 0,
  discountState: { active: false, percent: 0 }
};
function telHref(phone) {
  return `tel:${phone.replace(/\D/g, "")}`;
}
function pluralRu(value, one, few, many) {
  const number = Math.abs(Number(value) || 0);
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
function getSiteHomePath() {
  if (typeof window === "undefined") return "/";
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal || window.location.pathname.startsWith("/dev") ? "/dev" : "/";
}
function getSitePagePath(path) {
  const normalizedPath = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`;
  return getSiteHomePath() === "/dev" ? `/dev${normalizedPath}` : normalizedPath;
}
function getSiteOrderPath() {
  return `${getSiteHomePath()}#menu`;
}
function getCategoryVisual(categoryId) {
  return categoryVisuals[categoryId] || categoryVisuals.pizza;
}
const EVENT = getActiveMasterclassEvent() || MASTERCLASS_EVENT;
const PROMO_SEEN_KEY = `vv_masterclass_promo_seen:${EVENT.id}:v1`;
const AUTO_OPEN_DELAY_MS = 1200;
const MOSCOW_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
async function readApiJson$1(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось загрузить данные мастер-класса");
  }
  return data;
}
function getUrgencyLabels() {
  const now = Date.now();
  const eventDateKey = MOSCOW_DATE_FORMATTER.format(new Date(EVENT.startsAt));
  const todayKey = MOSCOW_DATE_FORMATTER.format(new Date(now));
  const tomorrowKey = MOSCOW_DATE_FORMATTER.format(new Date(now + 24 * 60 * 60 * 1e3));
  if (eventDateKey === todayKey) {
    return { date: `Сегодня, ${EVENT.shortDateLabel}`, kicker: "Уже сегодня" };
  }
  if (eventDateKey === tomorrowKey) {
    return { date: `Завтра, ${EVENT.shortDateLabel}`, kicker: "Уже завтра" };
  }
  return { date: EVENT.shortDateLabel, kicker: "Скоро" };
}
function SiteMasterclassPromo({ isDialogOpen = false, onOpen, onClose }) {
  const dialogRef = useRef(null);
  const hasAutoOpenedRef = useRef(false);
  const [eventState, setEventState] = useState({
    registeredParticipants: 0,
    registrationOpen: EVENT.pageMode === "registration"
  });
  const eventPath = getSitePagePath(EVENT.path);
  const registeredParticipants = Math.max(0, Number(eventState.registeredParticipants || 0));
  const participantLabel = `${registeredParticipants} ${pluralRu(
    registeredParticipants,
    "участник",
    "участника",
    "участников"
  )}`;
  const urgencyLabels = getUrgencyLabels();
  const eventHasStarted = Date.now() >= new Date(EVENT.startsAt).getTime();
  const registrationOpen = eventState.registrationOpen !== false && !eventHasStarted;
  const loadEvent = useCallback(async () => {
    try {
      const data = await fetch(`${apiPath("masterclassEvent")}/${EVENT.id}`, {
        headers: { Accept: "application/json" }
      }).then(readApiJson$1);
      setEventState(data.event);
    } catch {
    }
  }, []);
  useEffect(() => {
    loadEvent();
    const interval = window.setInterval(loadEvent, 2e4);
    return () => window.clearInterval(interval);
  }, [loadEvent]);
  useEffect(() => {
    if (!registrationOpen || hasAutoOpenedRef.current) return void 0;
    try {
      if (window.localStorage.getItem(PROMO_SEEN_KEY) === "1") {
        hasAutoOpenedRef.current = true;
        return void 0;
      }
    } catch {
    }
    const timeout = window.setTimeout(() => {
      hasAutoOpenedRef.current = true;
      onOpen == null ? void 0 : onOpen();
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [onOpen, registrationOpen]);
  useEffect(() => {
    if (!isDialogOpen) return;
    try {
      window.localStorage.setItem(PROMO_SEEN_KEY, "1");
    } catch {
    }
  }, [isDialogOpen]);
  useEffect(() => {
    if (!isDialogOpen) return void 0;
    const dialog = dialogRef.current;
    const previousActiveElement = document.activeElement;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = () => Array.from((dialog == null ? void 0 : dialog.querySelectorAll(focusableSelector)) || []);
    const frame = window.requestAnimationFrame(() => {
      var _a;
      return (_a = focusableElements()[0]) == null ? void 0 : _a.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog == null ? void 0 : dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      var _a;
      window.cancelAnimationFrame(frame);
      dialog == null ? void 0 : dialog.removeEventListener("keydown", handleKeyDown);
      (_a = previousActiveElement == null ? void 0 : previousActiveElement.focus) == null ? void 0 : _a.call(previousActiveElement);
    };
  }, [isDialogOpen]);
  if (!registrationOpen) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("section", { className: "site-masterclass-promo", "aria-labelledby": "site-masterclass-promo-title", children: /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-photo", children: [
        /* @__PURE__ */ jsxs("picture", { children: [
          /* @__PURE__ */ jsx(
            "source",
            {
              type: "image/avif",
              media: "(max-width: 640px)",
              srcSet: "/assets/site/masterclass-promo-hero-480.avif"
            }
          ),
          /* @__PURE__ */ jsx(
            "source",
            {
              type: "image/avif",
              srcSet: "/assets/site/masterclass-promo-hero-480.avif 480w, /assets/site/masterclass-promo-hero-800.avif 800w",
              sizes: "(max-width: 640px) calc(100vw - 28px), (max-width: 860px) 40vw, 594px"
            }
          ),
          /* @__PURE__ */ jsx(
            "source",
            {
              type: "image/webp",
              media: "(max-width: 640px)",
              srcSet: "/assets/site/masterclass-promo-hero-480.webp"
            }
          ),
          /* @__PURE__ */ jsx(
            "source",
            {
              type: "image/webp",
              srcSet: "/assets/site/masterclass-promo-hero-480.webp 480w, /assets/site/masterclass-promo-hero-800.webp 800w",
              sizes: "(max-width: 640px) calc(100vw - 28px), (max-width: 860px) 40vw, 594px"
            }
          ),
          /* @__PURE__ */ jsx(
            "img",
            {
              src: "/assets/site/masterclass-promo-hero-800.webp",
              alt: "Дети на мастер-классе рядом с приготовленными пиццами",
              width: "800",
              height: "383",
              loading: "lazy",
              decoding: "async"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "site-masterclass-promo-date", children: [
          /* @__PURE__ */ jsx(CalendarDays, { size: 18 }),
          urgencyLabels.date,
          " · ",
          EVENT.timeLabel
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-copy", children: [
        /* @__PURE__ */ jsxs("span", { className: "site-masterclass-promo-eyebrow", children: [
          /* @__PURE__ */ jsx(ChefHat, { size: 18 }),
          "Мастер-класс для детей и взрослых"
        ] }),
        /* @__PURE__ */ jsx("h2", { id: "site-masterclass-promo-title", children: "Приходите готовить пиццу вместе" }),
        /* @__PURE__ */ jsxs("p", { children: [
          EVENT.shortDateLabel,
          " наденем фартуки, раскатаем тесто и вместе с пиццайоло испечём настоящую итальянскую пиццу."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-meta", "aria-label": "Условия мастер-класса", children: [
          /* @__PURE__ */ jsxs("strong", { children: [
            EVENT.pricePerParticipant,
            " ₽ ",
            /* @__PURE__ */ jsx("span", { children: "за участника" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "site-masterclass-promo-places", "aria-live": "polite", children: [
            /* @__PURE__ */ jsx(Heart, { size: 18, fill: "currentColor" }),
            "Уже ",
            participantLabel
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            className: "site-masterclass-promo-action",
            href: eventPath,
            "data-metrika-goal": "masterclass_open",
            children: [
              "Записаться",
              /* @__PURE__ */ jsx(ArrowRight, { size: 19 })
            ]
          }
        )
      ] })
    ] }) }),
    isDialogOpen ? /* @__PURE__ */ jsx(
      "div",
      {
        className: "site-masterclass-promo-layer",
        role: "presentation",
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose == null ? void 0 : onClose();
        },
        children: /* @__PURE__ */ jsxs(
          "section",
          {
            ref: dialogRef,
            className: "site-masterclass-promo-dialog",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "site-masterclass-dialog-title",
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-masterclass-promo-close",
                  type: "button",
                  "aria-label": "Закрыть окно мастер-класса",
                  onClick: onClose,
                  children: /* @__PURE__ */ jsx(X, { size: 22 })
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "site-masterclass-promo-dialog-photo", children: /* @__PURE__ */ jsxs("picture", { children: [
                /* @__PURE__ */ jsx(
                  "source",
                  {
                    type: "image/avif",
                    srcSet: "/assets/site/masterclass-promo-hero-480.avif 480w, /assets/site/masterclass-promo-hero-800.avif 800w",
                    sizes: "(max-width: 720px) calc(100vw - 24px), 52vw"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "source",
                  {
                    type: "image/webp",
                    srcSet: "/assets/site/masterclass-promo-hero-480.webp 480w, /assets/site/masterclass-promo-hero-800.webp 800w",
                    sizes: "(max-width: 720px) calc(100vw - 24px), 52vw"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: "/assets/site/masterclass-promo-hero-800.webp",
                    alt: "Дети готовят пиццу на мастер-классе во Вместе Вкуснее",
                    width: "800",
                    height: "383",
                    loading: "eager",
                    fetchpriority: "high"
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-dialog-copy", children: [
                /* @__PURE__ */ jsxs("span", { className: "site-masterclass-promo-dialog-kicker", children: [
                  /* @__PURE__ */ jsx(ChefHat, { size: 18 }),
                  urgencyLabels.kicker
                ] }),
                /* @__PURE__ */ jsx("h2", { id: "site-masterclass-dialog-title", children: "Приходите готовить пиццу вместе" }),
                /* @__PURE__ */ jsxs("p", { children: [
                  EVENT.shortDateLabel,
                  " готовим настоящую итальянскую пиццу вместе с нашим пиццайоло и выпекаем её в итальянской печи."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-dialog-facts", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(CalendarDays, { size: 18 }),
                    urgencyLabels.date
                  ] }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(Clock, { size: 18 }),
                    EVENT.timeLabel
                  ] }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(MapPin, { size: 18 }),
                    "Пирогова, 1Т"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "site-masterclass-promo-places", "aria-live": "polite", children: [
                    /* @__PURE__ */ jsx(Heart, { size: 18, fill: "currentColor" }),
                    "Уже ",
                    participantLabel
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "site-masterclass-promo-dialog-price", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    EVENT.pricePerParticipant,
                    " ₽"
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: "за участника" })
                ] }),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    className: "site-masterclass-promo-dialog-action",
                    href: eventPath,
                    "data-metrika-goal": "masterclass_open",
                    children: [
                      "Записаться на мастер-класс",
                      /* @__PURE__ */ jsx(ArrowRight, { size: 19 })
                    ]
                  }
                )
              ] })
            ]
          }
        )
      }
    ) : null
  ] });
}
const aboutCards = [
  {
    icon: Pizza,
    title: "Итальянское тесто",
    text: "Долгая ферментация, воздушный борт и честные начинки."
  },
  {
    icon: ChefHat,
    title: "Печь Morello Forni",
    text: "Стабильный жар, румяная корочка и вкус живой пиццерии."
  },
  {
    icon: Baby,
    title: "Детская за стеклом",
    text: "Родители отдыхают в зале и видят ребенка рядом."
  },
  {
    icon: Utensils,
    title: "Завтраки и ланчи",
    text: "Работаем каждый день: завтрак, обед, ужин и самовывоз."
  }
];
function SiteAboutSection({ deliveredOrdersTotal = 0, proofAddon = null }) {
  const formattedDeliveredOrders = new Intl.NumberFormat("ru-RU").format(
    Math.max(0, Number(deliveredOrdersTotal) || 0)
  );
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: "site-section-v2 site-about site-about-seo site-about-hero",
      id: "top",
      "aria-labelledby": "site-about-title",
      children: [
        /* @__PURE__ */ jsx("span", { className: "site-anchor", id: "about", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("div", { className: "site-about-copy", children: [
          /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "О пиццерии" }),
          /* @__PURE__ */ jsx("h1", { id: "site-about-title", children: "Семейная итальянская пиццерия в Чебоксарах" }),
          /* @__PURE__ */ jsx("p", { children: "«Вместе Вкуснее» на Пирогова, 1Т - это семейная пиццерия с итальянской пиццей, завтраками, бизнес-ланчами, обедами, праздниками и доставкой по Чебоксарам. Пиццу готовим в печи Morello Forni, а для семей с детьми сделали большую игровую зону за стеклом." }),
          /* @__PURE__ */ jsxs("div", { className: "site-about-actions", children: [
            /* @__PURE__ */ jsxs("a", { className: "site-primary-btn", href: "#summer", children: [
              /* @__PURE__ */ jsx(Pizza, { size: 18 }),
              "Посмотреть меню"
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "site-secondary-btn", href: getSiteOrderPath(), children: [
              /* @__PURE__ */ jsx(Truck, { size: 18 }),
              "Оформить доставку"
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "site-dark-btn", href: telHref(PHONE), children: [
              /* @__PURE__ */ jsx(CalendarCheck, { size: 18 }),
              "Забронировать стол"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "site-about-proof-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "site-about-proof", "aria-label": "Сколько заказов доставили за всё время", children: [
              /* @__PURE__ */ jsxs("span", { className: "site-about-proof-kicker", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 17 }),
                "Всего доставили"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "site-about-proof-value", children: [
                /* @__PURE__ */ jsx("b", { children: formattedDeliveredOrders }),
                /* @__PURE__ */ jsx("small", { children: "заказов" })
              ] }),
              /* @__PURE__ */ jsx("p", { children: "Спасибо, что выбираете нас. С каждым заказом растём и становимся лучше." })
            ] }),
            proofAddon
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "site-about-visual", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxs("picture", { children: [
            /* @__PURE__ */ jsx(
              "source",
              {
                type: "image/avif",
                srcSet: `${ASSET}interior-window-hero-480.avif 480w, ${ASSET}interior-window-hero-720.avif 720w`,
                sizes: "(max-width: 768px) calc(100vw - 52px), 360px"
              }
            ),
            /* @__PURE__ */ jsx(
              "source",
              {
                type: "image/webp",
                srcSet: `${ASSET}interior-window-hero-480.webp 480w, ${ASSET}interior-window-hero-720.webp 720w`,
                sizes: "(max-width: 768px) calc(100vw - 52px), 360px"
              }
            ),
            /* @__PURE__ */ jsx(
              "img",
              {
                src: `${ASSET}interior-window-hero-720.webp`,
                alt: "",
                width: "720",
                height: "636",
                loading: "eager",
                fetchpriority: "high"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Clock, { size: 18 }),
            /* @__PURE__ */ jsx("span", { children: "Ежедневно" }),
            /* @__PURE__ */ jsx("b", { children: RESTAURANT.workHours })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "site-about-card-grid", "aria-label": "Почему к нам приходят", children: aboutCards.map((item) => {
          const Icon = item.icon;
          return /* @__PURE__ */ jsxs("article", { className: "site-about-card", children: [
            /* @__PURE__ */ jsx(Icon, { size: 22 }),
            /* @__PURE__ */ jsx("h3", { children: item.title }),
            /* @__PURE__ */ jsx("p", { children: item.text })
          ] }, item.title);
        }) })
      ]
    }
  );
}
const emptyFulfillment = {
  mode: "delivery",
  address: "",
  coords: null,
  entrance: "",
  code: "",
  flat: "",
  floor: "",
  addressComment: ""
};
function normalizeFulfillment(fulfillment = {}) {
  return {
    ...emptyFulfillment,
    ...fulfillment,
    mode: fulfillment.mode === "pickup" ? "pickup" : "delivery"
  };
}
function readSiteFulfillment() {
  if (typeof window === "undefined") return normalizeFulfillment();
  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    return normalizeFulfillment(parsedState.fulfillment);
  } catch {
    return normalizeFulfillment();
  }
}
function saveSiteFulfillment(fulfillment) {
  if (typeof window === "undefined") return normalizeFulfillment(fulfillment);
  const nextFulfillment = normalizeFulfillment(fulfillment);
  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({ ...parsedState, fulfillment: nextFulfillment })
    );
  } catch {
    window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify({ fulfillment: nextFulfillment }));
  }
  return nextFulfillment;
}
const DELIVERY_SETTINGS_STORAGE_KEY = "vv_delivery_timing_settings";
const DEFAULT_DELIVERY_SETTINGS = {
  minMinutes: 30,
  baseMinutes: 45,
  currentMinutes: 45,
  stepMinutes: 15,
  maxMinutes: 120
};
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeDeliveryMinutes(value) {
  const number = Number(value);
  const minutes = Number.isFinite(number) ? number : DEFAULT_DELIVERY_SETTINGS.currentMinutes;
  const rounded = Math.round(minutes / DEFAULT_DELIVERY_SETTINGS.stepMinutes) * DEFAULT_DELIVERY_SETTINGS.stepMinutes;
  return clamp(rounded, DEFAULT_DELIVERY_SETTINGS.minMinutes, DEFAULT_DELIVERY_SETTINGS.maxMinutes);
}
function normalizeDeliverySettings(settings = {}) {
  return {
    ...DEFAULT_DELIVERY_SETTINGS,
    ...settings,
    minMinutes: DEFAULT_DELIVERY_SETTINGS.minMinutes,
    baseMinutes: DEFAULT_DELIVERY_SETTINGS.baseMinutes,
    stepMinutes: DEFAULT_DELIVERY_SETTINGS.stepMinutes,
    maxMinutes: DEFAULT_DELIVERY_SETTINGS.maxMinutes,
    currentMinutes: normalizeDeliveryMinutes(settings.currentMinutes)
  };
}
function readStoredDeliverySettings() {
  if (typeof window === "undefined") {
    return DEFAULT_DELIVERY_SETTINGS;
  }
  try {
    return normalizeDeliverySettings(JSON.parse(window.localStorage.getItem(DELIVERY_SETTINGS_STORAGE_KEY) || "{}"));
  } catch {
    return DEFAULT_DELIVERY_SETTINGS;
  }
}
function saveStoredDeliverySettings(settings) {
  const normalized = normalizeDeliverySettings(settings);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DELIVERY_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}
function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (safeMinutes < 60) return `${safeMinutes} мин`;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
function getDeliveryLoadLevel(settings) {
  const normalized = normalizeDeliverySettings(settings);
  if (normalized.currentMinutes <= normalized.baseMinutes) {
    return "low";
  }
  return normalized.currentMinutes >= 105 ? "high" : "average";
}
function getDeliveryLoadLabel(settings) {
  const level = getDeliveryLoadLevel(settings);
  if (level === "low") return "низкая загруженность";
  if (level === "high") return "высокая загруженность";
  return "средняя загруженность";
}
function getDeliveryEtaLabel(settings) {
  const normalized = normalizeDeliverySettings(settings);
  return `≈ ${formatDuration(normalized.currentMinutes)}`;
}
function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function optionalPositiveNumber(value) {
  if (value === "" || value === null || value === void 0) return null;
  const number = finiteNumber(value, 0);
  return number > 0 ? number : null;
}
function optionalPositiveInteger(value) {
  const number = optionalPositiveNumber(value);
  return number === null ? null : Math.max(1, Math.floor(number));
}
function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
}
function getItemSubtotal(item) {
  if (!item || typeof item !== "object") return 0;
  const qty = Math.max(0, finiteNumber(item.qty ?? item.quantity, 0));
  const explicitLineTotal = finiteNumber(item.lineTotal, -1);
  if (explicitLineTotal >= 0) return explicitLineTotal;
  return Math.max(0, finiteNumber(item.unitPrice ?? item.price, 0) * qty);
}
function itemMatchesScope(item, promo) {
  const scopeType = ["categories", "products"].includes(promo == null ? void 0 : promo.scopeType) ? promo.scopeType : "all";
  if (scopeType === "all") return true;
  if (scopeType === "categories") {
    const categoryId = String((item == null ? void 0 : item.categoryId) || (item == null ? void 0 : item.category) || "").trim();
    return normalizeIdList(promo == null ? void 0 : promo.categoryIds).includes(categoryId);
  }
  const productId = String((item == null ? void 0 : item.productId) || (item == null ? void 0 : item.id) || "").trim();
  return normalizeIdList(promo == null ? void 0 : promo.productIds).includes(productId);
}
function evaluatePromoCart(promo = {}, items = [], context = {}) {
  const cartItems = Array.isArray(items) ? items : [];
  const subtotal = cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const eligibleSubtotal = cartItems.reduce(
    (sum, item) => sum + (itemMatchesScope(item, promo) ? getItemSubtotal(item) : 0),
    0
  );
  const usageLimit = optionalPositiveInteger(promo.usageLimit);
  const perCustomerLimit = optionalPositiveInteger(promo.perCustomerLimit);
  const countedUses = Math.max(
    0,
    finiteNumber(
      context.totalUsageCount,
      finiteNumber(promo.countedUses, finiteNumber(promo.usageCount, 0))
    )
  );
  const customerUsageCount = Math.max(0, finiteNumber(context.customerUsageCount, 0));
  const minimumOrderAmount = optionalPositiveNumber(promo.minimumOrderAmount);
  const maximumDiscountAmount = optionalPositiveNumber(promo.maximumDiscountAmount);
  const scopeType = ["categories", "products"].includes(promo.scopeType) ? promo.scopeType : "all";
  if (usageLimit !== null && countedUses >= usageLimit) {
    return {
      eligible: false,
      state: "exhausted",
      message: "Лимит использований этого промокода закончился.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }
  if (perCustomerLimit !== null && customerUsageCount >= perCustomerLimit) {
    return {
      eligible: false,
      state: "customer-limit",
      message: "Вы уже использовали этот промокод максимальное число раз.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }
  if (minimumOrderAmount !== null && subtotal < minimumOrderAmount) {
    return {
      eligible: false,
      state: "minimum-order",
      message: `Промокод действует при заказе от ${Math.round(minimumOrderAmount)} ₽.`,
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }
  if (scopeType !== "all" && eligibleSubtotal <= 0) {
    return {
      eligible: false,
      state: "scope-mismatch",
      message: scopeType === "categories" ? "В корзине нет блюд из категорий этого промокода." : "В корзине нет блюд, на которые действует этот промокод.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }
  const percent = Math.max(0, Math.min(100, finiteNumber(promo.percent, 0)));
  const calculatedDiscount = Math.round(eligibleSubtotal * percent / 100);
  const discount = maximumDiscountAmount === null ? calculatedDiscount : Math.min(calculatedDiscount, Math.round(maximumDiscountAmount));
  if (discount <= 0) {
    return {
      eligible: false,
      state: "no-discount",
      message: "Промокод не даёт скидку для текущей корзины.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }
  return {
    eligible: true,
    state: "eligible",
    message: "",
    subtotal,
    eligibleSubtotal,
    discount
  };
}
const formatPrice = (value) => new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0
}).format(Math.max(0, Math.round(Number(value) || 0)));
function getProductOldPrice(product) {
  const currentPrice = Number((product == null ? void 0 : product.price) || 0);
  const oldPrice = Number((product == null ? void 0 : product.oldPrice) || (product == null ? void 0 : product.regularPrice) || (product == null ? void 0 : product.basePrice) || 0);
  return oldPrice > currentPrice ? oldPrice : 0;
}
function getDiscountState(promo, cart = []) {
  const promoPercent = (promo == null ? void 0 : promo.active) ? Number(promo.percent || 0) : 0;
  const promoEvaluation = (promo == null ? void 0 : promo.active) ? evaluatePromoCart(promo, cart) : null;
  const promoDiscount = (promoEvaluation == null ? void 0 : promoEvaluation.eligible) ? promoEvaluation.discount : 0;
  const percent = promoDiscount > 0 ? promoPercent : 0;
  if (!percent) {
    return {
      active: false,
      percent: 0,
      label: "",
      promoEvaluation
    };
  }
  return {
    active: true,
    percent,
    label: promo.label,
    source: "promo",
    promoEvaluation
  };
}
function calculateCartTotals(cart, promo) {
  var _a;
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.qty || 0),
    0
  );
  const discountState = getDiscountState(promo, cart);
  const promoDiscount = discountState.source === "promo" ? Number(((_a = discountState.promoEvaluation) == null ? void 0 : _a.discount) || 0) : 0;
  const discount = discountState.active ? promoDiscount : 0;
  const total = Math.max(0, subtotal - discount);
  return {
    subtotal,
    discount,
    total,
    discountState
  };
}
function getHeaderLinkHref(href) {
  if (!(href == null ? void 0 : href.startsWith("#"))) {
    return href;
  }
  return `${getSiteHomePath()}${href}`;
}
function DeliveryMeta({ className = "", deliverySettings }) {
  return /* @__PURE__ */ jsxs("div", { className: `site-delivery-meta ${className}`.trim(), "aria-label": "Информация о доставке", children: [
    /* @__PURE__ */ jsx("span", { children: "Доставка Чебоксары" }),
    /* @__PURE__ */ jsx("b", { children: getDeliveryEtaLabel(deliverySettings) }),
    /* @__PURE__ */ jsx("span", { children: getDeliveryLoadLabel(deliverySettings) }),
    /* @__PURE__ */ jsxs("b", { className: "site-rating", children: [
      "4.8 ",
      /* @__PURE__ */ jsx(Star, { size: 14, fill: "currentColor" })
    ] })
  ] });
}
function SiteHeader({
  customer = null,
  hasCartItems,
  cartSummary,
  isCartDrawerOpen,
  isCartDrawerClosing,
  deliverySettings,
  onAuthClick,
  onCartClick
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileMenuId = useId();
  const deliveryEtaLabel = getDeliveryEtaLabel(deliverySettings);
  const deliveryLoadLabel = getDeliveryLoadLabel(deliverySettings);
  useEffect(() => {
    if (!isMobileMenuOpen) return void 0;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnOutsideClick = (event) => {
      var _a;
      if (!((_a = headerRef.current) == null ? void 0 : _a.contains(event.target))) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isMobileMenuOpen]);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  return /* @__PURE__ */ jsxs("header", { className: `site-header-v3 ${isMobileMenuOpen ? "is-mobile-menu-open" : ""}`, ref: headerRef, children: [
    /* @__PURE__ */ jsx("div", { className: "site-header-topline", children: /* @__PURE__ */ jsx("nav", { className: "site-header-links", "aria-label": "Дополнительные разделы", children: headerLinks.map((link) => /* @__PURE__ */ jsx("a", { href: getHeaderLinkHref(link.href), children: link.label }, link.label)) }) }),
    /* @__PURE__ */ jsxs("div", { className: "site-header-main", children: [
      /* @__PURE__ */ jsx("a", { className: "site-brand-v3", href: getSiteHomePath(), "aria-label": "На главную", children: /* @__PURE__ */ jsx("span", { className: "site-brand-logo", children: /* @__PURE__ */ jsx("img", { src: `${ASSET}vv-logo-full.svg`, alt: "" }) }) }),
      /* @__PURE__ */ jsx(DeliveryMeta, { className: "site-header-delivery", deliverySettings }),
      /* @__PURE__ */ jsxs("div", { className: "site-header-actions", children: [
        onAuthClick ? /* @__PURE__ */ jsxs(
          "button",
          {
            className: `site-header-login ${customer ? "is-authorized" : ""}`,
            type: "button",
            "aria-haspopup": "dialog",
            "aria-label": customer ? "Открыть личный кабинет" : "Войти в личный кабинет",
            onClick: onAuthClick,
            children: [
              /* @__PURE__ */ jsx(UserRound, { size: 20 }),
              /* @__PURE__ */ jsx("span", { children: customer ? "Кабинет" : "Войти" })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `site-header-cart ${hasCartItems ? "is-filled" : ""}`,
            type: "button",
            "aria-haspopup": "dialog",
            "aria-expanded": isCartDrawerOpen && !isCartDrawerClosing,
            "aria-label": hasCartItems ? `Открыть корзину на сумму ${formatPrice(cartSummary.total)} рублей` : "Открыть пустую корзину",
            onClick: onCartClick,
            children: [
              /* @__PURE__ */ jsx(ShoppingBag, { size: 20 }),
              /* @__PURE__ */ jsx("span", { children: hasCartItems ? `${formatPrice(cartSummary.total)} ₽` : "Корзина" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `site-header-mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`,
          type: "button",
          "aria-label": isMobileMenuOpen ? "Закрыть меню" : "Открыть меню",
          "aria-expanded": isMobileMenuOpen,
          "aria-controls": mobileMenuId,
          onClick: () => setIsMobileMenuOpen((isOpen) => !isOpen),
          children: isMobileMenuOpen ? /* @__PURE__ */ jsx(X, { size: 22, strokeWidth: 2.8 }) : /* @__PURE__ */ jsx(Menu, { size: 22, strokeWidth: 2.8 })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `site-mobile-menu-panel ${isMobileMenuOpen ? "is-open" : ""}`,
        id: mobileMenuId,
        "aria-hidden": !isMobileMenuOpen,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "site-mobile-menu-status", "aria-label": "Информация о доставке", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Clock3, { size: 17 }),
              /* @__PURE__ */ jsx("small", { children: "Среднее время" }),
              /* @__PURE__ */ jsx("b", { children: deliveryEtaLabel })
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Activity, { size: 17 }),
              /* @__PURE__ */ jsx("small", { children: "Загруженность" }),
              /* @__PURE__ */ jsx("b", { children: deliveryLoadLabel })
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Star, { size: 17, fill: "currentColor" }),
              /* @__PURE__ */ jsx("small", { children: "Рейтинг" }),
              /* @__PURE__ */ jsx("b", { children: "4.8" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("nav", { className: "site-mobile-menu-links", "aria-label": "Мобильное меню", children: headerLinks.map((link) => /* @__PURE__ */ jsx("a", { href: getHeaderLinkHref(link.href), onClick: closeMobileMenu, children: link.label }, link.label)) }),
          /* @__PURE__ */ jsxs("div", { className: "site-mobile-menu-actions", children: [
            onAuthClick ? /* @__PURE__ */ jsxs(
              "button",
              {
                className: "site-mobile-menu-action",
                type: "button",
                onClick: () => {
                  closeMobileMenu();
                  onAuthClick();
                },
                children: [
                  /* @__PURE__ */ jsx(UserRound, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: customer ? "Открыть кабинет" : "Войти в кабинет" })
                ]
              }
            ) : null,
            /* @__PURE__ */ jsxs("a", { className: "site-mobile-menu-action", href: telHref(PHONE), onClick: closeMobileMenu, children: [
              /* @__PURE__ */ jsx(Phone, { size: 18 }),
              /* @__PURE__ */ jsx("span", { children: PHONE })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "site-mobile-menu-action", href: `${getSiteHomePath()}#contacts`, onClick: closeMobileMenu, children: [
              /* @__PURE__ */ jsx(MessageCircle, { size: 18 }),
              /* @__PURE__ */ jsx("span", { children: "Обратная связь" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "site-mobile-menu-socials", "aria-label": "Социальные сети", children: [
            /* @__PURE__ */ jsx("a", { href: SOCIAL_LINKS.vk, target: "_blank", rel: "noreferrer", onClick: closeMobileMenu, children: "VK" }),
            /* @__PURE__ */ jsx("a", { href: SOCIAL_LINKS.telegram, target: "_blank", rel: "noreferrer", onClick: closeMobileMenu, children: "Telegram" })
          ] })
        ]
      }
    )
  ] });
}
function SiteMobileCartFab({
  hasCartItems,
  cartSummary,
  isCartDrawerOpen,
  isCartDrawerClosing,
  onCartClick
}) {
  if (!hasCartItems) {
    return null;
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: "site-mobile-cart-fab",
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": isCartDrawerOpen && !isCartDrawerClosing,
      "aria-label": `Открыть корзину на сумму ${formatPrice(cartSummary.total)} рублей`,
      onClick: onCartClick,
      children: [
        /* @__PURE__ */ jsx(ShoppingBag, { size: 19, strokeWidth: 2.6 }),
        /* @__PURE__ */ jsxs("span", { children: [
          formatPrice(cartSummary.total),
          " ₽"
        ] })
      ]
    }
  );
}
const INITIAL_VISIBLE_ORDERS = 3;
const MAX_VISIBLE_ORDERS = 10;
const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow"
});
function getOrderItemsLabel(count) {
  return `${count} ${pluralRu(count, "позиция", "позиции", "позиций")}`;
}
function formatOrderDate(value) {
  if (!value) {
    return "дата уточняется";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return ORDER_DATE_FORMATTER.format(date).replace(",", " в");
}
function getOrderTitle(order) {
  return `Заказ от ${formatOrderDate(order.createdAt)}`;
}
function SiteRecentOrders({ orders = [], isOpen, onOpen, onClose, onAddOrder }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const visibleLimit = Math.min(MAX_VISIBLE_ORDERS, orders.length);
  const visibleOrders = useMemo(
    () => orders.slice(0, Math.min(visibleCount, visibleLimit)),
    [orders, visibleCount, visibleLimit]
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );
  const hiddenCount = Math.max(0, visibleLimit - visibleOrders.length);
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setVisibleCount(INITIAL_VISIBLE_ORDERS);
    setSelectedOrderId(null);
  }, [isOpen]);
  const addOrderToCart = (order) => {
    onAddOrder == null ? void 0 : onAddOrder(order);
    onClose == null ? void 0 : onClose();
  };
  const hasOrders = visibleOrders.length > 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("button", { className: "site-recent-orders-trigger", type: "button", onClick: onOpen, children: [
      /* @__PURE__ */ jsxs("span", { className: "site-recent-orders-kicker", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { size: 17 }),
        "Не знаете, что выбрать?"
      ] }),
      /* @__PURE__ */ jsx("small", { children: "Посмотрите список из 10 последних заказов на сайте и закажите то же самое" }),
      /* @__PURE__ */ jsxs("em", { children: [
        "Посмотреть, что заказывали",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
      ] })
    ] }),
    isOpen ? /* @__PURE__ */ jsxs("div", { className: "site-recent-orders-layer", role: "presentation", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "site-recent-orders-scrim",
          type: "button",
          "aria-label": "Закрыть последние заказы",
          onClick: onClose
        }
      ),
      /* @__PURE__ */ jsxs(
        "section",
        {
          className: "site-recent-orders-dialog",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "site-recent-orders-title",
          children: [
            /* @__PURE__ */ jsxs("header", { className: "site-recent-orders-header", children: [
              selectedOrder ? /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-recent-orders-icon-btn",
                  type: "button",
                  "aria-label": "Вернуться к списку заказов",
                  onClick: () => setSelectedOrderId(null),
                  children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 })
                }
              ) : null,
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { children: "Последние заказы" }),
                /* @__PURE__ */ jsx("h2", { id: "site-recent-orders-title", children: selectedOrder ? getOrderTitle(selectedOrder) : "Что заказывают гости" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "site-recent-orders-close",
                  type: "button",
                  "aria-label": "Закрыть",
                  onClick: onClose,
                  children: /* @__PURE__ */ jsx(X, { size: 24 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "site-recent-orders-scroll", children: selectedOrder ? /* @__PURE__ */ jsxs("div", { className: "site-recent-order-detail", children: [
              /* @__PURE__ */ jsxs("div", { className: "site-recent-order-detail-head", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(Clock3, { size: 16 }),
                  formatOrderDate(selectedOrder.createdAt)
                ] }),
                /* @__PURE__ */ jsxs("strong", { children: [
                  formatPrice(selectedOrder.total),
                  " ₽"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "site-recent-order-lines", children: selectedOrder.items.map((item, index) => /* @__PURE__ */ jsxs("article", { className: "site-recent-order-line", children: [
                /* @__PURE__ */ jsx("img", { src: item.image, alt: "", loading: "lazy" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { children: item.name }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    item.qty > 1 ? `${item.qty} шт. · ` : "",
                    item.weight || "порция"
                  ] }),
                  item.description ? /* @__PURE__ */ jsx("small", { children: item.description }) : null
                ] }),
                /* @__PURE__ */ jsxs("b", { children: [
                  formatPrice(item.unitPrice * item.qty),
                  " ₽"
                ] })
              ] }, `${selectedOrder.id}-${item.productId}-${index}`)) }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-recent-orders-add",
                  type: "button",
                  onClick: () => addOrderToCart(selectedOrder),
                  children: [
                    /* @__PURE__ */ jsx(CopyPlus, { size: 18 }),
                    "Добавить этот заказ в корзину"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("p", { className: "site-recent-orders-note", children: "Здесь последние заказы на нашем сайте. Посмотрите, что выбрали другие гости, и добавьте такой же набор в корзину, если он вам подходит." }),
              hasOrders ? /* @__PURE__ */ jsx("div", { className: "site-recent-orders-list", children: visibleOrders.map((order) => /* @__PURE__ */ jsxs("article", { className: "site-recent-order-card", children: [
                /* @__PURE__ */ jsx("div", { className: "site-recent-order-preview", "aria-hidden": "true", children: order.items.slice(0, 3).map((item, index) => /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: item.image,
                    alt: "",
                    loading: "lazy"
                  },
                  `${order.id}-${item.productId}-${index}`
                )) }),
                /* @__PURE__ */ jsxs("div", { className: "site-recent-order-copy", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx(Clock3, { size: 15 }),
                    formatOrderDate(order.createdAt)
                  ] }),
                  /* @__PURE__ */ jsx("h3", { children: getOrderTitle(order) }),
                  /* @__PURE__ */ jsx("p", { children: "Можно открыть состав или добавить такой же набор в корзину." }),
                  /* @__PURE__ */ jsx("small", { children: getOrderItemsLabel(order.count) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "site-recent-order-side", children: [
                  /* @__PURE__ */ jsxs("strong", { children: [
                    formatPrice(order.total),
                    " ₽"
                  ] }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedOrderId(order.id), children: "Посмотреть состав" }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => addOrderToCart(order), children: "Добавить в корзину" })
                ] })
              ] }, order.id)) }) : /* @__PURE__ */ jsxs("div", { className: "site-recent-orders-empty", children: [
                /* @__PURE__ */ jsx(ShoppingBag, { size: 22 }),
                /* @__PURE__ */ jsx("h3", { children: "Доставленных заказов пока нет" }),
                /* @__PURE__ */ jsx("p", { children: "Когда гости начнут оформлять заказы на сайте, здесь появятся последние наборы для вдохновения." })
              ] }),
              hasOrders && hiddenCount > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-recent-orders-more",
                  type: "button",
                  onClick: () => setVisibleCount(MAX_VISIBLE_ORDERS),
                  children: [
                    "Показать ещё ",
                    hiddenCount,
                    /* @__PURE__ */ jsx(ChevronDown, { size: 18 })
                  ]
                }
              ) : null
            ] }) })
          ]
        }
      )
    ] }) : null
  ] });
}
const SITE_CUSTOMER_STORAGE_KEY = "vv_site_customer";
function isLocalPreview() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
function readLocalSiteCustomer() {
  if (typeof window === "undefined" || !isLocalPreview()) return null;
  try {
    return JSON.parse(window.localStorage.getItem(SITE_CUSTOMER_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}
function rememberSiteCustomer(customer) {
  if (!(customer == null ? void 0 : customer.id) || typeof window === "undefined") return customer || null;
  if (isLocalPreview() || String(customer.id).startsWith("local_")) {
    window.localStorage.setItem(SITE_CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
  }
  return customer;
}
function forgetSiteCustomer() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SITE_CUSTOMER_STORAGE_KEY);
  }
}
async function fetchCurrentSiteCustomer() {
  try {
    const response = await fetch(apiPath("customerAuthMe"), { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok !== false && data.customer) {
      return data.customer;
    }
  } catch {
  }
  return readLocalSiteCustomer();
}
const LOCK_SCROLL_ALLOW_SELECTOR = [
  ".site-product-modal-scroll",
  ".site-product-modal.is-combo .site-product-modal-visual",
  ".site-cart-drawer",
  ".site-address-panel",
  ".site-address-map",
  ".site-auth-modal",
  ".site-checkout-time-modal",
  ".site-gallery-lightbox",
  ".site-lost-contact-modal",
  ".site-lost-photo-modal",
  ".site-recent-orders-scroll",
  ".site-masterclass-promo-dialog"
].join(", ");
function getElementTarget(target) {
  if ((target == null ? void 0 : target.nodeType) === 1) {
    return target;
  }
  return (target == null ? void 0 : target.parentElement) || null;
}
function getAllowedScrollElement(target) {
  var _a;
  return ((_a = getElementTarget(target)) == null ? void 0 : _a.closest(LOCK_SCROLL_ALLOW_SELECTOR)) || null;
}
function isFreeGestureElement(element) {
  return Boolean(
    element == null ? void 0 : element.matches(".site-address-map, .site-product-modal.is-combo .site-product-modal-visual")
  );
}
function canScrollElement(element, deltaY) {
  if (!element || isFreeGestureElement(element)) {
    return true;
  }
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 1) {
    return false;
  }
  if (deltaY < 0) {
    return element.scrollTop > 0;
  }
  if (deltaY > 0) {
    return element.scrollTop < maxScrollTop - 1;
  }
  return true;
}
const LOCKED_SCROLL_KEYS = /* @__PURE__ */ new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " "
]);
function scrollToLockedPosition(scrollY) {
  try {
    window.scrollTo({ left: 0, top: scrollY, behavior: "instant" });
  } catch {
    window.scrollTo(0, scrollY);
  }
}
function useBodyScrollLock(isLocked, onEscape) {
  const onEscapeRef = useRef(onEscape);
  const touchStartYRef = useRef(0);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);
  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return void 0;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || html.scrollTop || 0;
    const previousHtmlStyles = {
      height: html.style.height,
      overflow: html.style.overflow,
      overflowX: html.style.overflowX,
      overflowY: html.style.overflowY,
      overscrollBehavior: html.style.overscrollBehavior,
      scrollbarGutter: html.style.scrollbarGutter,
      scrollBehavior: html.style.scrollBehavior
    };
    const previousBodyStyles = {
      boxSizing: body.style.boxSizing,
      height: body.style.height,
      left: body.style.left,
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      right: body.style.right,
      scrollBehavior: body.style.scrollBehavior,
      top: body.style.top,
      width: body.style.width
    };
    const handleKeyDown = (event) => {
      var _a;
      if (event.key === "Escape") {
        (_a = onEscapeRef.current) == null ? void 0 : _a.call(onEscapeRef);
      }
      const target = getElementTarget(event.target);
      const isEditable = target == null ? void 0 : target.closest("input, textarea, select, [contenteditable='true']");
      if (LOCKED_SCROLL_KEYS.has(event.key) && !isEditable && !(target == null ? void 0 : target.closest(LOCK_SCROLL_ALLOW_SELECTOR))) {
        event.preventDefault();
      }
    };
    const handleTouchStart = (event) => {
      var _a, _b;
      touchStartYRef.current = ((_b = (_a = event.touches) == null ? void 0 : _a[0]) == null ? void 0 : _b.clientY) || 0;
    };
    const handleLockedScroll = (event) => {
      var _a, _b;
      const allowedScrollElement = getAllowedScrollElement(event.target);
      if (allowedScrollElement) {
        if (event.type === "wheel") {
          if (canScrollElement(allowedScrollElement, event.deltaY || 0)) {
            return;
          }
          event.preventDefault();
          return;
        }
        if (event.type === "touchmove") {
          const currentY = ((_b = (_a = event.touches) == null ? void 0 : _a[0]) == null ? void 0 : _b.clientY) || touchStartYRef.current;
          const deltaY = touchStartYRef.current - currentY;
          if (canScrollElement(allowedScrollElement, deltaY)) {
            return;
          }
          event.preventDefault();
          return;
        }
        return;
      }
      event.preventDefault();
    };
    html.classList.add("site-cart-scroll-lock");
    body.classList.add("site-cart-scroll-lock");
    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    html.style.height = "100%";
    html.style.overflow = "hidden";
    html.style.overflowX = "hidden";
    html.style.overflowY = "hidden";
    html.style.overscrollBehavior = "none";
    html.style.scrollbarGutter = "stable";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.height = "auto";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.boxSizing = "border-box";
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    document.addEventListener("wheel", handleLockedScroll, { passive: false, capture: true });
    document.addEventListener("touchmove", handleLockedScroll, { passive: false, capture: true });
    return () => {
      html.classList.remove("site-cart-scroll-lock");
      body.classList.remove("site-cart-scroll-lock");
      html.style.height = previousHtmlStyles.height;
      html.style.overflow = previousHtmlStyles.overflow;
      html.style.overflowX = previousHtmlStyles.overflowX;
      html.style.overflowY = previousHtmlStyles.overflowY;
      html.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior;
      html.style.scrollbarGutter = previousHtmlStyles.scrollbarGutter;
      html.style.scrollBehavior = "auto";
      body.style.boxSizing = previousBodyStyles.boxSizing;
      body.style.height = previousBodyStyles.height;
      body.style.left = previousBodyStyles.left;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      body.style.position = previousBodyStyles.position;
      body.style.right = previousBodyStyles.right;
      body.style.scrollBehavior = "auto";
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      scrollToLockedPosition(scrollY);
      html.style.scrollBehavior = previousHtmlStyles.scrollBehavior;
      body.style.scrollBehavior = previousBodyStyles.scrollBehavior;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart, { capture: true });
      document.removeEventListener("wheel", handleLockedScroll, { capture: true });
      document.removeEventListener("touchmove", handleLockedScroll, { capture: true });
    };
  }, [isLocked]);
}
function useCartDrawer(onOpen) {
  const timerRef = useRef(null);
  const frameRef = useRef(null);
  const statusRef = useRef({ open: false, visible: false, closing: false });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCartDrawerVisible, setIsCartDrawerVisible] = useState(false);
  const [isCartDrawerClosing, setIsCartDrawerClosing] = useState(false);
  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const clearFrame = useCallback(() => {
    if (!frameRef.current) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);
  const openCartDrawer = useCallback(() => {
    clearTimer();
    clearFrame();
    statusRef.current = { open: true, visible: false, closing: false };
    setIsCartDrawerClosing(false);
    setIsCartDrawerVisible(false);
    onOpen == null ? void 0 : onOpen();
    setIsCartDrawerOpen(true);
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        statusRef.current = { open: true, visible: true, closing: false };
        setIsCartDrawerVisible(true);
      });
    });
  }, [clearFrame, clearTimer, onOpen]);
  const closeCartDrawer = useCallback(() => {
    const { open, closing } = statusRef.current;
    if (!open || closing) return;
    statusRef.current = { open: true, visible: false, closing: true };
    clearFrame();
    setIsCartDrawerClosing(true);
    setIsCartDrawerVisible(false);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      statusRef.current = { open: false, visible: false, closing: false };
      setIsCartDrawerOpen(false);
      setIsCartDrawerVisible(false);
      setIsCartDrawerClosing(false);
    }, CART_DRAWER_EXIT_MS);
  }, [clearFrame, clearTimer]);
  useEffect(() => {
    statusRef.current = {
      open: isCartDrawerOpen,
      visible: isCartDrawerVisible,
      closing: isCartDrawerClosing
    };
  }, [isCartDrawerClosing, isCartDrawerOpen, isCartDrawerVisible]);
  useEffect(
    () => () => {
      clearTimer();
      clearFrame();
    },
    [clearFrame, clearTimer]
  );
  return {
    isCartDrawerOpen,
    isCartDrawerVisible,
    isCartDrawerClosing,
    openCartDrawer,
    closeCartDrawer
  };
}
const PRICING_POLICY_VERSION = 2;
function getStoredCartSummary() {
  if (typeof window === "undefined") {
    return emptyCartSummary;
  }
  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    const cart = Array.isArray(parsedState.cart) ? parsedState.cart : [];
    const promo = parsedState.pricingPolicyVersion === PRICING_POLICY_VERSION ? parsedState.promo || null : null;
    const offer = null;
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const totals = calculateCartTotals(cart, promo, offer);
    return { cart, count, promo, offer, ...totals };
  } catch (error) {
    console.warn("Не удалось прочитать корзину доставки", error);
    return emptyCartSummary;
  }
}
function saveStoredCart(nextCart) {
  if (typeof window === "undefined") return null;
  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    const promo = parsedState.pricingPolicyVersion === PRICING_POLICY_VERSION ? parsedState.promo || null : null;
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({
        ...parsedState,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        cart: nextCart,
        promo,
        offer: null
      })
    );
    return getStoredCartSummary();
  } catch (error) {
    console.warn("Не удалось сохранить корзину доставки", error);
    return null;
  }
}
function saveStoredPromo(nextPromo) {
  if (typeof window === "undefined") return null;
  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({
        ...parsedState,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        promo: nextPromo,
        offer: null
      })
    );
    return getStoredCartSummary();
  } catch (error) {
    console.warn("Не удалось сохранить промокод", error);
    return null;
  }
}
function formatAddon(addon) {
  if (!addon) return "";
  if (typeof addon === "string") return addon;
  const qty = Number(addon.qty || 1);
  const addonName = [addon.name, addon.weight].filter(Boolean).join(" ");
  return qty > 1 ? `${addonName} x${qty}` : addonName;
}
function formatCustomization(customization) {
  if (!customization || typeof customization !== "object") return "";
  const parts = [];
  const removed = Array.isArray(customization.removed) ? customization.removed.filter(Boolean) : [];
  const addons = Array.isArray(customization.addons) ? customization.addons.map(formatAddon).filter(Boolean) : [];
  if (removed.length) parts.push(`без ${removed.join(", ")}`);
  if (addons.length) parts.push(`+ ${addons.join(", ")}`);
  return parts.length ? `${customization.name}: ${parts.join(", ")}` : "";
}
function getCartItemDetails(item) {
  const details = [];
  const addons = Array.isArray(item.addons) ? item.addons.map(formatAddon).filter(Boolean) : [];
  const removed = Array.isArray(item.removed) ? item.removed.filter(Boolean) : [];
  const comboItems = Array.isArray(item.comboItems) ? item.comboItems.map((comboItem) => comboItem == null ? void 0 : comboItem.name).filter(Boolean) : [];
  const customizations = Array.isArray(item.customizations) ? item.customizations.map(formatCustomization).filter(Boolean) : [];
  if (item.size) details.push(`${item.size} см`);
  if (item.dough) details.push(`${item.dough} тесто`);
  if (item.weight) details.push(item.weight);
  if (comboItems.length) details.push(`в наборе: ${comboItems.join(", ")}`);
  if (addons.length) details.push(`+ ${addons.join(", ")}`);
  if (removed.length) details.push(`без ${removed.join(", ")}`);
  if (customizations.length) details.push(customizations.join("; "));
  return details.join(", ");
}
function getCartItemImage(item) {
  return item.image || getCategoryVisual(item.category).image;
}
function useCartSummary() {
  const [cartSummary, setCartSummary] = useState(() => getStoredCartSummary());
  const cartItems = useMemo(
    () => Array.isArray(cartSummary.cart) ? cartSummary.cart : [],
    [cartSummary.cart]
  );
  const hasCartItems = cartItems.length > 0 && cartSummary.count > 0 && cartSummary.total > 0;
  const cartItemsLabel = `${cartSummary.count} ${pluralRu(cartSummary.count, "товар", "товара", "товаров")}`;
  const syncCartSummary = useCallback(() => {
    setCartSummary(getStoredCartSummary());
  }, []);
  const saveCartState = useCallback((nextCart) => {
    const nextSummary = saveStoredCart(nextCart);
    if (nextSummary) {
      setCartSummary(nextSummary);
    }
  }, []);
  const addCartItem = useCallback(
    (item) => {
      saveCartState([...cartItems, item]);
    },
    [cartItems, saveCartState]
  );
  const addCartItems = useCallback(
    (items) => {
      const nextItems = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!nextItems.length) {
        return;
      }
      saveCartState([...cartItems, ...nextItems]);
    },
    [cartItems, saveCartState]
  );
  const updateCartItemQty = useCallback(
    (targetIndex, delta) => {
      const nextCart = cartItems.map(
        (item, index) => index === targetIndex ? { ...item, qty: Math.max(0, Number(item.qty || 0) + delta) } : item
      ).filter((item) => Number(item.qty || 0) > 0);
      saveCartState(nextCart);
    },
    [cartItems, saveCartState]
  );
  const removeCartItem = useCallback(
    (targetIndex) => {
      saveCartState(cartItems.filter((_, index) => index !== targetIndex));
    },
    [cartItems, saveCartState]
  );
  const replaceCartItem = useCallback(
    (targetIndex, nextItem) => {
      if (!nextItem || targetIndex < 0 || targetIndex >= cartItems.length) {
        return;
      }
      saveCartState(cartItems.map((item, index) => index === targetIndex ? nextItem : item));
    },
    [cartItems, saveCartState]
  );
  const applyCartPromo = useCallback((promo) => {
    const nextSummary = saveStoredPromo(promo);
    if (nextSummary) {
      setCartSummary(nextSummary);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return void 0;
    syncCartSummary();
    window.addEventListener("storage", syncCartSummary);
    window.addEventListener("focus", syncCartSummary);
    return () => {
      window.removeEventListener("storage", syncCartSummary);
      window.removeEventListener("focus", syncCartSummary);
    };
  }, [syncCartSummary]);
  return {
    cartSummary,
    cartItems,
    hasCartItems,
    cartItemsLabel,
    syncCartSummary,
    addCartItem,
    addCartItems,
    updateCartItemQty,
    removeCartItem,
    replaceCartItem,
    applyCartPromo
  };
}
function useDeliverySettings() {
  const [deliverySettings, setDeliverySettings] = useState(() => readStoredDeliverySettings());
  const syncDeliverySettings = useCallback(() => {
    let cancelled = false;
    fetch(apiPath("siteDeliverySettings")).then((response) => response.json().then((data) => ({ response, data })).catch(() => ({ response, data: {} }))).then(({ response, data }) => {
      if (cancelled || !response.ok || data.ok === false) {
        return;
      }
      const normalized = saveStoredDeliverySettings(data.settings || DEFAULT_DELIVERY_SETTINGS);
      setDeliverySettings(normalized);
    }).catch(() => {
      if (!cancelled) {
        setDeliverySettings(normalizeDeliverySettings(readStoredDeliverySettings()));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => syncDeliverySettings(), [syncDeliverySettings]);
  return {
    deliverySettings,
    syncDeliverySettings
  };
}
const YANDEX_METRIKA_COUNTER_ID = 111415863;
const METRIKA_GOALS = Object.freeze({
  ADD_TO_CART: "add_to_cart",
  CHECKOUT_START: "checkout_start",
  ORDER_CREATED: "order_created",
  PAYMENT_START: "payment_start",
  PAYMENT_SUCCESS: "payment_success",
  PHONE_CLICK: "phone_click",
  MASTERCLASS_OPEN: "masterclass_open",
  MASTERCLASS_SIGNUP: "masterclass_signup",
  MASTERCLASS_PAYMENT: "masterclass_payment",
  MASTERCLASS_PAID: "masterclass_paid"
});
function reachMetrikaGoal(goal, params = {}) {
  if (typeof window === "undefined" || typeof window.ym !== "function" || !goal) {
    return;
  }
  window.ym(YANDEX_METRIKA_COUNTER_ID, "reachGoal", goal, params);
}
const SITE_ONBOARDING_DEMO_MODE = false;
function lazyNamed(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}
const CartDrawer = lazyNamed(() => import("./assets/CartDrawer-CCKB4CeG.js"), "CartDrawer");
const SiteAuthModal = lazyNamed(() => import("./assets/SiteAuthModal-Brd-FL9l.js"), "SiteAuthModal");
const SiteContactPhoneModal = lazyNamed(
  () => import("./assets/SiteContactPhoneModal-Du6qAVHJ.js"),
  "SiteContactPhoneModal"
);
const SiteProductModal = lazyNamed(() => import("./assets/SiteProductModal-DyladqRA.js"), "SiteProductModal");
const SiteMenuSection = lazyNamed(() => import("./assets/SiteMenuSection-Cd9Z_dUY.js"), "SiteMenuSection");
const SiteAddressModal = lazyNamed(() => import("./assets/SiteAddressFlow-CqGzIFJX.js"), "SiteAddressModal");
const SiteAddressPrompt = lazyNamed(() => import("./assets/SiteAddressFlow-CqGzIFJX.js"), "SiteAddressPrompt");
const HomepageBelowFold = lazyNamed(
  () => import("./assets/HomepageBelowFold-WZKVs1Zs.js"),
  "HomepageBelowFold"
);
function DeferredMount({ anchorId, aliases = [], minHeight = 720, children }) {
  const nodeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (isReady) return void 0;
    const node = nodeRef.current;
    const timeout = window.setTimeout(() => setIsReady(true), 6e3);
    if (!("IntersectionObserver" in window)) {
      return () => window.clearTimeout(timeout);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsReady(true);
      },
      { rootMargin: "240px 0px" }
    );
    if (node) observer.observe(node);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isReady]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: nodeRef,
      id: isReady ? void 0 : anchorId,
      className: "site-deferred-mount",
      style: { minHeight },
      "aria-busy": !isReady,
      children: [
        !isReady ? aliases.map((alias) => /* @__PURE__ */ jsx("span", { className: "site-deferred-anchor", id: alias, "aria-hidden": "true" }, alias)) : null,
        isReady ? children : /* @__PURE__ */ jsx("span", { className: "site-visually-hidden", children: "Загружаем меню…" })
      ]
    }
  );
}
const HEADER_COMPACT_ENTER_Y = 96;
const HEADER_COMPACT_EXIT_Y = 8;
const DEFAULT_SITE_STATS = {
  deliveredOrdersTotal: 0
};
const eventCards = [
  { icon: CakeSlice, title: "Детские праздники", text: "Пицца, десерты, спокойный зал и детская зона за стеклом." },
  { icon: Users, title: "Семейные встречи", text: "Большие столы, понятное меню и формат, где удобно с детьми." },
  { icon: CalendarCheck, title: "Банкетный зал", text: "Поможем собрать меню под день рождения, выпускной или небольшой праздник." }
];
async function readApiJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось выполнить запрос");
  }
  return data;
}
function MainSite() {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const isHeaderCompactRef = useRef(false);
  const isPageOverlayLockedRef = useRef(false);
  const [siteCustomer, setSiteCustomer] = useState(null);
  const [isOnboardingSessionComplete, setIsOnboardingSessionComplete] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [isMasterclassPromoOpen, setIsMasterclassPromoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [siteStats, setSiteStats] = useState(DEFAULT_SITE_STATS);
  const [siteRecentOrders, setSiteRecentOrders] = useState([]);
  const [siteFulfillment, setSiteFulfillment] = useState(() => readSiteFulfillment());
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [editingCartLine, setEditingCartLine] = useState(null);
  const [goToCheckoutAfterAuth, setGoToCheckoutAfterAuth] = useState(false);
  const [isAddressPromptOpen, setIsAddressPromptOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState("delivery");
  const {
    cartSummary,
    cartItems,
    hasCartItems,
    cartItemsLabel,
    syncCartSummary,
    addCartItem,
    addCartItems,
    updateCartItemQty,
    removeCartItem,
    replaceCartItem,
    applyCartPromo
  } = useCartSummary();
  const { deliverySettings } = useDeliverySettings();
  const { isCartDrawerOpen, isCartDrawerVisible, isCartDrawerClosing, openCartDrawer, closeCartDrawer } = useCartDrawer(syncCartSummary);
  const editableProductById = useMemo(
    () => /* @__PURE__ */ new Map(),
    []
  );
  const closeProductModal = () => {
    setSelectedProduct(null);
    setEditingCartLine(null);
  };
  const hasRequiredOnboarding = Boolean((siteCustomer == null ? void 0 : siteCustomer.requiresOnboarding) || (siteCustomer == null ? void 0 : siteCustomer.requiresContactPhoneSetup));
  const showOnboardingDemo = Boolean(
    SITE_ONBOARDING_DEMO_MODE
  );
  const needsOnboarding = hasRequiredOnboarding || showOnboardingDemo;
  const isPageOverlayLocked = Boolean(selectedProduct) || isCartDrawerOpen || isAddressPromptOpen || isAddressModalOpen || isAuthModalOpen || needsOnboarding || isRecentOrdersOpen || isMasterclassPromoOpen;
  isPageOverlayLockedRef.current = isPageOverlayLocked;
  const cancelAddressSelection = () => {
    setIsAddressPromptOpen(false);
    setIsAddressModalOpen(false);
    setPendingCartItem(null);
  };
  useBodyScrollLock(
    isPageOverlayLocked,
    () => {
      if (needsOnboarding) {
        return;
      }
      if (isAddressModalOpen || isAddressPromptOpen) {
        cancelAddressSelection();
        return;
      }
      if (selectedProduct) {
        closeProductModal();
        return;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }
      if (isRecentOrdersOpen) {
        setIsRecentOrdersOpen(false);
        return;
      }
      if (isMasterclassPromoOpen) {
        setIsMasterclassPromoOpen(false);
        return;
      }
      closeCartDrawer();
    }
  );
  useEffect(() => {
    let isCancelled = false;
    fetchCurrentSiteCustomer().then((customer) => {
      if (!isCancelled) {
        setSiteCustomer(customer || null);
      }
    }).catch(() => {
      if (!isCancelled) {
        setSiteCustomer(null);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("authLink")) {
      setIsAuthModalOpen(true);
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cart") !== "open") return;
    openCartDrawer();
    params.delete("cart");
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`
    );
  }, [openCartDrawer]);
  useEffect(() => {
    if (!window.location.hash) {
      return void 0;
    }
    let isCancelled = false;
    let frame = 0;
    const timers = [];
    const scrollToHashTarget = () => {
      if (isCancelled) {
        return;
      }
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };
    frame = window.requestAnimationFrame(scrollToHashTarget);
    timers.push(window.setTimeout(scrollToHashTarget, 180));
    timers.push(window.setTimeout(scrollToHashTarget, 520));
    return () => {
      isCancelled = true;
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  useEffect(() => {
    let isCancelled = false;
    fetch(apiPath("siteStats")).then(readApiJson).then((data) => {
      if (!isCancelled) {
        setSiteStats({
          deliveredOrdersTotal: Number(data.deliveredOrdersTotal || 0)
        });
      }
    }).catch(() => {
      if (!isCancelled) {
        setSiteStats(DEFAULT_SITE_STATS);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);
  useEffect(() => {
    let isCancelled = false;
    fetch(apiPath("siteRecentOrders")).then(readApiJson).then((data) => {
      if (!isCancelled) {
        setSiteRecentOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    }).catch(() => {
      if (!isCancelled) {
        setSiteRecentOrders([]);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    const syncHeaderState = () => {
      frame = 0;
      if (isPageOverlayLockedRef.current || document.body.classList.contains("site-cart-scroll-lock")) {
        return;
      }
      const current = isHeaderCompactRef.current;
      const scrollY = window.scrollY;
      if (!current && scrollY >= HEADER_COMPACT_ENTER_Y) {
        isHeaderCompactRef.current = true;
        setIsHeaderCompact(true);
        return;
      }
      if (current && scrollY <= HEADER_COMPACT_EXIT_Y) {
        isHeaderCompactRef.current = false;
        setIsHeaderCompact(false);
      }
    };
    const handleScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(syncHeaderState);
    };
    syncHeaderState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const finishAddingCartItem = (cartItem) => {
    if (editingCartLine) {
      replaceCartItem(editingCartLine.index, {
        ...cartItem,
        qty: Math.max(1, Number(editingCartLine.qty || 1))
      });
      setEditingCartLine(null);
    } else {
      addCartItem(cartItem);
    }
    setPendingCartItem(null);
    closeProductModal();
    openCartDrawer();
    reachMetrikaGoal(METRIKA_GOALS.ADD_TO_CART, {
      product_id: cartItem.productId || cartItem.id || "",
      product_name: cartItem.name || "",
      price: Number(cartItem.unitPrice || cartItem.price || 0),
      quantity: Number(cartItem.qty || 1)
    });
  };
  const addProductToCart = (cartItem) => {
    finishAddingCartItem(cartItem);
  };
  const addRecentOrderToCart = (order) => {
    const now = Date.now();
    const orderItems = ((order == null ? void 0 : order.items) || []).map((item, index) => ({
      ...item,
      uid: `${item.productId || "recent"}-${order.id || "order"}-${now}-${index}`,
      qty: Math.max(1, Number(item.qty || 1)),
      unitPrice: Number(item.unitPrice || item.price || 0),
      image: item.image || item.visual || "",
      visual: item.visual || item.image || "",
      addons: Array.isArray(item.addons) ? item.addons : [],
      removed: Array.isArray(item.removed) ? item.removed : []
    }));
    if (!orderItems.length) {
      return;
    }
    addCartItems(orderItems);
    setIsRecentOrdersOpen(false);
    openCartDrawer();
  };
  const getEditableProductFromCartItem = (item) => {
    var _a;
    if ((_a = item == null ? void 0 : item.productSnapshot) == null ? void 0 : _a.id) {
      return item.productSnapshot;
    }
    const productId = (item == null ? void 0 : item.productId) || (item == null ? void 0 : item.id);
    const knownProduct = productId ? editableProductById.get(productId) : null;
    if (knownProduct) {
      return knownProduct;
    }
    if (!(item == null ? void 0 : item.name)) {
      return null;
    }
    const comboItems = Array.isArray(item.comboItems) ? item.comboItems.map((comboItem, index) => {
      const source = editableProductById.get(comboItem == null ? void 0 : comboItem.id);
      return source || {
        id: (comboItem == null ? void 0 : comboItem.id) || `${productId || "combo"}-item-${index}`,
        category: "pizza",
        name: (comboItem == null ? void 0 : comboItem.name) || `Позиция ${index + 1}`,
        weight: (comboItem == null ? void 0 : comboItem.weight) || "",
        price: 0,
        image: item.image
      };
    }) : [];
    return {
      id: productId || item.uid || "cart-item",
      category: item.category || (comboItems.length ? "combo" : "pizza"),
      name: item.name,
      description: item.description || "",
      weight: item.weight || "",
      price: Number(item.unitPrice || item.price || 0),
      image: item.image,
      visual: item.visual,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      comboItems
    };
  };
  const editCartItem = (item, index) => {
    const productToEdit = getEditableProductFromCartItem(item);
    if (!productToEdit) {
      return;
    }
    setEditingCartLine({ index, qty: item.qty });
    closeCartDrawer();
    window.setTimeout(() => setSelectedProduct(productToEdit), 0);
  };
  const saveFulfillmentAndContinue = (fulfillment) => {
    const nextFulfillment = saveSiteFulfillment(fulfillment);
    setSiteFulfillment(nextFulfillment);
    setIsAddressPromptOpen(false);
    setIsAddressModalOpen(false);
    if (pendingCartItem) {
      finishAddingCartItem(pendingCartItem);
    }
  };
  const logoutCustomer = async () => {
    try {
      await fetch(apiPath("customerAuthLogout"), {
        method: "POST",
        credentials: "include"
      }).then(readApiJson);
    } catch {
    }
    setSiteCustomer(null);
    setIsOnboardingSessionComplete(false);
    forgetSiteCustomer();
    setIsAuthModalOpen(false);
  };
  const handleAuthenticated = (customer) => {
    const nextCustomer = rememberSiteCustomer(customer);
    setSiteCustomer(nextCustomer);
    if (goToCheckoutAfterAuth) {
      setGoToCheckoutAfterAuth(false);
      window.location.href = DELIVERY_URL;
    }
  };
  const requestCheckout = () => {
    if (!hasCartItems) {
      return;
    }
    if (!(siteCustomer == null ? void 0 : siteCustomer.id)) {
      setGoToCheckoutAfterAuth(true);
      setIsAuthModalOpen(true);
      return;
    }
    window.location.href = DELIVERY_URL;
  };
  return /* @__PURE__ */ jsxs("main", { className: `site-showcase ${isHeaderCompact ? "is-header-compact" : ""}`, children: [
    /* @__PURE__ */ jsx(
      SiteHeader,
      {
        customer: siteCustomer,
        hasCartItems,
        cartSummary,
        isCartDrawerOpen,
        isCartDrawerClosing,
        deliverySettings,
        onAuthClick: () => setIsAuthModalOpen(true),
        onCartClick: openCartDrawer
      }
    ),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: isCartDrawerVisible ? /* @__PURE__ */ jsx(
      CartDrawer,
      {
        isOpen: isCartDrawerOpen,
        isVisible: isCartDrawerVisible,
        isClosing: isCartDrawerClosing,
        hasItems: hasCartItems,
        cartItems,
        cartItemsLabel,
        cartSummary,
        onClose: closeCartDrawer,
        onRemoveItem: removeCartItem,
        onUpdateItemQty: updateCartItemQty,
        onEditItem: editCartItem,
        onApplyPromo: applyCartPromo,
        onCheckout: requestCheckout
      }
    ) : null }),
    /* @__PURE__ */ jsx(
      SiteMobileCartFab,
      {
        hasCartItems,
        cartSummary,
        isCartDrawerOpen,
        isCartDrawerClosing,
        onCartClick: openCartDrawer
      }
    ),
    /* @__PURE__ */ jsx(
      SiteAboutSection,
      {
        deliveredOrdersTotal: siteStats.deliveredOrdersTotal,
        proofAddon: /* @__PURE__ */ jsx(
          SiteRecentOrders,
          {
            orders: siteRecentOrders,
            isOpen: isRecentOrdersOpen,
            onOpen: () => setIsRecentOrdersOpen(true),
            onClose: () => setIsRecentOrdersOpen(false),
            onAddOrder: addRecentOrderToCart
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(
      SiteMasterclassPromo,
      {
        isDialogOpen: isMasterclassPromoOpen,
        onOpen: () => setIsMasterclassPromoOpen(true),
        onClose: () => setIsMasterclassPromoOpen(false)
      }
    ),
    /* @__PURE__ */ jsx(DeferredMount, { anchorId: "menu", aliases: ["summer"], minHeight: 900, children: /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(SiteMenuSection, { onProductOpen: setSelectedProduct }) }) }),
    /* @__PURE__ */ jsxs(Suspense, { fallback: null, children: [
      selectedProduct ? /* @__PURE__ */ jsx(
        SiteProductModal,
        {
          product: selectedProduct,
          customer: siteCustomer,
          onClose: closeProductModal,
          onAddToCart: addProductToCart
        }
      ) : null,
      isAddressPromptOpen ? /* @__PURE__ */ jsx(
        SiteAddressPrompt,
        {
          onClose: cancelAddressSelection,
          onDelivery: () => {
            setAddressModalMode("delivery");
            setIsAddressPromptOpen(false);
            setIsAddressModalOpen(true);
          },
          onPickup: () => {
            setAddressModalMode("pickup");
            setIsAddressPromptOpen(false);
            setIsAddressModalOpen(true);
          },
          onLogin: () => {
            setIsAddressPromptOpen(false);
            setIsAuthModalOpen(true);
          }
        }
      ) : null,
      isAddressModalOpen ? /* @__PURE__ */ jsx(
        SiteAddressModal,
        {
          initialFulfillment: { ...siteFulfillment, mode: addressModalMode },
          onClose: cancelAddressSelection,
          onSave: saveFulfillmentAndContinue
        }
      ) : null,
      isAuthModalOpen && !needsOnboarding ? /* @__PURE__ */ jsx(
        SiteAuthModal,
        {
          customer: siteCustomer,
          onClose: () => setIsAuthModalOpen(false),
          onAuthenticated: handleAuthenticated,
          onLogout: logoutCustomer
        }
      ) : null,
      needsOnboarding ? /* @__PURE__ */ jsx(
        SiteContactPhoneModal,
        {
          customer: siteCustomer,
          onSaved: handleAuthenticated,
          demoMode: showOnboardingDemo,
          onComplete: () => setIsOnboardingSessionComplete(true)
        }
      ) : null
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "site-section-v2 site-family-feature", id: "kids", children: [
      /* @__PURE__ */ jsxs("div", { className: "site-family-photo site-family-photo-stack", children: [
        /* @__PURE__ */ jsx("img", { src: `${ASSET}kids-zone-real.webp`, alt: "Детская зона пиццерии Вместе Вкуснее", loading: "lazy" }),
        /* @__PURE__ */ jsxs("div", { className: "site-photo-caption", children: [
          /* @__PURE__ */ jsx(Baby, { size: 18 }),
          "Большая детская зона за стеклом"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "site-family-panel", children: [
        /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "В зале" }),
        /* @__PURE__ */ jsx("h2", { children: "Родители отдыхают, дети играют рядом" }),
        /* @__PURE__ */ jsx("p", { children: "Детская зона за стеклом помогает провести вечер спокойно: ребенок занят, а родители видят его из зала." }),
        /* @__PURE__ */ jsxs("div", { className: "site-family-facts", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(Baby, { size: 17 }),
            "Детская зона"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(ChefHat, { size: 17 }),
            "Открытая кухня"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(CakeSlice, { size: 17 }),
            "Праздники"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "site-family-note", children: [
          /* @__PURE__ */ jsx(HeartHandshake, { size: 20 }),
          /* @__PURE__ */ jsx("span", { children: "Подходит для семейного ужина, дня рождения и спокойного обеда после прогулки." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "site-section-v2 site-events-section", id: "events", children: [
      /* @__PURE__ */ jsxs("div", { className: "site-events-copy", children: [
        /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Праздники и встречи" }),
        /* @__PURE__ */ jsx("h2", { children: "Можно прийти на ужин, а можно собрать событие" }),
        /* @__PURE__ */ jsx("p", { children: "Для банкетов, детских дней рождения и семейных праздников поможем подобрать меню, время и формат посадки." }),
        /* @__PURE__ */ jsxs("div", { className: "site-events-actions", children: [
          /* @__PURE__ */ jsxs("a", { className: "site-primary-btn", href: "#contacts", children: [
            /* @__PURE__ */ jsx(CalendarCheck, { size: 18 }),
            "Обсудить бронь"
          ] }),
          /* @__PURE__ */ jsxs("a", { className: "site-dark-btn", href: getSiteOrderPath(), children: [
            /* @__PURE__ */ jsx(Truck, { size: 18 }),
            "Заказать домой"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "site-events-grid", children: eventCards.map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs("article", { className: "site-event-card", children: [
          /* @__PURE__ */ jsx(Icon, { size: 24 }),
          /* @__PURE__ */ jsx("h3", { children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.text })
        ] }, item.title);
      }) })
    ] }),
    /* @__PURE__ */ jsx(DeferredMount, { minHeight: 1200, children: /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(HomepageBelowFold, {}) }) })
  ] });
}
function renderHome() {
  return renderToString(
    /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(MainSite, {}) })
  );
}
export {
  ASSET as A,
  INDIVIDUAL_MASTERCLASS_PATH as I,
  PHONE as P,
  RESTAURANT as R,
  SOCIAL_LINKS as S,
  getCartItemImage as a,
  apiPath as b,
  getProductOldPrice as c,
  PARTNERS_URL as d,
  evaluatePromoCart as e,
  formatPrice as f,
  getCartItemDetails as g,
  getSiteOrderPath as h,
  renderHome,
  telHref as t,
  useBodyScrollLock as u
};
