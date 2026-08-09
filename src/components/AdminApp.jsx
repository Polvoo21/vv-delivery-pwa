import "../styles.css";
import "../final-polish.css";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Ban,
  BarChart3,
  Bike,
  BellRing,
  Camera,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  ImagePlus,
  Instagram,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  ReceiptText,
  Save,
  Settings2,
  ShieldCheck,
  Star,
  Store,
  Tags,
  TimerReset,
  Trash2,
  Truck,
  UserRound,
  UsersRound,
  Utensils,
  Video,
  WalletCards,
  PlayCircle,
  X
} from "lucide-react";
import { formatPrice } from "../utils/price";
import { getPromoRuleSummary } from "../../shared/promo-rules";
import { subscribeForAdminPush } from "../utils/notifications";
import { apiPath } from "../utils/api";
import {
  authenticateAdminPasskey,
  registerAdminPasskey,
  supportsAdminPasskeys
} from "../utils/adminPasskeys";
import { listDemoReviews, updateDemoReviewStatus } from "../utils/demoReviews";
import { MENU, MENU_CATEGORIES } from "../data/menu";
import { siteLostItems } from "./site/siteLostItemsData";
import {
  DEFAULT_DELIVERY_SETTINGS,
  formatDuration,
  getDeliveryLoadLabel,
  getDeliveryLoadMessage,
  normalizeDeliverySettings,
  saveStoredDeliverySettings
} from "../utils/deliveryTiming";

const LOGIN_KEY = "vv_admin_login";
const LEGACY_PASSWORD_KEY = "vv_admin_password";
const SESSION_AUTH_MARKER = "__admin_session__";
const DEV_PASSWORD = "dev";
const DELIVERY_TIME_OPTIONS = [30, 45, 60, 75, 90, 105, 120];
const ADMIN_LOST_ITEM_PHOTO_MAX_BYTES = 200 * 1024;
const ADMIN_LOST_ITEM_PHOTO_MAX_SIDE = 1600;

const STATUS_LABELS = {
  payment_pending: "Ожидает оплату",
  payment_failed: "Оплата не прошла",
  new: "Получен",
  accepted: "Принят",
  cooking: "Готовится",
  courier: "У курьера",
  delivered: "Доставлен",
  cancelled: "Отменён"
};

const STATUS_ICONS = {
  payment_pending: Clock,
  payment_failed: Ban,
  new: BellRing,
  accepted: CheckCircle2,
  cooking: ChefHat,
  courier: Truck,
  delivered: PackageCheck,
  cancelled: Ban
};

const KITCHEN_STATUS_ORDER = ["new", "accepted", "cooking", "courier", "delivered", "cancelled"];

const ORDER_STATUS_OPTIONS = Object.entries(STATUS_LABELS).filter(
  ([status]) => !["cancelled", "payment_pending", "payment_failed"].includes(status)
);

const REVIEW_STATUS_LABELS = {
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Отклонён"
};

const ADMIN_ROLE_LABELS = {
  manager: "Руководитель",
  admin: "Администратор"
};

const EMPTY_GALLERY_FORM = {
  type: "photo",
  title: "",
  caption: "",
  videoUrl: "",
  orientation: "landscape"
};

const EMPTY_BLOGGER_REWARD_FORM = {
  instagramUrl: ""
};

const EMPTY_CATALOG_CATEGORY_FORM = {
  id: "",
  title: "",
  shortTitle: "",
  description: "",
  image: "",
  sortOrder: "",
  status: "active"
};

const EMPTY_CATALOG_PRODUCT_FORM = {
  id: "",
  categoryId: "",
  name: "",
  description: "",
  weight: "",
  price: "",
  oldPrice: "",
  badges: "",
  ingredients: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  comboItemIds: "",
  imageUrl: "",
  customizable: false,
  featured: false,
  sortOrder: "",
  status: "active"
};

const EMPTY_CATALOG = {
  categories: [],
  products: []
};

const DEMO_CATALOG = {
  categories: MENU_CATEGORIES.map((category, index) => ({
    ...category,
    sortOrder: (index + 1) * 10,
    status: "active"
  })),
  products: MENU.map((product, index) => ({
    ...product,
    categoryId: product.category,
    sortOrder: (index + 1) * 10,
    status: "active"
  }))
};

const EMPTY_PROMO_CODE_FORM = {
  code: "",
  percent: 10,
  internalComment: "",
  validFrom: "",
  validUntil: "",
  dailyStart: "",
  dailyEnd: "",
  weekdays: [],
  scopeType: "all",
  categoryIds: [],
  productIds: [],
  usageLimit: "",
  perCustomerLimit: "",
  minimumOrderAmount: "",
  maximumDiscountAmount: "",
  status: "active"
};

const PROMO_WEEKDAY_OPTIONS = [
  { value: 1, short: "Пн", label: "Понедельник" },
  { value: 2, short: "Вт", label: "Вторник" },
  { value: 3, short: "Ср", label: "Среда" },
  { value: 4, short: "Чт", label: "Четверг" },
  { value: 5, short: "Пт", label: "Пятница" },
  { value: 6, short: "Сб", label: "Суббота" },
  { value: 7, short: "Вс", label: "Воскресенье" }
];

const ADMIN_PRODUCT_FALLBACK_IMAGE = "/assets/site/product-photo-placeholder.png";

function isManagerAccount(account) {
  return account?.role === "manager";
}

function getAccountLabel(account) {
  return account?.label || ADMIN_ROLE_LABELS[account?.role] || "Сотрудник";
}

const DEMO_ORDERS = [
  {
    id: "DEMO-1024",
    status: "new",
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    mode: "delivery",
    address: "Чебоксары, ул. Пирогова, 1Т",
    entrance: "2",
    flat: "18",
    customerName: "Анна",
    customerPhone: "+7 (8352) 66-77-77",
    payment: "картой при получении",
    total: 1280,
    items: [
      {
        name: "Пепперони с халапеньо и мёдом",
        qty: 1,
        size: 30,
        dough: "Традиционное",
        lineTotal: 720,
        addons: [{ name: "Моцарелла" }]
      },
      {
        name: "Морс ягодный",
        qty: 2,
        lineTotal: 320
      }
    ]
  },
  {
    id: "DEMO-1023",
    status: "cooking",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    mode: "pickup",
    address: "Чебоксары, ул. Пирогова, 1Т",
    customerName: "Илья",
    customerPhone: "+7 (8352) 66-77-77",
    payment: "наличными",
    total: 1015,
    items: [
      {
        name: "Пицца Цезарь",
        qty: 1,
        size: 35,
        dough: "Тонкое",
        lineTotal: 890
      },
      {
        name: "Капучино",
        qty: 1,
        lineTotal: 180
      }
    ]
  }
];

const DEMO_PARTNERS = [
  {
    id: "demo-partner-1",
    name: "Анна Иванова",
    login: "anna",
    promoCode: "ANNA10",
    discountPercent: 10,
    commissionPercent: 7,
    ordersCount: 14,
    revenue: 25390,
    commissionAmount: 1777,
    payableAmount: 980,
    paidAmount: 797,
    status: "active",
    payouts: [
      {
        id: "demo-payout-anna-2",
        amount: 397,
        note: "Частичная выплата за июль",
        status: "confirmed",
        createdBy: "Руководитель",
        paidAt: "2026-07-20T13:30:00.000Z"
      },
      {
        id: "demo-payout-anna-1",
        amount: 400,
        note: "Первая часть выплаты",
        status: "confirmed",
        createdBy: "Руководитель",
        paidAt: "2026-07-12T10:15:00.000Z"
      }
    ]
  },
  {
    id: "demo-partner-2",
    name: "Еда в Чебоксарах",
    login: "foodcheb",
    promoCode: "FOOD12",
    discountPercent: 12,
    commissionPercent: 6,
    ordersCount: 9,
    revenue: 16840,
    commissionAmount: 1010,
    payableAmount: 1010,
    paidAmount: 0,
    status: "active",
    payouts: []
  },
  {
    id: "demo-partner-3",
    name: "Мария Соколова",
    login: "maria",
    promoCode: "MARIA7",
    discountPercent: 7,
    commissionPercent: 5,
    ordersCount: 6,
    revenue: 9840,
    commissionAmount: 492,
    payableAmount: 0,
    paidAmount: 492,
    status: "active",
    payouts: [
      {
        id: "demo-payout-maria-1",
        amount: 492,
        note: "Выплата за завершённый период",
        status: "confirmed",
        createdBy: "Руководитель",
        paidAt: "2026-07-18T11:00:00.000Z"
      }
    ]
  }
];

const DEMO_PROMO_CODES = [
  {
    id: "demo-promo-1",
    code: "LUNCH15",
    percent: 15,
    internalComment: "Будние дни, обеденное предложение.",
    validFrom: "2026-07-01",
    validUntil: "2026-07-31",
    dailyStart: "12:00",
    dailyEnd: "14:00",
    weekdays: [1, 2, 3, 4, 5],
    scopeType: "categories",
    categoryIds: ["breakfast"],
    productIds: [],
    usageLimit: 15,
    usageCount: 6,
    reservedCount: 1,
    countedUses: 7,
    perCustomerLimit: 1,
    minimumOrderAmount: 900,
    maximumDiscountAmount: 350,
    status: "active",
    availability: {
      active: true,
      state: "active",
      label: "Действует"
    }
  },
  {
    id: "demo-promo-2",
    code: "AUGUST10",
    percent: 10,
    internalComment: "Августовская кампания для гостей сайта.",
    validFrom: "2026-08-01",
    validUntil: "2026-08-31",
    dailyStart: "",
    dailyEnd: "",
    weekdays: [],
    scopeType: "all",
    categoryIds: [],
    productIds: [],
    usageLimit: null,
    usageCount: 0,
    reservedCount: 0,
    countedUses: 0,
    perCustomerLimit: null,
    minimumOrderAmount: null,
    maximumDiscountAmount: null,
    status: "active",
    availability: {
      active: false,
      state: "scheduled",
      label: "Запланирован"
    }
  }
];

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function adminErrorMessage(error) {
  if (!error) return "Не удалось выполнить действие";
  return error.details ? `${error.message}: ${error.details}` : error.message || "Не удалось выполнить действие";
}

function formatDate(value) {
  if (!value) return "сейчас";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) return "сегодня";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatPromoDateRange(promo) {
  if (promo.validFrom && promo.validUntil) {
    return `${formatDateOnly(promo.validFrom)} – ${formatDateOnly(promo.validUntil)}`;
  }
  if (promo.validFrom) return `С ${formatDateOnly(promo.validFrom)}`;
  if (promo.validUntil) return `До ${formatDateOnly(promo.validUntil)}`;
  return "Без ограничения по датам";
}

function formatPromoDailyRange(promo) {
  const weekdays = Array.isArray(promo.weekdays) ? promo.weekdays.map(Number) : [];
  const isWeekdays =
    weekdays.length === 5 && [1, 2, 3, 4, 5].every((day) => weekdays.includes(day));
  const isWeekend = weekdays.length === 2 && [6, 7].every((day) => weekdays.includes(day));
  const daysLabel = !weekdays.length
    ? "Каждый день"
    : isWeekdays
      ? "Будни"
      : isWeekend
        ? "Выходные"
        : PROMO_WEEKDAY_OPTIONS.filter((day) => weekdays.includes(day.value))
            .map((day) => day.short)
            .join(", ");
  return promo.dailyStart && promo.dailyEnd
    ? `${daysLabel} ${promo.dailyStart}–${promo.dailyEnd}`
    : `${daysLabel}, весь день`;
}

function formatResponseSeconds(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const hourMinutes = minutes % 60;
    return `${hours} ч ${hourMinutes} мин`;
  }

  if (minutes > 0) {
    return `${minutes} мин ${rest} сек`;
  }

  return `${rest} сек`;
}

function getEmptyDashboard() {
  const emptyPeriod = () => ({
    orders: 0,
    revenue: 0,
    averageTicket: 0,
    cancelledOrders: 0,
    cancelRate: 0,
    averageResponseSeconds: 0,
    series: [],
    fulfillment: [
      { id: "delivery", label: "Доставка", orders: 0 },
      { id: "pickup", label: "Самовывоз", orders: 0 }
    ],
    topItems: [],
    partnerRanking: []
  });
  const today = emptyPeriod();
  const month = emptyPeriod();
  const year = emptyPeriod();

  return {
    today,
    month,
    year,
    periods: { today, month, year },
    active: {
      orders: 0,
      newOrders: 0,
      cancelledOrders: 0,
      byStatus: { accepted: 0, cooking: 0, courier: 0 }
    },
    response: { slowest: null }
  };
}

const DASHBOARD_PERIODS = [
  { id: "today", label: "День", title: "Сегодня" },
  { id: "month", label: "Месяц", title: "Месяц" },
  { id: "year", label: "Год", title: "Год" }
];

function isSameLocalDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getDashboardPeriodSummary(dashboardData, period) {
  const source =
    dashboardData?.periods?.[period] ||
    dashboardData?.[period] ||
    dashboardData?.today ||
    { orders: 0, revenue: 0 };
  const orders = Number(source.orders || 0);
  const revenue = Number(source.revenue || 0);
  const averageTicket = Number(source.averageTicket || (orders ? Math.round(revenue / orders) : 0));

  return {
    ...source,
    orders,
    revenue,
    averageTicket,
    cancelledOrders: Number(source.cancelledOrders || 0),
    cancelRate: Number(source.cancelRate || 0),
    averageResponseSeconds: Number(source.averageResponseSeconds || 0),
    series: Array.isArray(source.series) ? source.series : [],
    fulfillment: Array.isArray(source.fulfillment) ? source.fulfillment : [],
    topItems: Array.isArray(source.topItems) ? source.topItems : [],
    partnerRanking: Array.isArray(source.partnerRanking) ? source.partnerRanking : []
  };
}

function buildDashboardChartPoints(orders, period) {
  const now = new Date();
  const source = Array.isArray(orders) ? orders.filter((order) => order.status !== "cancelled") : [];

  if (period === "year") {
    const months = Array.from({ length: 12 }, (_, index) => ({
      label: new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(new Date(now.getFullYear(), index, 1)),
      orders: 0,
      revenue: 0
    }));

    source.forEach((order) => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() === now.getFullYear()) {
        months[date.getMonth()].orders += 1;
        months[date.getMonth()].revenue += Number(order.total || 0);
      }
    });

    return months;
  }

  if (period === "month") {
    const weeks = [
      { label: "1–7", orders: 0, revenue: 0 },
      { label: "8–14", orders: 0, revenue: 0 },
      { label: "15–21", orders: 0, revenue: 0 },
      { label: "22–31", orders: 0, revenue: 0 }
    ];

    source.forEach((order) => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return;
      const bucket = Math.min(3, Math.floor((date.getDate() - 1) / 7));
      weeks[bucket].orders += 1;
      weeks[bucket].revenue += Number(order.total || 0);
    });

    return weeks;
  }

  const dayBuckets = [
    { label: "09:00", from: 0, to: 12, orders: 0, revenue: 0 },
    { label: "12:00", from: 12, to: 15, orders: 0, revenue: 0 },
    { label: "15:00", from: 15, to: 18, orders: 0, revenue: 0 },
    { label: "18:00", from: 18, to: 21, orders: 0, revenue: 0 },
    { label: "21:00", from: 21, to: 24, orders: 0, revenue: 0 }
  ];

  source.forEach((order) => {
    const date = new Date(order.createdAt);
    if (Number.isNaN(date.getTime())) return;
    if (!isSameLocalDay(date, now)) return;
    const bucket = dayBuckets.find((item) => date.getHours() >= item.from && date.getHours() < item.to);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(order.total || 0);
    }
  });

  return dayBuckets.map(({ label, orders: orderCount, revenue }) => ({
    label,
    orders: orderCount,
    revenue
  }));
}

function buildDemoDashboard(orders) {
  const notCancelled = orders.filter((order) => order.status !== "cancelled");
  const revenue = notCancelled.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const topItems = [
    { name: "Пепперони с халапеньо и мёдом", quantity: 8, revenue: 5760 },
    { name: "Пицца Цезарь", quantity: 6, revenue: 5340 },
    { name: "Капучино", quantity: 5, revenue: 900 },
    { name: "Морс ягодный", quantity: 4, revenue: 640 },
    { name: "Жареный сыр сулугуни", quantity: 3, revenue: 1950 }
  ];
  const makePeriod = ({
    periodOrders,
    periodRevenue,
    cancelledOrders,
    averageResponseSeconds,
    series,
    deliveryOrders,
    pickupOrders,
    partnerRanking
  }) => ({
    orders: periodOrders,
    revenue: periodRevenue,
    averageTicket: periodOrders ? Math.round(periodRevenue / periodOrders) : 0,
    cancelledOrders,
    cancelRate: periodOrders + cancelledOrders
      ? Math.round((cancelledOrders / (periodOrders + cancelledOrders)) * 100)
      : 0,
    averageResponseSeconds,
    series,
    fulfillment: [
      { id: "delivery", label: "Доставка", orders: deliveryOrders },
      { id: "pickup", label: "Самовывоз", orders: pickupOrders }
    ],
    topItems,
    partnerRanking
  });
  const today = makePeriod({
    periodOrders: notCancelled.length,
    periodRevenue: revenue,
    cancelledOrders: 0,
    averageResponseSeconds: 92,
    series: [
      { label: "09:00", orders: 0, revenue: 0 },
      { label: "12:00", orders: 1, revenue: 1015 },
      { label: "15:00", orders: 0, revenue: 0 },
      { label: "18:00", orders: 1, revenue: 1280 },
      { label: "21:00", orders: 0, revenue: 0 }
    ],
    deliveryOrders: 1,
    pickupOrders: 1,
    partnerRanking: [
      {
        ...DEMO_PARTNERS[0],
        ordersCount: 1,
        revenue: 1280,
        commissionAmount: 90,
        payableAmount: 90,
        paidAmount: 0
      }
    ]
  });
  const month = makePeriod({
    periodOrders: 38,
    periodRevenue: 68940,
    cancelledOrders: 2,
    averageResponseSeconds: 78,
    series: [
      { label: "1–7", orders: 7, revenue: 11420 },
      { label: "8–14", orders: 10, revenue: 17850 },
      { label: "15–21", orders: 8, revenue: 14280 },
      { label: "22–28", orders: 13, revenue: 25390 }
    ],
    deliveryOrders: 27,
    pickupOrders: 11,
    partnerRanking: DEMO_PARTNERS
  });
  const year = makePeriod({
    periodOrders: 246,
    periodRevenue: 438760,
    cancelledOrders: 11,
    averageResponseSeconds: 84,
    series: [
      { label: "янв", orders: 18, revenue: 30120 },
      { label: "фев", orders: 22, revenue: 38480 },
      { label: "мар", orders: 29, revenue: 52700 },
      { label: "апр", orders: 33, revenue: 59460 },
      { label: "май", orders: 41, revenue: 73500 },
      { label: "июн", orders: 45, revenue: 81600 },
      { label: "июл", orders: 58, revenue: 102900 },
      { label: "авг", orders: 0, revenue: 0 },
      { label: "сен", orders: 0, revenue: 0 },
      { label: "окт", orders: 0, revenue: 0 },
      { label: "ноя", orders: 0, revenue: 0 },
      { label: "дек", orders: 0, revenue: 0 }
    ],
    deliveryOrders: 172,
    pickupOrders: 74,
    partnerRanking: DEMO_PARTNERS.map((partner, index) => ({
      ...partner,
      ordersCount: partner.ordersCount * (7 - index),
      revenue: partner.revenue * (7 - index),
      commissionAmount: partner.commissionAmount * (7 - index),
      payableAmount: partner.payableAmount * 2,
      paidAmount: partner.paidAmount * (5 - index)
    }))
  });

  return {
    today,
    month,
    year,
    periods: { today, month, year },
    active: {
      orders: orders.filter((order) => !order.archivedAt && order.status !== "cancelled").length,
      newOrders: orders.filter((order) => !order.archivedAt && order.status === "new").length,
      cancelledOrders: orders.filter((order) => !order.archivedAt && order.status === "cancelled").length,
      byStatus: {
        accepted: orders.filter((order) => !order.archivedAt && order.status === "accepted").length,
        cooking: orders.filter((order) => !order.archivedAt && order.status === "cooking").length,
        courier: orders.filter((order) => !order.archivedAt && order.status === "courier").length
      }
    },
    response: {
      slowest: {
        id: orders[0]?.id || "DEMO",
        customerName: orders[0]?.customerName || "Гость",
        total: orders[0]?.total || 0,
        createdAt: orders[0]?.createdAt || new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        seconds: 92
      }
    }
  };
}

function formatCompactPrice(value) {
  const amount = Math.max(0, Number(value || 0));
  if (amount < 1000) return `${formatPrice(amount)} ₽`;

  return `${new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(amount)} ₽`;
}

function formatOrdersWord(value) {
  const count = Math.abs(Number(value || 0));
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) return "заказов";
  if (mod10 === 1) return "заказ";
  if (mod10 >= 2 && mod10 <= 4) return "заказа";
  return "заказов";
}

function ManagerTrendChart({ points, periodTitle }) {
  const chartPoints = Array.isArray(points) ? points : [];
  const hasData = chartPoints.some((point) => Number(point.orders || 0) || Number(point.revenue || 0));

  if (!hasData) {
    return (
      <div className="admin-trend-empty">
        <BarChart3 size={24} />
        <b>За этот период заказов пока нет</b>
        <span>График заполнится после первого успешно оформленного заказа.</span>
      </div>
    );
  }

  const width = 760;
  const height = 246;
  const padding = { top: 18, right: 18, bottom: 38, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxRevenue = Math.max(1, ...chartPoints.map((point) => Number(point.revenue || 0)));
  const maxOrders = Math.max(1, ...chartPoints.map((point) => Number(point.orders || 0)));
  const xStep = chartPoints.length > 1 ? plotWidth / (chartPoints.length - 1) : plotWidth;
  const getX = (index) => padding.left + (chartPoints.length > 1 ? index * xStep : plotWidth / 2);
  const getRevenueY = (value) =>
    padding.top + plotHeight - (Number(value || 0) / maxRevenue) * plotHeight;
  const revenuePath = chartPoints
    .map((point, index) => `${index ? "L" : "M"} ${getX(index)} ${getRevenueY(point.revenue)}`)
    .join(" ");
  const gridFractions = [1, 0.67, 0.33, 0];

  return (
    <>
      <div className="admin-trend-plot">
        <svg
          className="admin-trend-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Динамика выручки и заказов за период ${periodTitle}`}
        >
          {gridFractions.map((fraction) => {
            const y = padding.top + plotHeight * (1 - fraction);
            return (
              <g className="admin-trend-grid" key={fraction}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text x={padding.left - 10} y={y + 4} textAnchor="end">
                  {formatCompactPrice(maxRevenue * fraction)}
                </text>
              </g>
            );
          })}

          {chartPoints.map((point, index) => {
            const x = getX(index);
            const barHeight = Math.max(3, (Number(point.orders || 0) / maxOrders) * plotHeight * 0.72);
            return (
              <g className="admin-trend-orders" key={`orders-${point.label}`}>
                <rect
                  x={x - Math.min(15, xStep * 0.22)}
                  y={padding.top + plotHeight - barHeight}
                  width={Math.min(30, xStep * 0.44)}
                  height={barHeight}
                  rx="5"
                />
                <title>
                  {point.label}: {point.orders} {formatOrdersWord(point.orders)}
                </title>
              </g>
            );
          })}

          <path className="admin-trend-revenue-line" d={revenuePath} />
          {chartPoints.map((point, index) => {
            const x = getX(index);
            const y = getRevenueY(point.revenue);
            return (
              <g className="admin-trend-revenue-point" key={`revenue-${point.label}`}>
                <circle cx={x} cy={y} r="5" tabIndex="0" />
                <title>
                  {point.label}: {formatPrice(point.revenue)} ₽, {point.orders}{" "}
                  {formatOrdersWord(point.orders)}
                </title>
              </g>
            );
          })}

          {chartPoints.map((point, index) => (
            <text
              className="admin-trend-label"
              x={getX(index)}
              y={height - 12}
              textAnchor="middle"
              key={`label-${point.label}`}
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>

      <details className="admin-chart-data">
        <summary>Точные данные графика</summary>
        <div className="admin-chart-data-scroll">
          <table>
            <thead>
              <tr>
                <th>Период</th>
                <th>Заказы</th>
                <th>Выручка</th>
              </tr>
            </thead>
            <tbody>
              {chartPoints.map((point) => (
                <tr key={`data-${point.label}`}>
                  <td>{point.label}</td>
                  <td>{point.orders}</td>
                  <td>{formatPrice(point.revenue)} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "размер уточняется";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`;
}

function getLostItemNumber(item) {
  return Number(item?.itemNumber || item?.item_number || 0);
}

function formatLostItemNumber(item) {
  const number = getLostItemNumber(item);
  return number > 0 ? `#${String(number).padStart(3, "0")}` : "#---";
}

function filterLostItemsByNumber(items, query) {
  const needle = String(query || "").replace(/\D/g, "");

  if (!needle) {
    return items;
  }

  return items.filter((item) => {
    const number = getLostItemNumber(item);
    const padded = String(number).padStart(3, "0");

    return String(number).includes(needle) || padded.includes(needle);
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Не удалось сжать фотографию"));
      },
      "image/jpeg",
      quality
    );
  });
}

async function loadImageForCompression(file) {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Не удалось открыть фотографию"));
      img.src = url;
    });

    return {
      image,
      release: () => URL.revokeObjectURL(url)
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function compressAdminLostItemPhoto(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Выберите фотографию вещи");
  }

  const { image, release } = await loadImageForCompression(file);

  try {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const ratio = Math.min(1, ADMIN_LOST_ITEM_PHOTO_MAX_SIDE / Math.max(sourceWidth, sourceHeight));
    const baseWidth = Math.max(1, Math.round(sourceWidth * ratio));
    const baseHeight = Math.max(1, Math.round(sourceHeight * ratio));
    let bestBlob = null;

    for (const scale of [1, 0.9, 0.78, 0.66, 0.56]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(baseWidth * scale));
      canvas.height = Math.max(1, Math.round(baseHeight * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.74, 0.66, 0.58, 0.5, 0.44]) {
        const blob = await canvasToJpegBlob(canvas, quality);
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }
        if (blob.size <= ADMIN_LOST_ITEM_PHOTO_MAX_BYTES) {
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "lost-item"}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now()
          });
        }
      }
    }

    return new File([bestBlob || file], `${file.name.replace(/\.[^.]+$/, "") || "lost-item"}.jpg`, {
      type: bestBlob?.type || file.type || "image/jpeg",
      lastModified: Date.now()
    });
  } finally {
    release();
  }
}

function getOrderTotalByStatus(orders) {
  return KITCHEN_STATUS_ORDER.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length
  }));
}

function isActiveOrder(order) {
  return !order.archivedAt && !["payment_pending", "payment_failed"].includes(order.status);
}

function compactAddress(order) {
  const details = [
    order.entrance ? `подъезд ${order.entrance}` : "",
    order.flat ? `кв. ${order.flat}` : ""
  ].filter(Boolean);

  return details.length ? `${order.address}, ${details.join(", ")}` : order.address;
}

function makeOrderDraft(order) {
  return {
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    address: compactAddress(order) || "",
    payment: order.payment || "",
    adminNote: order.adminNote || ""
  };
}

function getOrderPaymentUrl(order) {
  return order.paymentUrl || "";
}

function getOrderStatusHistory(order) {
  const events = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  if (events.length) {
    return events
      .filter((event) => event?.status && event?.changedAt)
      .slice()
      .sort((first, second) => new Date(first.changedAt).getTime() - new Date(second.changedAt).getTime());
  }

  return [
    {
      status: order.status || "new",
      statusLabel: STATUS_LABELS[order.status] || "Получен",
      changedAt: order.createdAt || new Date().toISOString(),
      changedBy: "сайт",
      role: "system",
      note: "Заказ создан"
    }
  ];
}

function getOrderStageText(order) {
  if (order.status === "new") return "Нужно принять";
  if (order.status === "payment_pending") return "Ждем подтверждение оплаты";
  if (order.status === "payment_failed") return "Не передан на кухню";
  if (order.status === "accepted") return "В работе";
  if (order.status === "cooking") return "Готовится";
  if (order.status === "courier") return "Передан курьеру";
  if (order.status === "delivered") return "Можно закрыть";
  if (order.status === "cancelled") return "Отменен";
  return "В работе";
}

function getNextOrderAction(order) {
  if (order.status === "new") {
    return { status: "accepted", label: "Принять заказ", Icon: CheckCircle2 };
  }
  if (order.status === "accepted") {
    return { status: "cooking", label: "Начать готовить", Icon: ChefHat };
  }
  if (order.status === "cooking" && order.mode === "pickup") {
    return { status: "delivered", label: "Заказ выдан", Icon: PackageCheck };
  }
  if (order.status === "cooking") {
    return { status: "courier", label: "Передать курьеру", Icon: Truck };
  }
  if (order.status === "courier") {
    return { status: "delivered", label: "Заказ доставлен", Icon: PackageCheck };
  }
  if (order.status === "delivered") {
    return { archive: true, label: "Закрыть заказ", Icon: Archive };
  }
  if (order.status === "cancelled") {
    return { archive: true, label: "Убрать из смены", Icon: Archive };
  }
  return null;
}

function itemLine(item) {
  const meta = [item.size ? `${item.size} см` : "", item.dough || ""].filter(Boolean).join(", ");
  const addons = item.addons?.length
    ? ` + ${item.addons.map((addon) => (typeof addon === "string" ? addon : addon.name)).join(", ")}`
    : "";

  return `${item.name} × ${item.qty}${meta ? ` · ${meta}` : ""}${addons}`;
}

function renderAdminStars(value) {
  const rating = Math.max(0, Math.min(5, Number(value || 0)));

  return (
    <span className="admin-review-stars" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          fill={index < Math.round(rating) ? "currentColor" : "none"}
          key={index}
          size={16}
          strokeWidth={2.3}
        />
      ))}
    </span>
  );
}

function makeGalleryDraft(item) {
  return {
    type: item.type || "photo",
    title: item.title || "",
    caption: item.caption || "",
    videoUrl: item.videoUrl || "",
    orientation: item.orientation || (item.type === "video" ? "video" : "landscape"),
    sortOrder: item.sortOrder ?? 0,
    status: item.status || "active"
  };
}

function getGalleryThumb(item) {
  return item.type === "video" ? item.poster || item.image : item.image || item.poster;
}

function galleryTypeLabel(type) {
  return type === "video" ? "Видео" : "Фото";
}

function galleryOrientationLabel(orientation) {
  const labels = {
    landscape: "Широкое",
    portrait: "Вертикальное",
    square: "Квадрат",
    video: "Видео 9:16"
  };
  return labels[orientation] || "Широкое";
}

function listToText(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : "";
}

function makeCatalogCategoryForm(category = {}) {
  return {
    id: category.id || "",
    title: category.title || "",
    shortTitle: category.shortTitle || category.short_title || category.label || "",
    description: category.description || "",
    image: category.image || category.imageUrl || "",
    sortOrder: category.sortOrder ?? "",
    status: category.status || "active"
  };
}

function makeCatalogProductForm(product = {}) {
  return {
    id: product.id || "",
    categoryId: product.categoryId || product.category || "",
    name: product.name || "",
    description: product.description || "",
    weight: product.weight || "",
    price: product.price ?? "",
    oldPrice: product.oldPrice || "",
    badges: listToText(product.badges),
    ingredients: listToText(product.ingredients),
    calories: product.nutrition?.calories ?? product.calories ?? "",
    protein: product.nutrition?.protein ?? product.protein ?? "",
    fat: product.nutrition?.fat ?? product.fat ?? "",
    carbs: product.nutrition?.carbs ?? product.carbs ?? "",
    comboItemIds: listToText(product.comboItemIds),
    imageUrl: product.image || "",
    customizable: Boolean(product.customizable),
    featured: Boolean(product.featured),
    sortOrder: product.sortOrder ?? "",
    status: product.status || "active"
  };
}

function splitCatalogTextList(value) {
  return String(value || "")
    .split(/[\n,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCatalogProductImage(product) {
  return product?.image || product?.visual?.image || ADMIN_PRODUCT_FALLBACK_IMAGE;
}

function getCatalogCategoryLabel(categories, categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  return category?.shortTitle || category?.title || categoryId || "Без категории";
}

export default function AdminApp() {
  const demoRequested = new URLSearchParams(window.location.search).get("demo") === "1" && isLocalhost();
  const savedLogin = demoRequested ? "" : localStorage.getItem(LOGIN_KEY) || (isLocalhost() ? "рук" : "");
  const [password, setPassword] = useState(() => (demoRequested ? "__local_demo__" : ""));
  const [adminLogin, setAdminLogin] = useState(() => (demoRequested ? "demo" : savedLogin));
  const [draftLogin, setDraftLogin] = useState(savedLogin || (isLocalhost() ? "рук" : ""));
  const [draftPassword, setDraftPassword] = useState(isLocalhost() ? "рук" : "");
  const [account, setAccount] = useState(() =>
    demoRequested
      ? {
          login: "demo",
          role: "manager",
          label: "Руководитель"
        }
      : null
  );
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(getEmptyDashboard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(!demoRequested);
  const [pushStatus, setPushStatus] = useState("");
  const [pushLoading, setPushLoading] = useState(false);
  const [passkeySupported] = useState(supportsAdminPasskeys);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState("");
  const [partners, setPartners] = useState([]);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    login: "",
    password: isLocalhost() ? DEV_PASSWORD : "",
    promoCode: "",
    discountPercent: 10,
    commissionPercent: 7
  });
  const [partnerStatus, setPartnerStatus] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState(null);
  const [partnerDetailsLoading, setPartnerDetailsLoading] = useState(false);
  const [partnerActionLoading, setPartnerActionLoading] = useState("");
  const [partnerManagerStatus, setPartnerManagerStatus] = useState("");
  const [partnerPasswordDraft, setPartnerPasswordDraft] = useState("");
  const [partnerPasswordVisible, setPartnerPasswordVisible] = useState(false);
  const [partnerCredential, setPartnerCredential] = useState(null);
  const [partnerAccessConfirmation, setPartnerAccessConfirmation] = useState("");
  const [partnerPayoutDraft, setPartnerPayoutDraft] = useState({ amount: "", note: "" });
  const [partnerPayoutConfirmation, setPartnerPayoutConfirmation] = useState(false);
  const [partnerWorkspaceView, setPartnerWorkspaceView] = useState("partners");
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoCodeForm, setPromoCodeForm] = useState(EMPTY_PROMO_CODE_FORM);
  const [editingPromoCodeId, setEditingPromoCodeId] = useState("");
  const [promoCodeStatus, setPromoCodeStatus] = useState("");
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoProductSearch, setPromoProductSearch] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState("pending");
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS);
  const [deliverySettingsStatus, setDeliverySettingsStatus] = useState("");
  const [deliverySettingsLoading, setDeliverySettingsLoading] = useState(false);
  const [lostItems, setLostItems] = useState([]);
  const [lostItemPhoto, setLostItemPhoto] = useState(null);
  const [lostItemPreview, setLostItemPreview] = useState("");
  const [lostItemAddedAt, setLostItemAddedAt] = useState(getTodayInputValue);
  const [lostItemStatus, setLostItemStatus] = useState("");
  const [lostItemLoading, setLostItemLoading] = useState(false);
  const [lostItemInputKey, setLostItemInputKey] = useState(0);
  const [lostItemSearch, setLostItemSearch] = useState("");
  const [lostItemViewer, setLostItemViewer] = useState(null);
  const [bloggerRewards, setBloggerRewards] = useState([]);
  const [bloggerRewardForm, setBloggerRewardForm] = useState(EMPTY_BLOGGER_REWARD_FORM);
  const [bloggerRewardReviewFile, setBloggerRewardReviewFile] = useState(null);
  const [bloggerRewardProfileFile, setBloggerRewardProfileFile] = useState(null);
  const [bloggerRewardReviewPreview, setBloggerRewardReviewPreview] = useState("");
  const [bloggerRewardProfilePreview, setBloggerRewardProfilePreview] = useState("");
  const [bloggerRewardInputKey, setBloggerRewardInputKey] = useState(0);
  const [bloggerRewardStatus, setBloggerRewardStatus] = useState("");
  const [bloggerRewardLoading, setBloggerRewardLoading] = useState("");
  const [bloggerRewardSearch, setBloggerRewardSearch] = useState("");
  const [bloggerRewardView, setBloggerRewardView] = useState("pending");
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryForm, setGalleryForm] = useState(EMPTY_GALLERY_FORM);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState("");
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [galleryDrafts, setGalleryDrafts] = useState({});
  const [galleryStatus, setGalleryStatus] = useState("");
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [catalogCategoryForm, setCatalogCategoryForm] = useState(EMPTY_CATALOG_CATEGORY_FORM);
  const [editingCatalogCategoryId, setEditingCatalogCategoryId] = useState("");
  const [catalogProductForm, setCatalogProductForm] = useState(EMPTY_CATALOG_PRODUCT_FORM);
  const [editingCatalogProductId, setEditingCatalogProductId] = useState("");
  const [catalogProductFile, setCatalogProductFile] = useState(null);
  const [catalogProductPreview, setCatalogProductPreview] = useState("");
  const [catalogProductInputKey, setCatalogProductInputKey] = useState(0);
  const [catalogVideoProduct, setCatalogVideoProduct] = useState(null);
  const [catalogVideoFile, setCatalogVideoFile] = useState(null);
  const [catalogVideoPreview, setCatalogVideoPreview] = useState("");
  const [catalogVideoInputKey, setCatalogVideoInputKey] = useState(0);
  const [catalogEditorOpen, setCatalogEditorOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("all");
  const [catalogStatus, setCatalogStatus] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogVisibilityLoadingId, setCatalogVisibilityLoadingId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [orderDrafts, setOrderDrafts] = useState({});
  const [orderActionLoading, setOrderActionLoading] = useState("");
  const [adminView, setAdminView] = useState("orders");
  const [dashboardPeriod, setDashboardPeriod] = useState("month");

  const activeOrders = useMemo(() => orders.filter(isActiveOrder), [orders]);
  const archivedCount = orders.filter((order) => order.archivedAt).length;
  const stats = useMemo(() => getOrderTotalByStatus(activeOrders), [activeOrders]);
  const revenue = useMemo(
    () =>
      activeOrders.reduce(
        (sum, order) => (order.status === "cancelled" ? sum : sum + Number(order.total || 0)),
        0
      ),
    [activeOrders]
  );
  const deliveryCount = useMemo(
    () => activeOrders.filter((order) => order.mode !== "pickup").length,
    [activeOrders]
  );
  const pickupCount = activeOrders.length - deliveryCount;
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(new Date()),
    []
  );
  const activeLostItems = useMemo(() => lostItems.filter((item) => !item.archivedAt), [lostItems]);
  const archivedLostItems = useMemo(() => lostItems.filter((item) => item.archivedAt), [lostItems]);
  const filteredActiveLostItems = useMemo(
    () => filterLostItemsByNumber(activeLostItems, lostItemSearch),
    [activeLostItems, lostItemSearch]
  );
  const filteredArchivedLostItems = useMemo(
    () => filterLostItemsByNumber(archivedLostItems, lostItemSearch),
    [archivedLostItems, lostItemSearch]
  );
  const pendingBloggerRewards = useMemo(
    () => bloggerRewards.filter((reward) => reward.status !== "redeemed"),
    [bloggerRewards]
  );
  const redeemedBloggerRewards = useMemo(
    () => bloggerRewards.filter((reward) => reward.status === "redeemed"),
    [bloggerRewards]
  );
  const filteredBloggerRewards = useMemo(() => {
    const source = bloggerRewardView === "redeemed" ? redeemedBloggerRewards : pendingBloggerRewards;
    const needle = bloggerRewardSearch.trim().toLowerCase().replace(/^@/, "");
    if (!needle) return source;

    return source.filter((reward) =>
      [reward.instagramKey, reward.instagramUrl, reward.createdBy, reward.redeemedBy]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [
    bloggerRewardSearch,
    bloggerRewardView,
    pendingBloggerRewards,
    redeemedBloggerRewards
  ]);
  const activeGalleryItems = useMemo(
    () =>
      galleryItems
        .filter((item) => item.status !== "archived" && !item.archivedAt)
        .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0)),
    [galleryItems]
  );
  const archivedGalleryItems = useMemo(
    () => galleryItems.filter((item) => item.status === "archived" || item.archivedAt),
    [galleryItems]
  );
  const catalogCategories = useMemo(
    () => (Array.isArray(catalog.categories) ? catalog.categories : []),
    [catalog.categories]
  );
  const activeCatalogCategories = useMemo(
    () => catalogCategories.filter((category) => category.status !== "archived" && !category.archivedAt),
    [catalogCategories]
  );
  const catalogProducts = useMemo(
    () => (Array.isArray(catalog.products) ? catalog.products : []),
    [catalog.products]
  );
  const activeCatalogProducts = useMemo(
    () => catalogProducts.filter((product) => product.status !== "archived" && !product.archivedAt),
    [catalogProducts]
  );
  const filteredPromoProducts = useMemo(() => {
    const needle = promoProductSearch.trim().toLowerCase();
    if (!needle) return activeCatalogProducts;
    return activeCatalogProducts.filter((product) =>
      [product.name, product.id, getCatalogCategoryLabel(activeCatalogCategories, product.categoryId || product.category)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [activeCatalogCategories, activeCatalogProducts, promoProductSearch]);
  const archivedCatalogProducts = useMemo(
    () => catalogProducts.filter((product) => product.status === "archived" || product.archivedAt),
    [catalogProducts]
  );
  const filteredCatalogProducts = useMemo(() => {
    const needle = catalogSearch.trim().toLowerCase();
    return activeCatalogProducts.filter((product) => {
      const productCategory = product.categoryId || product.category || "";
      const matchesCategory = catalogCategoryFilter === "all" || productCategory === catalogCategoryFilter;
      if (!matchesCategory) return false;
      if (!needle) return true;

      return [product.id, product.name, product.description, productCategory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [activeCatalogProducts, catalogCategoryFilter, catalogSearch]);
  const editingCatalogProduct = useMemo(
    () => catalogProducts.find((product) => product.id === editingCatalogProductId) || null,
    [catalogProducts, editingCatalogProductId]
  );
  const nextCatalogProductSortOrder = useMemo(() => {
    const categoryId = catalogProductForm.categoryId;
    const sameCategoryProducts = catalogProducts.filter((product) => {
      const productCategory = product.categoryId || product.category || "";
      return productCategory === categoryId && product.id !== editingCatalogProductId;
    });
    const maxSortOrder = sameCategoryProducts.reduce(
      (max, product) => Math.max(max, Number(product.sortOrder || 0)),
      0
    );
    return maxSortOrder + 10;
  }, [catalogProductForm.categoryId, catalogProducts, editingCatalogProductId]);
  const canManageBusiness = isManagerAccount(account);
  const dashboardData = dashboard || getEmptyDashboard();
  const dashboardPeriodSummary = getDashboardPeriodSummary(dashboardData, dashboardPeriod);
  const dashboardChartPoints = useMemo(
    () =>
      dashboardPeriodSummary.series.length
        ? dashboardPeriodSummary.series
        : buildDashboardChartPoints(orders, dashboardPeriod),
    [dashboardPeriod, dashboardPeriodSummary.series, orders]
  );
  const dashboardPeriodTitle =
    DASHBOARD_PERIODS.find((period) => period.id === dashboardPeriod)?.title || "Период";
  const adminTabs = canManageBusiness
    ? [
        ["dashboard", "Главная", LayoutDashboard],
        ["orders", "Заказы", ListChecks],
        ["catalog", "Каталог", PackageCheck],
        ["gallery", "Галерея", ImagePlus],
        ["reviews", "Отзывы", Star],
        ["lost", "Потеряшки", Camera],
        ["blogger-rewards", "Десерт", Gift, "Десерт за отзыв"],
        ["partners", "Партнёры и промокоды", Tags],
        ["settings", "Настройки", Settings2]
      ]
    : [
        ["orders", "Заказы", ListChecks],
        ["catalog", "Каталог", PackageCheck],
        ["lost", "Потеряшки", Camera],
        ["blogger-rewards", "Десерт за отзыв", Gift]
      ];
  const catalogProductPreviewImage = catalogProductPreview || catalogProductForm.imageUrl;
  const managedPartner = partnerDetails?.partner || null;
  const managedPartnerPayouts = Array.isArray(partnerDetails?.payouts) ? partnerDetails.payouts : [];

  useEffect(() => {
    if (!account?.role) return;
    setAdminView(isManagerAccount(account) ? "dashboard" : "orders");
    const isManager = isManagerAccount(account);
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute("href", isManager ? "/admin-manifest.json" : "/admin-staff-manifest.json");
    document
      .querySelector('meta[name="apple-mobile-web-app-title"]')
      ?.setAttribute("content", isManager ? "ВВ Руководитель" : "ВВ Администратор");
    document.title = isManager
      ? "Вместе Вкуснее | Руководитель"
      : "Вместе Вкуснее | Администратор";

    const url = new URL(window.location.href);
    url.searchParams.set("role", isManager ? "manager" : "admin");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [account?.role]);

  useEffect(() => {
    if (
      !account?.role ||
      !password ||
      pushLoading ||
      pushStatus ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    setupAdminPush({ silent: true });
  }, [account?.role, password, pushLoading, pushStatus]);

  useEffect(() => {
    if (demoRequested) {
      setDemoMode(true);
      setOrders(DEMO_ORDERS);
      setDashboard(buildDemoDashboard(DEMO_ORDERS));
      setPartners(DEMO_PARTNERS);
      setPromoCodes(DEMO_PROMO_CODES);
      setReviews(listDemoReviews({ status: "pending" }));
      setLostItems(siteLostItems.map((item) => ({ ...item })));
      setBloggerRewards([]);
      setGalleryItems([]);
      setCatalog(DEMO_CATALOG);
      setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
      setAccount({
        login: "demo",
        role: "manager",
        label: "Руководитель"
      });
      setError("");
      setCheckingSession(false);
      return;
    }

    const storedLogin = localStorage.getItem(LOGIN_KEY) || (isLocalhost() ? "рук" : "");
    localStorage.removeItem(LEGACY_PASSWORD_KEY);
    setAdminLogin(storedLogin);
    setDraftLogin(storedLogin);

    fetch(apiPath("adminSessionMe"))
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(async ({ response, data }) => {
        if (!response.ok || data.ok !== true || !data.account?.login) return;
        setDraftLogin(data.account.login);
        await verifyLogin(SESSION_AUTH_MARKER, {
          login: data.account.login,
          persist: false
        });
      })
      .catch(() => undefined)
      .finally(() => setCheckingSession(false));
  }, [demoRequested]);

  useEffect(() => {
    return () => {
      if (lostItemPreview) {
        URL.revokeObjectURL(lostItemPreview);
      }
    };
  }, [lostItemPreview]);

  useEffect(() => {
    return () => {
      if (bloggerRewardReviewPreview) {
        URL.revokeObjectURL(bloggerRewardReviewPreview);
      }
    };
  }, [bloggerRewardReviewPreview]);

  useEffect(() => {
    return () => {
      if (bloggerRewardProfilePreview) {
        URL.revokeObjectURL(bloggerRewardProfilePreview);
      }
    };
  }, [bloggerRewardProfilePreview]);

  useEffect(() => {
    return () => {
      if (galleryPreview) {
        URL.revokeObjectURL(galleryPreview);
      }
    };
  }, [galleryPreview]);

  useEffect(() => {
    return () => {
      if (catalogProductPreview) {
        URL.revokeObjectURL(catalogProductPreview);
      }
    };
  }, [catalogProductPreview]);

  useEffect(() => {
    return () => {
      if (catalogVideoPreview) {
        URL.revokeObjectURL(catalogVideoPreview);
      }
    };
  }, [catalogVideoPreview]);

  useEffect(() => {
    if (!catalogEditorOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [catalogEditorOpen]);

  useEffect(() => {
    if (!catalogVideoProduct) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [catalogVideoProduct]);

  useEffect(() => {
    if (!partnerDetails) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [partnerDetails]);

  useEffect(() => {
    if (!lostItemViewer) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLostItemViewer(null);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [lostItemViewer]);

  useEffect(() => {
    setGalleryDrafts(
      galleryItems.reduce((acc, item) => {
        acc[item.id] = makeGalleryDraft(item);
        return acc;
      }, {})
    );
  }, [galleryItems]);

  function adminHeaders(nextPassword = password, nextLogin = adminLogin, extra = {}) {
    return {
      ...extra,
      "x-admin-login": encodeURIComponent(nextLogin || ""),
      "x-admin-password": encodeURIComponent(nextPassword || "")
    };
  }

  async function fetchOrders(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminOrders"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить заказы");
      nextError.status = response.status;
      nextError.details = data.details;
      nextError.name = data.name || "AdminRequestError";
      throw nextError;
    }

    return {
      account: data.account || null,
      orders: data.orders || []
    };
  }

  async function fetchDashboard(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminDashboard"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить дашборд руководителя");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.dashboard || getEmptyDashboard();
  }

  async function fetchPartners(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminPartners"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить партнёров");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.partners || [];
  }

  async function fetchPromoCodes(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminPromoCodes"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить промокоды");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.promoCodes || [];
  }

  async function fetchReviews(nextPassword, status = reviewStatusFilter, nextLogin = adminLogin) {
    const response = await fetch(`${apiPath("adminReviews")}?status=${encodeURIComponent(status)}`, {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить отзывы");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.reviews || [];
  }

  async function fetchDeliverySettings(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminDeliverySettings"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить настройки доставки");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return normalizeDeliverySettings(data.settings);
  }

  async function fetchLostItems(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminLostItems"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить потеряшки");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.items || [];
  }

  async function fetchBloggerRewards(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminBloggerReviewRewards"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить учёт десертов");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.rewards || [];
  }

  async function fetchGalleryItems(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminGallery"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить галерею");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.items || [];
  }

  async function fetchCatalog(nextPassword, nextLogin = adminLogin) {
    const response = await fetch(apiPath("adminCatalog"), {
      headers: adminHeaders(nextPassword, nextLogin)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const nextError = new Error(data.error || "Не удалось загрузить каталог");
      nextError.status = response.status;
      nextError.details = data.details;
      throw nextError;
    }

    return data.catalog || EMPTY_CATALOG;
  }

  async function loadDeliverySettings(nextPassword = password, nextLogin = adminLogin) {
    if (!nextPassword || demoMode) {
      setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
      return;
    }

    try {
      const nextSettings = await fetchDeliverySettings(nextPassword, nextLogin);
      setDeliverySettings(nextSettings);
      saveStoredDeliverySettings(nextSettings);
    } catch {
      setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
    }
  }

  async function refreshDashboard(nextPassword = password, nextLogin = adminLogin) {
    if (!nextPassword || demoMode || !isManagerAccount(account)) return;

    try {
      setDashboard(await fetchDashboard(nextPassword, nextLogin));
    } catch {
      // Dashboard refresh should not block order work.
    }
  }

  async function verifyLogin(nextPassword, options = {}) {
    const shouldPersist = options.persist !== false;
    const nextLogin = (options.login || draftLogin || "").trim().toLowerCase();

    setLoading(true);
    setError("");

    try {
      const ordersResult = await fetchOrders(nextPassword, nextLogin);
      const nextAccount = ordersResult.account || {
        login: nextLogin,
        role: "manager",
        label: "Руководитель"
      };
      const hasBusinessAccess = isManagerAccount(nextAccount);
      const [
        nextPartners,
        nextPromoCodes,
        nextReviews,
        nextLostItems,
        nextBloggerRewards,
        nextCatalog,
        nextGalleryItems,
        nextDashboard
      ] = await Promise.all([
        hasBusinessAccess ? fetchPartners(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchPromoCodes(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchReviews(nextPassword, "pending", nextLogin) : Promise.resolve([]),
        fetchLostItems(nextPassword, nextLogin),
        fetchBloggerRewards(nextPassword, nextLogin),
        fetchCatalog(nextPassword, nextLogin),
        hasBusinessAccess ? fetchGalleryItems(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchDashboard(nextPassword, nextLogin) : Promise.resolve(getEmptyDashboard())
      ]);
      setDemoMode(false);
      setOrders(ordersResult.orders);
      setDashboard(nextDashboard);
      setPartners(nextPartners);
      setPromoCodes(nextPromoCodes);
      setReviews(nextReviews);
      setLostItems(nextLostItems);
      setBloggerRewards(nextBloggerRewards);
      setCatalog(nextCatalog);
      setGalleryItems(nextGalleryItems);
      setReviewStatusFilter("pending");
      setPassword(nextPassword);
      setAdminLogin(nextLogin);
      setAccount(nextAccount);
      if (hasBusinessAccess) {
        loadDeliverySettings(nextPassword, nextLogin);
      } else {
        setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
      }
      if (shouldPersist) {
        localStorage.setItem(LOGIN_KEY, nextLogin);
      }
      return true;
    } catch (loginError) {
      if (isLocalhost() && nextPassword === DEV_PASSWORD) {
        const nextAccount = {
          login: nextLogin || "рук",
          role: nextLogin === "admin" || nextLogin === "админ" ? "admin" : "manager",
          label: nextLogin === "admin" || nextLogin === "админ" ? "Администратор" : "Руководитель"
        };
        setDemoMode(true);
        setOrders(DEMO_ORDERS);
        setDashboard(buildDemoDashboard(DEMO_ORDERS));
        setPartners(nextAccount.role === "manager" ? DEMO_PARTNERS : []);
        setPromoCodes(nextAccount.role === "manager" ? DEMO_PROMO_CODES : []);
        setReviews(nextAccount.role === "manager" ? listDemoReviews({ status: "pending" }) : []);
        setLostItems([]);
        setBloggerRewards([]);
        setCatalog(DEMO_CATALOG);
        setGalleryItems([]);
        setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
        setPassword(nextPassword);
        setAdminLogin(nextAccount.login);
        setAccount(nextAccount);
        if (shouldPersist) {
          localStorage.setItem(LOGIN_KEY, nextAccount.login);
        }
        setError("");
        return true;
      }

      localStorage.removeItem(LEGACY_PASSWORD_KEY);
      localStorage.removeItem(LOGIN_KEY);
      setPassword("");
      setAdminLogin("");
      setAccount(null);
      setOrders([]);
      setDashboard(getEmptyDashboard());
      setPartners([]);
      setPromoCodes([]);
      setReviews([]);
      setLostItems([]);
      setBloggerRewards([]);
      setCatalog(EMPTY_CATALOG);
      setGalleryItems([]);
      setError(adminErrorMessage(loginError));
      return false;
    } finally {
      setLoading(false);
      setCheckingSession(false);
    }
  }

  async function loadOrders(nextPassword = password) {
    if (!nextPassword) return;
    const nextLogin = adminLogin || draftLogin;

    setLoading(true);
    setError("");

    try {
      const ordersResult = await fetchOrders(nextPassword, nextLogin);
      const nextAccount = ordersResult.account || account || {
        login: nextLogin,
        role: "manager",
        label: "Руководитель"
      };
      const hasBusinessAccess = isManagerAccount(nextAccount);
      const [
        nextPartners,
        nextPromoCodes,
        nextReviews,
        nextLostItems,
        nextBloggerRewards,
        nextCatalog,
        nextGalleryItems,
        nextDashboard
      ] = await Promise.all([
        hasBusinessAccess ? fetchPartners(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchPromoCodes(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchReviews(nextPassword, reviewStatusFilter, nextLogin) : Promise.resolve([]),
        fetchLostItems(nextPassword, nextLogin),
        fetchBloggerRewards(nextPassword, nextLogin),
        fetchCatalog(nextPassword, nextLogin),
        hasBusinessAccess ? fetchGalleryItems(nextPassword, nextLogin) : Promise.resolve([]),
        hasBusinessAccess ? fetchDashboard(nextPassword, nextLogin) : Promise.resolve(getEmptyDashboard())
      ]);
      setDemoMode(false);
      setOrders(ordersResult.orders);
      setDashboard(nextDashboard);
      setPartners(nextPartners);
      setPromoCodes(nextPromoCodes);
      setReviews(nextReviews);
      setLostItems(nextLostItems);
      setBloggerRewards(nextBloggerRewards);
      setCatalog(nextCatalog);
      setGalleryItems(nextGalleryItems);
      setAdminLogin(nextLogin);
      setAccount(nextAccount);
      if (hasBusinessAccess) {
        loadDeliverySettings(nextPassword, nextLogin);
      } else {
        setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
      }
    } catch (fetchError) {
      if (fetchError.status === 401) {
        localStorage.removeItem(LEGACY_PASSWORD_KEY);
        localStorage.removeItem(LOGIN_KEY);
        setPassword("");
        setAdminLogin("");
        setAccount(null);
        setOrders([]);
        setDashboard(getEmptyDashboard());
        setPartners([]);
        setPromoCodes([]);
        setReviews([]);
        setLostItems([]);
        setBloggerRewards([]);
        setCatalog(DEMO_CATALOG);
        setGalleryItems([]);
        setDraftLogin(nextLogin);
        setDraftPassword(nextPassword);
        setError(adminErrorMessage(fetchError));
      } else if (isLocalhost()) {
        const localAccount = account || {
          login: nextLogin || "рук",
          role: nextLogin === "admin" || nextLogin === "админ" ? "admin" : "manager",
          label: nextLogin === "admin" || nextLogin === "админ" ? "Администратор" : "Руководитель"
        };
        setDemoMode(true);
        setOrders(DEMO_ORDERS);
        setDashboard(buildDemoDashboard(DEMO_ORDERS));
        setPartners(isManagerAccount(localAccount) ? DEMO_PARTNERS : []);
        setPromoCodes(isManagerAccount(localAccount) ? DEMO_PROMO_CODES : []);
        setReviews(isManagerAccount(localAccount) ? listDemoReviews({ status: reviewStatusFilter }) : []);
        setLostItems([]);
        setBloggerRewards([]);
        setCatalog(EMPTY_CATALOG);
        setGalleryItems([]);
        setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
        setAccount(localAccount);
          setError("Локальный демо-режим: API доступен после запуска VPS-сервера или Docker Compose.");
      } else {
        setError(adminErrorMessage(fetchError));
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, status) {
    const changedAt = new Date().toISOString();
    if (demoMode) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
                updatedAt: changedAt,
                statusHistory: [
                  ...getOrderStatusHistory(order),
                  {
                    status,
                    statusLabel: STATUS_LABELS[status] || status,
                    changedAt,
                    changedBy: adminLogin || "demo",
                    role: account?.role || "admin"
                  }
                ]
              }
            : order
        )
      );
      return;
    }

    setError("");
    setOrderActionLoading(`status:${orderId}`);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: changedAt } : order
      )
    );

    try {
      const response = await fetch(apiPath("adminOrders"), {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          id: orderId,
          status
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось обновить статус");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      if (data.push && data.push.ok === false) {
        setError(`Статус обновлен, но push не отправлен: ${data.push.reason || "у клиента нет подписки"}`);
      }
      refreshDashboard();
    } catch (statusError) {
      setError(statusError.message || "Не удалось обновить статус");
      loadOrders();
    } finally {
      setOrderActionLoading("");
    }
  }

  function startEditOrder(order) {
    if (editingOrderId === order.id) {
      setEditingOrderId("");
      return;
    }

    setOrderDrafts((current) => ({
      ...current,
      [order.id]: makeOrderDraft(order)
    }));
    setEditingOrderId(order.id);
  }

  function updateOrderDraft(orderId, field, value) {
    setOrderDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [field]: value
      }
    }));
  }

  async function saveOrderDraft(orderId) {
    const draft = orderDrafts[orderId];
    if (!draft) return;

    if (demoMode) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, ...draft, updatedAt: new Date().toISOString() } : order
        )
      );
      setEditingOrderId("");
      return;
    }

    setOrderActionLoading(`update:${orderId}`);
    setError("");

    try {
      const response = await fetch(apiPath("adminOrders"), {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          action: "update",
          id: orderId,
          patch: draft
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить правки заказа");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      setEditingOrderId("");
      refreshDashboard();
    } catch (updateError) {
      setError(updateError.message || "Не удалось сохранить правки заказа");
    } finally {
      setOrderActionLoading("");
    }
  }

  async function cancelOrderCard(orderId) {
    const reason = window.prompt(
      "Причина отмены для внутренней истории заказа",
      "Клиент попросил отменить заказ по телефону"
    );
    if (reason === null) return;

    const cleanReason = reason.trim() || "Клиент попросил отменить заказ";
    const confirmed = window.confirm("Отменить заказ? Он останется в смене до ручного закрытия.");
    if (!confirmed) return;

    if (demoMode) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "cancelled",
                cancelReason: cleanReason,
                cancelledAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : order
        )
      );
      return;
    }

    setOrderActionLoading(`cancel:${orderId}`);
    setError("");

    try {
      const response = await fetch(apiPath("adminOrders"), {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          action: "cancel",
          id: orderId,
          reason: cleanReason
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось отменить заказ");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      refreshDashboard();
    } catch (cancelError) {
      setError(cancelError.message || "Не удалось отменить заказ");
    } finally {
      setOrderActionLoading("");
    }
  }

  async function refundOrderPayment(order) {
    const confirmed = window.confirm(
      `Вернуть ${formatPrice(order.total)} ₽ через ЮKassa? Операция будет отправлена платежному провайдеру.`
    );
    if (!confirmed) return;

    if (demoMode) {
      setError("В демо-режиме возврат не отправляется в ЮKassa");
      return;
    }

    setOrderActionLoading(`refund:${order.id}`);
    setError("");

    try {
      const response = await fetch(`${apiPath("adminOrders")}/${encodeURIComponent(order.id)}/refund`, {
        method: "POST",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          reason: `Полный возврат по заказу ${order.id}`
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось оформить возврат");
      }

      setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
      setError(`Возврат создан: ${formatPrice(Number(data.refund?.amount?.value || order.total))} ₽`);
      refreshDashboard();
    } catch (refundError) {
      setError(refundError.message || "Не удалось оформить возврат");
    } finally {
      setOrderActionLoading("");
    }
  }

  async function login(event) {
    event.preventDefault();
    const nextLogin = draftLogin.trim().toLowerCase();
    const next = draftPassword.trim();
    if (!nextLogin) {
      setError("Введите логин");
      return;
    }
    if (!next) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiPath("adminSessionLogin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: nextLogin, password: next })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось войти");
      }

      const verified = await verifyLogin(SESSION_AUTH_MARKER, {
        login: data.account?.login || nextLogin,
        persist: true
      });
      if (verified) {
        setDraftPassword("");
        setPasskeyStatus(
          passkeySupported
            ? "Можно включить быстрый вход по Face ID или отпечатку кнопкой с ключом."
            : ""
        );
      }
    } catch (loginError) {
      if (isLocalhost()) {
        await verifyLogin(next, { login: nextLogin });
      } else {
        setError(loginError.message || "Не удалось войти");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPasskey() {
    const nextLogin = draftLogin.trim().toLowerCase();
    if (!nextLogin) {
      setError("Сначала укажите логин");
      return;
    }

    setPasskeyLoading(true);
    setError("");
    setPasskeyStatus("Подтвердите вход на устройстве...");
    try {
      const data = await authenticateAdminPasskey(nextLogin);
      const verified = await verifyLogin(SESSION_AUTH_MARKER, {
        login: data.account?.login || nextLogin,
        persist: true
      });
      if (verified) {
        setDraftPassword("");
        setPasskeyStatus("Быстрый вход подтверждён.");
      }
    } catch (passkeyError) {
      setPasskeyStatus("");
      setError(passkeyError.message || "Не удалось выполнить быстрый вход");
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function setupAdminPasskey() {
    if (!password || passkeyLoading) return;

    setPasskeyLoading(true);
    setPasskeyStatus("Откроется системное подтверждение устройства...");
    try {
      await registerAdminPasskey(adminHeaders(password, adminLogin));
      setPasskeyStatus("Быстрый вход подключён. При следующем входе пароль не понадобится.");
    } catch (passkeyError) {
      setPasskeyStatus(passkeyError.message || "Не удалось подключить быстрый вход");
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function logoutAdmin() {
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
      const subscription = registration ? await registration.pushManager?.getSubscription() : null;
      if (subscription?.endpoint) {
        await fetch(apiPath("adminPush"), {
          method: "DELETE",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      await fetch(apiPath("adminSessionLogout"), { method: "POST" });
    } catch {
      // Локальное состояние всё равно очищаем.
    }

    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(LEGACY_PASSWORD_KEY);
    setPassword("");
    setAdminLogin("");
    setAccount(null);
    setOrders([]);
    setDashboard(getEmptyDashboard());
    setPartners([]);
    setPromoCodes([]);
    setReviews([]);
    setLostItems([]);
    setBloggerRewards([]);
    setCatalog(EMPTY_CATALOG);
    setGalleryItems([]);
    setDraftLogin(isLocalhost() ? "рук" : "");
    setDraftPassword(isLocalhost() ? "рук" : "");
    setPasskeyStatus("");
    setPushStatus("");
    setError("");
  }

  async function saveDeliveryTiming() {
    if (!canManageBusiness) {
      setDeliverySettingsStatus("Настройки доставки доступны только руководителю.");
      return;
    }

    if (!password || demoMode) {
      setDeliverySettingsStatus("В демо-режиме настройка не сохраняется на сервере.");
      return;
    }

    setDeliverySettingsLoading(true);
    setDeliverySettingsStatus("Сохраняем время доставки...");

    try {
      const response = await fetch(apiPath("adminDeliverySettings"), {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(deliverySettings)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить настройки доставки");
      }

      const nextSettings = normalizeDeliverySettings(data.settings);
      setDeliverySettings(nextSettings);
      saveStoredDeliverySettings(nextSettings);
      setDeliverySettingsStatus("Время доставки обновлено.");
    } catch (settingsError) {
      setDeliverySettingsStatus(settingsError.message || "Не удалось сохранить время доставки");
    } finally {
      setDeliverySettingsLoading(false);
    }
  }

  async function handleLostItemPhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLostItemStatus("Готовим фото к отправке...");
    setLostItemLoading(true);

    try {
      const compressedFile = await compressAdminLostItemPhoto(file);
      const nextPreview = URL.createObjectURL(compressedFile);
      setLostItemPhoto(compressedFile);
      setLostItemPreview(nextPreview);
      setLostItemStatus(`Фото готово: ${formatFileSize(compressedFile.size)}. Можно отправлять.`);
    } catch (photoError) {
      setLostItemPhoto(null);
      setLostItemPreview("");
      setLostItemStatus(photoError.message || "Не удалось подготовить фото");
    } finally {
      setLostItemLoading(false);
    }
  }

  async function createLostItem(event) {
    event.preventDefault();

    if (!lostItemPhoto) {
      setLostItemStatus("Сначала сделайте или выберите фото.");
      return;
    }

    if (!password || lostItemLoading) return;

    if (demoMode) {
      setLostItemStatus("В демо-режиме фото не сохраняется на сервере.");
      return;
    }

    setLostItemLoading(true);
    setLostItemStatus("Отправляем потеряшку на сайт...");

    try {
      const formData = new FormData();
      formData.append("photo", lostItemPhoto);
      formData.append("addedAt", lostItemAddedAt || getTodayInputValue());
      formData.append("createdBy", "Админка");

      const response = await fetch(apiPath("adminLostItems"), {
        method: "POST",
        headers: adminHeaders(password, adminLogin),
        body: formData
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось добавить потеряшку");
      }

      setLostItems((current) => [data.item, ...current]);
      setLostItemPhoto(null);
      setLostItemPreview("");
      setLostItemAddedAt(getTodayInputValue());
      setLostItemInputKey((current) => current + 1);
      setLostItemStatus(
        `Потеряшка ${formatLostItemNumber(data.item)} опубликована. Фото на сервере: ${formatFileSize(data.item?.sizeBytes)}.`
      );
    } catch (lostItemError) {
      setLostItemStatus(lostItemError.message || "Не удалось добавить потеряшку");
    } finally {
      setLostItemLoading(false);
    }
  }

  async function archiveAdminLostItem(itemId) {
    if (!itemId || lostItemLoading) return;

    if (demoMode) {
      setLostItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, archivedAt: new Date().toISOString() } : item))
      );
      setLostItemStatus("Потеряшка удалена с публичной страницы в демо-режиме и оставлена в архиве.");
      return;
    }

    setLostItemLoading(true);
    setLostItemStatus("Удаляем потеряшку с публичной страницы...");

    try {
      const response = await fetch(`${apiPath("adminLostItems")}/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: adminHeaders(password, adminLogin)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось убрать потеряшку");
      }

      setLostItems((current) => current.map((item) => (item.id === itemId ? data.item : item)));
      setLostItemStatus(`Потеряшка ${formatLostItemNumber(data.item)} удалена с публичной страницы и оставлена в архиве.`);
    } catch (lostItemError) {
      setLostItemStatus(lostItemError.message || "Не удалось убрать потеряшку");
    } finally {
      setLostItemLoading(false);
    }
  }

  function handleBloggerRewardFile(kind, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!String(file.type || "").startsWith("image/")) {
      setBloggerRewardStatus("Можно загрузить только изображение.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setBloggerRewardStatus("Скриншот должен быть не больше 12 МБ.");
      return;
    }

    const preview = URL.createObjectURL(file);
    if (kind === "review") {
      setBloggerRewardReviewFile(file);
      setBloggerRewardReviewPreview(preview);
    } else {
      setBloggerRewardProfileFile(file);
      setBloggerRewardProfilePreview(preview);
    }
    setBloggerRewardStatus("");
  }

  function resetBloggerRewardForm() {
    setBloggerRewardForm(EMPTY_BLOGGER_REWARD_FORM);
    setBloggerRewardReviewFile(null);
    setBloggerRewardProfileFile(null);
    setBloggerRewardReviewPreview("");
    setBloggerRewardProfilePreview("");
    setBloggerRewardInputKey((current) => current + 1);
  }

  async function createBloggerReward(event) {
    event.preventDefault();

    if (!bloggerRewardForm.instagramUrl.trim()) {
      setBloggerRewardStatus("Укажите ссылку на Instagram.");
      return;
    }

    if (!bloggerRewardReviewFile || !bloggerRewardProfileFile) {
      setBloggerRewardStatus("Добавьте скриншот отзыва и скриншот Instagram-аккаунта.");
      return;
    }

    if (!password || bloggerRewardLoading) return;

    if (demoMode) {
      setBloggerRewardStatus("В демо-режиме карточка не сохраняется на сервере.");
      return;
    }

    setBloggerRewardLoading("create");
    setBloggerRewardStatus("Сохраняем карточку...");

    try {
      const formData = new FormData();
      formData.append("instagramUrl", bloggerRewardForm.instagramUrl.trim());
      formData.append("reviewScreenshot", bloggerRewardReviewFile);
      formData.append("profileScreenshot", bloggerRewardProfileFile);

      const response = await fetch(apiPath("adminBloggerReviewRewards"), {
        method: "POST",
        headers: adminHeaders(password, adminLogin),
        body: formData
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось добавить блогера");
      }

      setBloggerRewards((current) => [data.reward, ...current]);
      setBloggerRewardView("pending");
      resetBloggerRewardForm();
      setBloggerRewardStatus(`@${data.reward.instagramKey} добавлен в список ожидающих.`);
    } catch (rewardError) {
      setBloggerRewardStatus(rewardError.message || "Не удалось добавить блогера");
    } finally {
      setBloggerRewardLoading("");
    }
  }

  async function changeBloggerRewardStatus(reward, status) {
    if (!reward?.id || bloggerRewardLoading) return;

    if (
      status === "redeemed" &&
      !window.confirm(`Подтвердить, что десерт для @${reward.instagramKey} выдан?`)
    ) {
      return;
    }

    if (demoMode) {
      const now = new Date().toISOString();
      setBloggerRewards((current) =>
        current.map((item) =>
          item.id === reward.id
            ? {
                ...item,
                status,
                redeemedAt: status === "redeemed" ? now : null,
                redeemedBy: status === "redeemed" ? getAccountLabel(account) : ""
              }
            : item
        )
      );
      return;
    }

    setBloggerRewardLoading(reward.id);
    setBloggerRewardStatus(status === "redeemed" ? "Отмечаем выдачу..." : "Возвращаем в ожидающие...");

    try {
      const response = await fetch(
        `${apiPath("adminBloggerReviewRewards")}/${encodeURIComponent(reward.id)}`,
        {
          method: "PATCH",
          headers: adminHeaders(password, adminLogin, {
            "content-type": "application/json"
          }),
          body: JSON.stringify({ status })
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось изменить статус выдачи");
      }

      setBloggerRewards((current) =>
        current.map((item) => (item.id === reward.id ? data.reward : item))
      );
      setBloggerRewardStatus(
        status === "redeemed"
          ? `Десерт для @${data.reward.instagramKey} отмечен как выданный.`
          : `@${data.reward.instagramKey} возвращён в список ожидающих.`
      );
    } catch (rewardError) {
      setBloggerRewardStatus(rewardError.message || "Не удалось изменить статус выдачи");
    } finally {
      setBloggerRewardLoading("");
    }
  }

  function updateGalleryForm(key, value) {
    setGalleryForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "type") {
        next.orientation = value === "video" ? "video" : "landscape";
      }
      return next;
    });
    setGalleryStatus("");
  }

  function handleGalleryFileChange(event) {
    const file = event.target.files?.[0] || null;
    if (galleryPreview) {
      URL.revokeObjectURL(galleryPreview);
    }
    setGalleryFile(file);
    setGalleryPreview(file ? URL.createObjectURL(file) : "");
    setGalleryStatus(file ? `Файл выбран: ${file.name}` : "");
  }

  async function createGalleryMaterial(event) {
    event.preventDefault();

    if (!canManageBusiness) {
      setGalleryStatus("Галерея доступна только руководителю.");
      return;
    }

    if (galleryForm.type === "photo" && !galleryFile) {
      setGalleryStatus("Для фото загрузите изображение.");
      return;
    }

    if (galleryForm.type === "video" && !galleryForm.videoUrl.trim()) {
      setGalleryStatus("Для видео укажите ссылку Kinescope.");
      return;
    }

    if (!password || galleryLoading) return;

    if (demoMode) {
      setGalleryStatus("В демо-режиме галерея не сохраняется на сервере.");
      return;
    }

    setGalleryLoading(true);
    setGalleryStatus("Добавляем материал в галерею...");

    try {
      const formData = new FormData();
      Object.entries(galleryForm).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });
      if (galleryFile) {
        formData.append("media", galleryFile);
      }

      const response = await fetch(apiPath("adminGallery"), {
        method: "POST",
        headers: adminHeaders(password, adminLogin),
        body: formData
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось добавить материал");
      }

      setGalleryItems((current) => [data.item, ...current]);
      setGalleryForm(EMPTY_GALLERY_FORM);
      setGalleryFile(null);
      setGalleryPreview("");
      setGalleryInputKey((current) => current + 1);
      setGalleryStatus("Материал опубликован в галерее сайта.");
    } catch (galleryError) {
      setGalleryStatus(galleryError.message || "Не удалось добавить материал");
    } finally {
      setGalleryLoading(false);
    }
  }

  function updateGalleryDraft(itemId, key, value) {
    setGalleryDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || {}),
        [key]: key === "sortOrder" ? Number(value) : value
      }
    }));
    setGalleryStatus("");
  }

  async function saveGalleryDraft(itemId) {
    const draft = galleryDrafts[itemId];
    if (!draft || galleryLoading) return;

    if (demoMode) {
      setGalleryItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, ...draft, updatedAt: new Date().toISOString() } : item))
      );
      setGalleryStatus("Материал обновлен в демо-режиме.");
      return;
    }

    setGalleryLoading(true);
    setGalleryStatus("Сохраняем материал...");

    try {
      const response = await fetch(`${apiPath("adminGallery")}/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(draft)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить материал");
      }

      setGalleryItems((current) => current.map((item) => (item.id === itemId ? data.item : item)));
      setGalleryStatus("Материал обновлен.");
    } catch (galleryError) {
      setGalleryStatus(galleryError.message || "Не удалось сохранить материал");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function moveGalleryItem(itemId, direction) {
    if (!itemId || galleryLoading) return;

    const currentIndex = activeGalleryItems.findIndex((item) => item.id === itemId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= activeGalleryItems.length) return;

    const reorderedItems = [...activeGalleryItems];
    const [movedItem] = reorderedItems.splice(currentIndex, 1);
    reorderedItems.splice(nextIndex, 0, movedItem);

    const orderedDrafts = reorderedItems.map((item, index) => ({
      id: item.id,
      draft: {
        ...(galleryDrafts[item.id] || makeGalleryDraft(item)),
        sortOrder: (index + 1) * 10
      }
    }));

    if (demoMode) {
      setGalleryItems((current) =>
        current.map((item) => {
          const nextDraft = orderedDrafts.find((entry) => entry.id === item.id);
          return nextDraft ? { ...item, sortOrder: nextDraft.draft.sortOrder } : item;
        })
      );
      setGalleryStatus("Порядок галереи обновлен в демо-режиме.");
      return;
    }

    setGalleryLoading(true);
    setGalleryStatus("Обновляем порядок галереи...");

    try {
      const updatedItems = [];
      for (const entry of orderedDrafts) {
        const response = await fetch(`${apiPath("adminGallery")}/${encodeURIComponent(entry.id)}`, {
          method: "PATCH",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(entry.draft)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Не удалось обновить порядок галереи");
        }

        updatedItems.push(data.item);
      }

      const updatedMap = new Map(updatedItems.map((item) => [item.id, item]));
      setGalleryItems((current) => current.map((item) => updatedMap.get(item.id) || item));
      setGalleryDrafts((current) => {
        const next = { ...current };
        orderedDrafts.forEach((entry) => {
          next[entry.id] = entry.draft;
        });
        return next;
      });
      setGalleryStatus("Порядок галереи обновлен.");
    } catch (galleryError) {
      setGalleryStatus(galleryError.message || "Не удалось обновить порядок галереи");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function replaceGalleryMedia(itemId, file) {
    if (!itemId || !file || galleryLoading) return;

    if (demoMode) {
      setGalleryStatus("В демо-режиме файл не загружается на сервер.");
      return;
    }

    setGalleryLoading(true);
    setGalleryStatus("Заменяем файл...");

    try {
      const draft = galleryDrafts[itemId] || {};
      const formData = new FormData();
      Object.entries(draft).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });
      formData.append("media", file);

      const response = await fetch(`${apiPath("adminGallery")}/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin),
        body: formData
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось заменить файл");
      }

      setGalleryItems((current) => current.map((item) => (item.id === itemId ? data.item : item)));
      setGalleryStatus("Файл заменен.");
    } catch (galleryError) {
      setGalleryStatus(galleryError.message || "Не удалось заменить файл");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function archiveAdminGalleryItem(itemId) {
    if (!itemId || galleryLoading) return;

    const confirmed = window.confirm("Убрать этот материал с публичной галереи?");
    if (!confirmed) return;

    if (demoMode) {
      setGalleryItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? { ...item, status: "archived", archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : item
        )
      );
      setGalleryStatus("Материал убран с сайта в демо-режиме.");
      return;
    }

    setGalleryLoading(true);
    setGalleryStatus("Убираем материал с сайта...");

    try {
      const response = await fetch(`${apiPath("adminGallery")}/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: adminHeaders(password, adminLogin)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось убрать материал");
      }

      setGalleryItems((current) => current.map((item) => (item.id === itemId ? data.item : item)));
      setGalleryStatus("Материал убран с публичной галереи и остался в архиве.");
    } catch (galleryError) {
      setGalleryStatus(galleryError.message || "Не удалось убрать материал");
    } finally {
      setGalleryLoading(false);
    }
  }

  function updateCatalogCategoryForm(key, value) {
    setCatalogCategoryForm((current) => ({
      ...current,
      [key]: value
    }));
    setCatalogStatus("");
  }

  function resetCatalogCategoryForm() {
    setEditingCatalogCategoryId("");
    setCatalogCategoryForm(EMPTY_CATALOG_CATEGORY_FORM);
    setCatalogStatus("");
  }

  function startEditCatalogCategory(category) {
    setEditingCatalogCategoryId(category.id);
    setCatalogCategoryForm(makeCatalogCategoryForm(category));
    setCatalogStatus("");
  }

  function updateCatalogProductForm(key, value) {
    setCatalogProductForm((current) => ({
      ...current,
      [key]: value
    }));
    setCatalogStatus("");
  }

  function handleCatalogProductFileChange(event) {
    const file = event.target.files?.[0] || null;
    if (catalogProductPreview) {
      URL.revokeObjectURL(catalogProductPreview);
    }
    setCatalogProductFile(file);
    setCatalogProductPreview(file ? URL.createObjectURL(file) : "");
    setCatalogStatus(file ? `Фото выбрано: ${file.name}` : "");
  }

  function resetCatalogProductForm() {
    if (catalogProductPreview) {
      URL.revokeObjectURL(catalogProductPreview);
    }
    setEditingCatalogProductId("");
    setCatalogProductForm(EMPTY_CATALOG_PRODUCT_FORM);
    setCatalogProductFile(null);
    setCatalogProductPreview("");
    setCatalogProductInputKey((current) => current + 1);
    setCatalogStatus("");
    setCatalogEditorOpen(false);
  }

  function openCatalogCreate() {
    resetCatalogProductForm();
    setCatalogEditorOpen(true);
  }

  function startEditCatalogProduct(product) {
    if (catalogProductPreview) {
      URL.revokeObjectURL(catalogProductPreview);
    }
    setEditingCatalogProductId(product.id);
    setCatalogProductForm(makeCatalogProductForm(product));
    setCatalogProductFile(null);
    setCatalogProductPreview("");
    setCatalogProductInputKey((current) => current + 1);
    setCatalogStatus("");
    setCatalogEditorOpen(true);
  }

  function buildCatalogProductPayload() {
    const ingredients = splitCatalogTextList(catalogProductForm.ingredients);
    const badges = splitCatalogTextList(catalogProductForm.badges);
    const fallbackId =
      editingCatalogProductId ||
      catalogProductForm.id.trim() ||
      catalogProductForm.name.trim().toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "");

    return {
      id: fallbackId,
      categoryId: catalogProductForm.categoryId,
      name: catalogProductForm.name.trim(),
      description: catalogProductForm.description.trim(),
      weight: catalogProductForm.weight.trim(),
      price: Number(catalogProductForm.price),
      oldPrice: Number(catalogProductForm.oldPrice || 0),
      badges,
      ingredients,
      nutrition: {
        calories: catalogProductForm.calories,
        protein: catalogProductForm.protein,
        fat: catalogProductForm.fat,
        carbs: catalogProductForm.carbs
      },
      comboItemIds: editingCatalogProduct
        ? splitCatalogTextList(catalogProductForm.comboItemIds)
        : [],
      imageUrl: catalogProductForm.imageUrl || editingCatalogProduct?.image || "",
      customizable: editingCatalogProduct
        ? Boolean(catalogProductForm.customizable)
        : ingredients.length > 0,
      featured: editingCatalogProduct ? Boolean(catalogProductForm.featured) : false,
      sortOrder: Number(catalogProductForm.sortOrder || editingCatalogProduct?.sortOrder || nextCatalogProductSortOrder),
      status: catalogProductForm.status || "active"
    };
  }

  async function saveCatalogCategory(event) {
    event.preventDefault();

    if (!catalogCategoryForm.title.trim()) {
      setCatalogStatus("Введите название категории.");
      return;
    }

    if (!password || catalogLoading) return;

    if (demoMode) {
      const demoCategory = {
        ...makeCatalogCategoryForm(catalogCategoryForm),
        id:
          editingCatalogCategoryId ||
          catalogCategoryForm.id.trim() ||
          catalogCategoryForm.title.trim().toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, ""),
        label: catalogCategoryForm.shortTitle || catalogCategoryForm.title,
        image: catalogCategoryForm.image,
        sortOrder: Number(catalogCategoryForm.sortOrder || 0),
        updatedAt: new Date().toISOString()
      };
      setCatalog((current) => ({
        categories: [demoCategory, ...(current.categories || []).filter((category) => category.id !== demoCategory.id)],
        products: current.products || []
      }));
      if (!catalogProductForm.categoryId) {
        setCatalogProductForm((current) => ({ ...current, categoryId: demoCategory.id }));
      }
      resetCatalogCategoryForm();
      setCatalogStatus("Категория сохранена в демо-режиме.");
      return;
    }

    setCatalogLoading(true);
    setCatalogStatus(editingCatalogCategoryId ? "Сохраняем категорию..." : "Создаем категорию...");

    try {
      const response = await fetch(
        editingCatalogCategoryId
          ? `${apiPath("adminCatalogCategories")}/${encodeURIComponent(editingCatalogCategoryId)}`
          : apiPath("adminCatalogCategories"),
        {
          method: editingCatalogCategoryId ? "PATCH" : "POST",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(catalogCategoryForm)
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить категорию");
      }

      setCatalog((current) => ({
        categories: [data.category, ...(current.categories || []).filter((category) => category.id !== data.category.id)],
        products: current.products || []
      }));
      if (!catalogProductForm.categoryId) {
        setCatalogProductForm((current) => ({ ...current, categoryId: data.category.id }));
      }
      resetCatalogCategoryForm();
      setCatalogStatus("Категория сохранена.");
    } catch (categoryError) {
      setCatalogStatus(categoryError.message || "Не удалось сохранить категорию");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function saveCatalogProduct(event) {
    event.preventDefault();

    if (!catalogProductForm.categoryId) {
      setCatalogStatus("Выберите категорию товара.");
      return;
    }
    if (!catalogProductForm.name.trim()) {
      setCatalogStatus("Введите название товара.");
      return;
    }
    if (!Number(catalogProductForm.price)) {
      setCatalogStatus("Укажите цену товара.");
      return;
    }

    if (!password || catalogLoading) return;

    const catalogProductPayload = buildCatalogProductPayload();

    if (demoMode) {
      const demoProduct = {
        ...catalogProductPayload,
        category: catalogProductPayload.categoryId,
        image: catalogProductPreview || catalogProductPayload.imageUrl || ADMIN_PRODUCT_FALLBACK_IMAGE,
        updatedAt: new Date().toISOString()
      };
      setCatalog((current) => ({
        categories: current.categories || [],
        products: [demoProduct, ...(current.products || []).filter((product) => product.id !== demoProduct.id)]
      }));
      resetCatalogProductForm();
      setCatalogStatus("Товар сохранен в демо-режиме.");
      return;
    }

    setCatalogLoading(true);
    setCatalogStatus(editingCatalogProductId ? "Сохраняем товар..." : "Создаем товар...");

    try {
      const formData = new FormData();
      Object.entries(catalogProductPayload).forEach(([key, value]) => {
        if (value && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value ?? "");
        }
      });
      if (catalogProductFile) {
        formData.append("media", catalogProductFile);
      }

      const response = await fetch(
        editingCatalogProductId
          ? `${apiPath("adminCatalogProducts")}/${encodeURIComponent(editingCatalogProductId)}`
          : apiPath("adminCatalogProducts"),
        {
          method: editingCatalogProductId ? "PATCH" : "POST",
          headers: adminHeaders(password, adminLogin),
          body: formData
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить товар");
      }

      setCatalog((current) => ({
        categories: current.categories || [],
        products: [data.product, ...(current.products || []).filter((product) => product.id !== data.product.id)]
      }));
      resetCatalogProductForm();
      setCatalogStatus("Товар сохранен и появится в меню сайта.");
    } catch (productError) {
      setCatalogStatus(productError.message || "Не удалось сохранить товар");
    } finally {
      setCatalogLoading(false);
    }
  }

  function closeCatalogVideoDialog() {
    if (catalogVideoPreview) {
      URL.revokeObjectURL(catalogVideoPreview);
    }
    setCatalogVideoProduct(null);
    setCatalogVideoFile(null);
    setCatalogVideoPreview("");
    setCatalogVideoInputKey((current) => current + 1);
  }

  function openCatalogVideoDialog(product) {
    closeCatalogVideoDialog();
    setCatalogVideoProduct(product);
    setCatalogStatus("");
  }

  function handleCatalogVideoFileChange(event) {
    const file = event.target.files?.[0] || null;
    if (catalogVideoPreview) {
      URL.revokeObjectURL(catalogVideoPreview);
    }
    setCatalogVideoFile(file);
    setCatalogVideoPreview(file ? URL.createObjectURL(file) : "");
    setCatalogStatus(file ? `Видео выбрано: ${file.name}` : "");
  }

  async function saveCatalogVideo(event) {
    event.preventDefault();
    if (!catalogVideoProduct?.id || catalogLoading) return;
    if (!catalogVideoFile) {
      setCatalogStatus("Выберите видео блюда.");
      return;
    }

    if (demoMode) {
      const demoProduct = {
        ...catalogVideoProduct,
        video: {
          url: catalogVideoPreview,
          originalName: catalogVideoFile.name,
          mimeType: catalogVideoFile.type || "video/mp4",
          sizeBytes: catalogVideoFile.size
        },
        videoUrl: catalogVideoPreview
      };
      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) =>
          product.id === demoProduct.id ? demoProduct : product
        )
      }));
      closeCatalogVideoDialog();
      setCatalogStatus("Видео прикреплено в демо-режиме.");
      return;
    }

    setCatalogLoading(true);
    setCatalogStatus("Загружаем и готовим видео блюда...");

    try {
      const formData = new FormData();
      formData.append("video", catalogVideoFile);
      const response = await fetch(
        `${apiPath("adminCatalogProducts")}/${encodeURIComponent(catalogVideoProduct.id)}/video`,
        {
          method: "POST",
          headers: adminHeaders(password, adminLogin),
          body: formData
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось прикрепить видео");
      }

      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) =>
          product.id === data.product.id ? data.product : product
        )
      }));
      closeCatalogVideoDialog();
      setCatalogStatus(data.warning || "Видео прикреплено к товару.");
    } catch (videoError) {
      setCatalogStatus(videoError.message || "Не удалось прикрепить видео");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function removeCatalogVideo() {
    if (!catalogVideoProduct?.id || catalogLoading) return;
    const confirmed = window.confirm("Удалить видео из карточки товара?");
    if (!confirmed) return;

    if (demoMode) {
      const demoProduct = {
        ...catalogVideoProduct,
        video: null,
        videoUrl: ""
      };
      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) =>
          product.id === demoProduct.id ? demoProduct : product
        )
      }));
      closeCatalogVideoDialog();
      setCatalogStatus("Видео удалено в демо-режиме.");
      return;
    }

    setCatalogLoading(true);
    setCatalogStatus("Удаляем видео товара...");

    try {
      const response = await fetch(
        `${apiPath("adminCatalogProducts")}/${encodeURIComponent(catalogVideoProduct.id)}/video`,
        {
          method: "DELETE",
          headers: adminHeaders(password, adminLogin)
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось удалить видео");
      }

      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) =>
          product.id === data.product.id ? data.product : product
        )
      }));
      closeCatalogVideoDialog();
      setCatalogStatus("Видео удалено из карточки.");
    } catch (videoError) {
      setCatalogStatus(videoError.message || "Не удалось удалить видео");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function archiveAdminCatalogProduct(productId) {
    if (!productId || catalogLoading) return;

    const confirmed = window.confirm("Убрать товар из публичного меню? Он останется в архиве каталога.");
    if (!confirmed) return;

    if (demoMode) {
      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) =>
          product.id === productId
            ? { ...product, status: "archived", archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : product
        )
      }));
      setCatalogStatus("Товар убран из меню в демо-режиме.");
      return;
    }

    setCatalogLoading(true);
    setCatalogStatus("Убираем товар из меню...");

    try {
      const response = await fetch(`${apiPath("adminCatalogProducts")}/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: adminHeaders(password, adminLogin)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось убрать товар");
      }

      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((product) => (product.id === productId ? data.product : product))
      }));
      setCatalogStatus("Товар убран из публичного меню и остался в архиве.");
    } catch (productError) {
      setCatalogStatus(productError.message || "Не удалось убрать товар");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function toggleCatalogProductVisibility(product) {
    if (!product?.id || catalogVisibilityLoadingId) return;

    const isHidden = product.status === "hidden";
    const nextStatus = isHidden ? "active" : "hidden";
    const nextProduct = {
      ...product,
      status: nextStatus,
      archivedAt: null,
      updatedAt: new Date().toISOString()
    };

    setCatalog((current) => ({
      categories: current.categories || [],
      products: (current.products || []).map((item) => (item.id === product.id ? nextProduct : item))
    }));

    if (demoMode) {
      setCatalogStatus(isHidden ? "Товар снова показан на сайте." : "Товар временно скрыт с сайта.");
      return;
    }

    setCatalogVisibilityLoadingId(product.id);
    setCatalogStatus(isHidden ? "Возвращаем товар на сайт..." : "Скрываем товар с сайта...");

    try {
      const response = await fetch(
        `${apiPath("adminCatalogProducts")}/${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ status: nextStatus })
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось изменить видимость товара");
      }

      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((item) => (item.id === product.id ? data.product : item))
      }));
      setCatalogStatus(isHidden ? "Товар снова показан на сайте." : "Товар временно скрыт с сайта.");
    } catch (visibilityError) {
      setCatalog((current) => ({
        categories: current.categories || [],
        products: (current.products || []).map((item) => (item.id === product.id ? product : item))
      }));
      setCatalogStatus(visibilityError.message || "Не удалось изменить видимость товара");
    } finally {
      setCatalogVisibilityLoadingId("");
    }
  }

  function updatePartnerForm(key, value) {
    setPartnerForm((current) => ({
      ...current,
      [key]: key === "discountPercent" || key === "commissionPercent" ? Number(value) : value
    }));
    setPartnerStatus("");
  }

  function applyPartnerDetails(nextDetails) {
    if (!nextDetails?.partner) return;
    const normalized = {
      partner: nextDetails.partner,
      commissions: Array.isArray(nextDetails.commissions) ? nextDetails.commissions : [],
      payouts: Array.isArray(nextDetails.payouts) ? nextDetails.payouts : []
    };
    setPartnerDetails(normalized);
    setPartners((current) =>
      current.map((partner) =>
        partner.id === normalized.partner.id
          ? { ...partner, ...normalized.partner, payouts: normalized.payouts }
          : partner
      )
    );
  }

  async function openPartnerManager(partner) {
    setPartnerDetails({
      partner,
      commissions: [],
      payouts: Array.isArray(partner.payouts) ? partner.payouts : []
    });
    setPartnerDetailsLoading(!demoMode);
    setPartnerManagerStatus("");
    setPartnerPasswordDraft("");
    setPartnerPasswordVisible(false);
    setPartnerAccessConfirmation("");
    setPartnerPayoutConfirmation(false);
    setPartnerPayoutDraft({
      amount: Number(partner.payableAmount || 0) > 0 ? String(partner.payableAmount) : "",
      note: ""
    });
    if (partnerCredential?.partnerId !== partner.id) {
      setPartnerCredential(null);
    }

    if (demoMode) return;

    try {
      const response = await fetch(`${apiPath("adminPartners")}/${encodeURIComponent(partner.id)}`, {
        headers: adminHeaders()
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось загрузить партнёра");
      }
      applyPartnerDetails(data);
      setPartnerPayoutDraft({
        amount: Number(data.partner?.payableAmount || 0) > 0 ? String(data.partner.payableAmount) : "",
        note: ""
      });
    } catch (partnerError) {
      setPartnerManagerStatus(partnerError.message || "Не удалось загрузить партнёра");
    } finally {
      setPartnerDetailsLoading(false);
    }
  }

  function closePartnerManager() {
    if (partnerActionLoading) return;
    setPartnerDetails(null);
    setPartnerManagerStatus("");
    setPartnerAccessConfirmation("");
    setPartnerPayoutConfirmation(false);
  }

  async function copyPartnerCredential() {
    if (!partnerCredential) return;
    const text = `Логин: ${partnerCredential.login}\nПароль: ${partnerCredential.password}\nКабинет: vmestevkusnee.ru/partners`;
    try {
      await navigator.clipboard.writeText(text);
      setPartnerManagerStatus("Логин и новый пароль скопированы.");
    } catch {
      setPartnerManagerStatus("Не удалось скопировать автоматически. Выделите данные вручную.");
    }
  }

  async function savePartnerPassword(event) {
    event.preventDefault();
    const partner = partnerDetails?.partner;
    const nextPassword = partnerPasswordDraft.trim();
    if (!partner || partnerActionLoading) return;
    if (nextPassword.length < 6) {
      setPartnerManagerStatus("Новый пароль должен быть не короче 6 символов.");
      return;
    }

    setPartnerActionLoading("password");
    setPartnerManagerStatus("Меняем пароль и закрываем старые сессии...");
    try {
      if (!demoMode) {
        const response = await fetch(
          `${apiPath("adminPartners")}/${encodeURIComponent(partner.id)}/access`,
          {
            method: "PATCH",
            headers: adminHeaders(password, adminLogin, {
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({ password: nextPassword })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Не удалось изменить пароль");
        }
        applyPartnerDetails(data);
      }

      setPartnerCredential({
        partnerId: partner.id,
        login: partner.login,
        password: nextPassword
      });
      setPartnerPasswordDraft("");
      setPartnerManagerStatus("Пароль изменён. Все прежние входы партнёра закрыты.");
    } catch (partnerError) {
      setPartnerManagerStatus(partnerError.message || "Не удалось изменить пароль");
    } finally {
      setPartnerActionLoading("");
    }
  }

  async function applyPartnerAccessStatus() {
    const partner = partnerDetails?.partner;
    if (!partner || !partnerAccessConfirmation || partnerActionLoading) return;
    const nextStatus = partnerAccessConfirmation === "archive" ? "archived" : "active";
    setPartnerActionLoading("access");
    setPartnerManagerStatus(
      nextStatus === "archived" ? "Закрываем доступ партнёру..." : "Восстанавливаем доступ..."
    );

    try {
      if (demoMode) {
        applyPartnerDetails({
          ...partnerDetails,
          partner: {
            ...partner,
            status: nextStatus,
            statusLabel: nextStatus === "archived" ? "В архиве" : "Доступ открыт"
          }
        });
      } else {
        const response = await fetch(
          `${apiPath("adminPartners")}/${encodeURIComponent(partner.id)}/access`,
          {
            method: "PATCH",
            headers: adminHeaders(password, adminLogin, {
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({ status: nextStatus })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Не удалось изменить доступ");
        }
        applyPartnerDetails(data);
      }
      setPartnerManagerStatus(
        nextStatus === "archived"
          ? "Партнёр в архиве. Вход и промокод отключены, старые сессии закрыты."
          : "Доступ и партнёрский промокод снова активны."
      );
      setPartnerAccessConfirmation("");
    } catch (partnerError) {
      setPartnerManagerStatus(partnerError.message || "Не удалось изменить доступ");
    } finally {
      setPartnerActionLoading("");
    }
  }

  function preparePartnerPayout(event) {
    event.preventDefault();
    const payableAmount = Number(partnerDetails?.partner?.payableAmount || 0);
    const amount = Number(partnerPayoutDraft.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPartnerManagerStatus("Укажите сумму выплаты больше нуля.");
      return;
    }
    if (amount > payableAmount + 0.001) {
      setPartnerManagerStatus(`Можно выплатить не больше ${formatPrice(payableAmount)} ₽.`);
      return;
    }
    setPartnerPayoutConfirmation(true);
    setPartnerManagerStatus("");
  }

  async function confirmPartnerPayout() {
    const partner = partnerDetails?.partner;
    const amount = Math.round(Number(partnerPayoutDraft.amount || 0) * 100) / 100;
    if (!partner || !partnerPayoutConfirmation || partnerActionLoading) return;

    setPartnerActionLoading("payout");
    setPartnerManagerStatus("Фиксируем выплату...");
    try {
      let nextDetails;
      if (demoMode) {
        const payout = {
          id: `demo-payout-${Date.now()}`,
          partnerId: partner.id,
          amount,
          note: partnerPayoutDraft.note.trim(),
          status: "confirmed",
          createdBy: "Руководитель · demo",
          paidAt: new Date().toISOString()
        };
        nextDetails = {
          ...partnerDetails,
          partner: {
            ...partner,
            paidAmount: Number(partner.paidAmount || 0) + amount,
            payableAmount: Math.max(0, Number(partner.payableAmount || 0) - amount)
          },
          payouts: [payout, ...(partnerDetails.payouts || [])]
        };
      } else {
        const response = await fetch(
          `${apiPath("adminPartners")}/${encodeURIComponent(partner.id)}/payouts`,
          {
            method: "POST",
            headers: adminHeaders(password, adminLogin, {
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({
              amount,
              note: partnerPayoutDraft.note
            })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Не удалось провести выплату");
        }
        nextDetails = data;
      }

      applyPartnerDetails(nextDetails);
      const nextPayable = Number(nextDetails.partner?.payableAmount || 0);
      setPartnerPayoutDraft({
        amount: nextPayable > 0 ? String(nextPayable) : "",
        note: ""
      });
      setPartnerPayoutConfirmation(false);
      setPartnerManagerStatus(`Выплата ${formatPrice(amount)} ₽ подтверждена и добавлена в историю.`);
    } catch (partnerError) {
      setPartnerManagerStatus(partnerError.message || "Не удалось провести выплату");
    } finally {
      setPartnerActionLoading("");
    }
  }

  async function createPartnerAccount(event) {
    event.preventDefault();
    if (!canManageBusiness) {
      setPartnerStatus("Партнёры доступны только руководителю.");
      return;
    }

    if ((!password && !demoMode) || partnerLoading) return;

    setPartnerLoading(true);
    setPartnerStatus("Создаём доступ блогеру...");

    try {
      if (demoMode) {
        const demoPartner = {
          id: `demo-partner-${Date.now()}`,
          name: partnerForm.name.trim(),
          login: partnerForm.login.trim().toLowerCase(),
          promoCode: partnerForm.promoCode.trim().toUpperCase(),
          discountPercent: Number(partnerForm.discountPercent || 0),
          commissionPercent: Number(partnerForm.commissionPercent || 0),
          ordersCount: 0,
          revenue: 0,
          commissionAmount: 0,
          payableAmount: 0,
          paidAmount: 0,
          status: "active",
          payouts: []
        };
        if (!demoPartner.name || !demoPartner.login || partnerForm.password.length < 6 || !demoPartner.promoCode) {
          throw new Error("Заполните имя, логин, пароль от 6 символов и промокод.");
        }
        setPartners((current) => [demoPartner, ...current]);
        setPartnerCredential({
          partnerId: demoPartner.id,
          login: demoPartner.login,
          password: partnerForm.password
        });
        setPartnerForm({
          name: "",
          login: "",
          password: isLocalhost() ? DEV_PASSWORD : "",
          promoCode: "",
          discountPercent: 10,
          commissionPercent: 7
        });
        setPartnerStatus("Партнёр создан. Передайте ему логин, пароль и адрес vmestevkusnee.ru/partners.");
        return;
      }

      const response = await fetch(apiPath("adminPartners"), {
        method: "POST",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(partnerForm)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось создать партнёра");
      }

      setPartners((current) => [data.partner, ...current]);
      setPartnerCredential({
        partnerId: data.partner.id,
        login: partnerForm.login.trim().toLowerCase(),
        password: partnerForm.password
      });
      setPartnerForm({
        name: "",
        login: "",
        password: isLocalhost() ? DEV_PASSWORD : "",
        promoCode: "",
        discountPercent: 10,
        commissionPercent: 7
      });
      setPartnerStatus("Партнёр создан. Передайте блогеру логин, пароль и адрес vmestevkusnee.ru/partners.");
    } catch (partnerError) {
      setPartnerStatus(partnerError.message || "Не удалось создать партнёра");
    } finally {
      setPartnerLoading(false);
    }
  }

  function updatePromoCodeForm(key, value) {
    setPromoCodeForm((current) => ({
      ...current,
      [key]: key === "code" ? value.toUpperCase() : value
    }));
    setPromoCodeStatus("");
  }

  function togglePromoRuleId(field, id) {
    setPromoCodeForm((current) => {
      const values = Array.isArray(current[field]) ? current[field] : [];
      return {
        ...current,
        [field]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id]
      };
    });
    setPromoCodeStatus("");
  }

  function resetPromoCodeForm() {
    setPromoCodeForm(EMPTY_PROMO_CODE_FORM);
    setEditingPromoCodeId("");
    setPromoProductSearch("");
    setPromoCodeStatus("");
  }

  function editPromoCode(promoCode) {
    setPromoCodeForm({
      code: promoCode.code || "",
      percent: promoCode.percent ?? 10,
      internalComment: promoCode.internalComment || "",
      validFrom: promoCode.validFrom || "",
      validUntil: promoCode.validUntil || "",
      dailyStart: promoCode.dailyStart || "",
      dailyEnd: promoCode.dailyEnd || "",
      weekdays: Array.isArray(promoCode.weekdays) ? promoCode.weekdays.map(Number) : [],
      scopeType: promoCode.scopeType || "all",
      categoryIds: Array.isArray(promoCode.categoryIds) ? promoCode.categoryIds : [],
      productIds: Array.isArray(promoCode.productIds) ? promoCode.productIds : [],
      usageLimit: promoCode.usageLimit ?? "",
      perCustomerLimit: promoCode.perCustomerLimit ?? "",
      minimumOrderAmount: promoCode.minimumOrderAmount ?? "",
      maximumDiscountAmount: promoCode.maximumDiscountAmount ?? "",
      status: promoCode.status || "active"
    });
    setEditingPromoCodeId(promoCode.id);
    setPromoProductSearch("");
    setPromoCodeStatus(`Редактируем ${promoCode.code}.`);
  }

  async function savePromoCode(event) {
    event.preventDefault();
    if (!canManageBusiness) {
      setPromoCodeStatus("Промокоды доступны только руководителю.");
      return;
    }
    if (!promoCodeForm.code.trim()) {
      setPromoCodeStatus("Укажите промокод.");
      return;
    }
    const promoPercent = Number(promoCodeForm.percent);
    if (!Number.isFinite(promoPercent) || promoPercent < 1 || promoPercent > 90) {
      setPromoCodeStatus("Скидка должна быть от 1 до 90%.");
      return;
    }
    if (
      promoCodeForm.validFrom &&
      promoCodeForm.validUntil &&
      promoCodeForm.validFrom > promoCodeForm.validUntil
    ) {
      setPromoCodeStatus("Дата окончания должна быть не раньше даты начала.");
      return;
    }
    if (Boolean(promoCodeForm.dailyStart) !== Boolean(promoCodeForm.dailyEnd)) {
      setPromoCodeStatus("Укажите и начало, и окончание ежедневного интервала.");
      return;
    }
    if (
      promoCodeForm.dailyStart &&
      promoCodeForm.dailyEnd &&
      promoCodeForm.dailyStart >= promoCodeForm.dailyEnd
    ) {
      setPromoCodeStatus("Окончание интервала должно быть позже начала.");
      return;
    }
    if (promoCodeForm.scopeType === "categories" && !promoCodeForm.categoryIds.length) {
      setPromoCodeStatus("Выберите хотя бы одну категорию.");
      return;
    }
    if (promoCodeForm.scopeType === "products" && !promoCodeForm.productIds.length) {
      setPromoCodeStatus("Выберите хотя бы одно блюдо.");
      return;
    }
    const optionalNumbers = [
      ["usageLimit", "Общий лимит использований"],
      ["perCustomerLimit", "Лимит на гостя"],
      ["minimumOrderAmount", "Минимальная сумма заказа"],
      ["maximumDiscountAmount", "Максимальная скидка"]
    ];
    const invalidOptionalNumber = optionalNumbers.find(([field]) => {
      const value = promoCodeForm[field];
      return value !== "" && value !== null && (!Number.isFinite(Number(value)) || Number(value) <= 0);
    });
    if (invalidOptionalNumber) {
      setPromoCodeStatus(`${invalidOptionalNumber[1]} должен быть больше нуля.`);
      return;
    }
    if (promoCodeLoading) return;

    setPromoCodeLoading(true);
    setPromoCodeStatus(editingPromoCodeId ? "Сохраняем изменения..." : "Создаём промокод...");

    if (demoMode) {
      const currentDemoPromo = promoCodes.find((item) => item.id === editingPromoCodeId);
      const demoPromo = {
        ...promoCodeForm,
        id: editingPromoCodeId || `demo-promo-${Date.now()}`,
        code: promoCodeForm.code.trim().toUpperCase(),
        percent: promoPercent,
        usageLimit: promoCodeForm.usageLimit === "" ? null : Number(promoCodeForm.usageLimit),
        perCustomerLimit:
          promoCodeForm.perCustomerLimit === "" ? null : Number(promoCodeForm.perCustomerLimit),
        minimumOrderAmount:
          promoCodeForm.minimumOrderAmount === "" ? null : Number(promoCodeForm.minimumOrderAmount),
        maximumDiscountAmount:
          promoCodeForm.maximumDiscountAmount === "" ? null : Number(promoCodeForm.maximumDiscountAmount),
        usageCount: Number(currentDemoPromo?.usageCount || 0),
        reservedCount: Number(currentDemoPromo?.reservedCount || 0),
        countedUses: Number(currentDemoPromo?.countedUses || 0),
        availability: {
          active: promoCodeForm.status === "active",
          state: promoCodeForm.status === "active" ? "active" : "disabled",
          label: promoCodeForm.status === "active" ? "Действует" : "Отключён"
        }
      };
      setPromoCodes((current) =>
        editingPromoCodeId
          ? current.map((item) => (item.id === editingPromoCodeId ? demoPromo : item))
          : [demoPromo, ...current]
      );
      setPromoCodeForm(EMPTY_PROMO_CODE_FORM);
      setEditingPromoCodeId("");
      setPromoProductSearch("");
      setPromoCodeStatus(editingPromoCodeId ? "Промокод обновлён в демо-режиме." : "Промокод создан в демо-режиме.");
      setPromoCodeLoading(false);
      return;
    }

    try {
      const response = await fetch(
        editingPromoCodeId
          ? `${apiPath("adminPromoCodes")}/${encodeURIComponent(editingPromoCodeId)}`
          : apiPath("adminPromoCodes"),
        {
          method: editingPromoCodeId ? "PATCH" : "POST",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(promoCodeForm)
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить промокод");
      }

      setPromoCodes((current) =>
        editingPromoCodeId
          ? current.map((item) => (item.id === editingPromoCodeId ? data.promoCode : item))
          : [data.promoCode, ...current]
      );
      setPromoCodeForm(EMPTY_PROMO_CODE_FORM);
      setEditingPromoCodeId("");
      setPromoProductSearch("");
      setPromoCodeStatus(editingPromoCodeId ? "Промокод обновлён." : "Промокод создан и доступен на сайте.");
    } catch (promoError) {
      setPromoCodeStatus(promoError.message || "Не удалось сохранить промокод");
    } finally {
      setPromoCodeLoading(false);
    }
  }

  async function togglePromoCode(promoCode) {
    if (!canManageBusiness || promoCodeLoading || !promoCode?.id) return;
    const nextStatus = promoCode.status === "active" ? "inactive" : "active";

    if (demoMode) {
      setPromoCodes((current) =>
        current.map((item) =>
          item.id === promoCode.id
            ? {
                ...item,
                status: nextStatus,
                availability: {
                  active: nextStatus === "active",
                  state: nextStatus === "active" ? "active" : "disabled",
                  label: nextStatus === "active" ? "Действует" : "Отключён"
                }
              }
            : item
        )
      );
      setPromoCodeStatus(nextStatus === "active" ? `${promoCode.code} включён.` : `${promoCode.code} отключён.`);
      return;
    }

    setPromoCodeLoading(true);
    setPromoCodeStatus(nextStatus === "active" ? "Включаем промокод..." : "Отключаем промокод...");

    try {
      const response = await fetch(
        `${apiPath("adminPromoCodes")}/${encodeURIComponent(promoCode.id)}`,
        {
          method: "PATCH",
          headers: adminHeaders(password, adminLogin, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ status: nextStatus })
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось изменить статус промокода");
      }
      setPromoCodes((current) =>
        current.map((item) => (item.id === promoCode.id ? data.promoCode : item))
      );
      setPromoCodeStatus(nextStatus === "active" ? `${promoCode.code} включён.` : `${promoCode.code} отключён.`);
    } catch (promoError) {
      setPromoCodeStatus(promoError.message || "Не удалось изменить статус промокода");
    } finally {
      setPromoCodeLoading(false);
    }
  }

  async function changeReviewFilter(status) {
    if (!canManageBusiness) return;

    setReviewStatusFilter(status);
    setReviewStatus("");

    if (demoMode || !password) {
      setReviews(listDemoReviews({ status }));
      return;
    }

    setReviewLoading(true);
    try {
      const nextReviews = await fetchReviews(password, status, adminLogin);
      setReviews(nextReviews);
    } catch (reviewError) {
      setReviewStatus(adminErrorMessage(reviewError));
    } finally {
      setReviewLoading(false);
    }
  }

  async function moderateAdminReview(reviewId, status) {
    if (!canManageBusiness) {
      setReviewStatus("Модерация отзывов доступна только руководителю.");
      return;
    }

    if (!reviewId || reviewLoading) return;

    if (demoMode) {
      updateDemoReviewStatus(reviewId, status);
      setReviews(listDemoReviews({ status: reviewStatusFilter }));
      setReviewStatus(status === "approved" ? "Отзыв одобрен." : "Отзыв отклонён.");
      return;
    }

    setReviewLoading(true);
    setReviewStatus("");

    try {
      const response = await fetch(`${apiPath("adminReviews")}/${encodeURIComponent(reviewId)}`, {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ status })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось обновить отзыв");
      }

      setReviews((current) => {
        if (reviewStatusFilter !== "all" && data.review?.status !== reviewStatusFilter) {
          return current.filter((review) => review.id !== reviewId);
        }

        return current.map((review) => (review.id === reviewId ? data.review : review));
      });
      setReviewStatus(status === "approved" ? "Отзыв одобрен." : "Отзыв отклонён.");
    } catch (reviewError) {
      setReviewStatus(reviewError.message || "Не удалось обновить отзыв");
    } finally {
      setReviewLoading(false);
    }
  }

  async function closeOrderCard(orderId) {
    if (demoMode) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, archivedAt: new Date().toISOString() } : order
        )
      );
      return;
    }

    setError("");
    const previousOrders = orders;
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, archivedAt: new Date().toISOString() } : order
      )
    );

    try {
      const response = await fetch(apiPath("adminOrders"), {
        method: "PATCH",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          action: "close",
          id: orderId
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось закрыть заказ");
      }

      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
      refreshDashboard();
    } catch (closeError) {
      setOrders(previousOrders);
      setError(closeError.message || "Не удалось закрыть заказ");
    }
  }

  async function setupAdminPush(options = {}) {
    if (!password || pushLoading) return;
    const silent = options?.silent === true;

    setPushLoading(true);
    if (!silent) setPushStatus("Запрашиваем разрешение на уведомления...");

    try {
      const push = await subscribeForAdminPush();
      if (!push.ok) {
        setPushStatus(push.message);
        return;
      }

      if (!silent) setPushStatus("Сохраняем push-подписку администратора...");

      const response = await fetch(apiPath("adminPush"), {
        method: "POST",
        headers: adminHeaders(password, adminLogin, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          action: silent ? "register" : "test",
          label: `${getAccountLabel(account)} · ${adminLogin || "аккаунт"}`,
          subscription: push.subscription
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось сохранить push-подписку");
      }

      if (silent) {
        setPushStatus("Push включён на этом устройстве.");
      } else {
        setPushStatus(
          data.push?.ok
            ? "Push администратора включён. Тестовое уведомление отправлено."
            : `Подписка сохранена, но тест не отправился: ${data.push?.reason || "проверьте VAPID-ключи"}`
        );
      }
    } catch (pushError) {
      setPushStatus(pushError.message || "Не удалось включить push администратора");
    } finally {
      setPushLoading(false);
    }
  }

  if (!password) {
    return (
      <main className="admin-shell admin-shell-login">
        <a className="admin-login-back" href="/">
          На сайт
        </a>
        <section className="admin-login">
          <div className="admin-login-card">
            <p className="eyebrow">/admin</p>
            <h2>Войти в панель</h2>
            <form className="admin-login-form" onSubmit={login}>
              <label className="field">
                <span>Логин</span>
                <input
                  type="text"
                  value={draftLogin}
                  onChange={(event) => setDraftLogin(event.target.value)}
                  placeholder="рук или админ"
                  autoComplete="username webauthn"
                />
              </label>
              <label className="field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={draftPassword}
                  onChange={(event) => setDraftPassword(event.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
              </label>
              <button className="primary-action" type="submit" disabled={loading || checkingSession}>
                <ShieldCheck size={18} />
                {loading || checkingSession ? "Проверяем..." : "Войти в панель"}
              </button>
              {passkeySupported ? (
                <button
                  className="admin-passkey-action"
                  type="button"
                  onClick={loginWithPasskey}
                  disabled={passkeyLoading || loading || checkingSession}
                >
                  <KeyRound size={18} />
                  {passkeyLoading ? "Подтвердите на устройстве..." : "Войти по Face ID или отпечатку"}
                </button>
              ) : null}
            </form>
            {passkeyStatus ? <div className="admin-login-note">{passkeyStatus}</div> : null}
            {error ? <div className="admin-alert">{error}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`admin-shell admin-shell-workspace ${adminView === "orders" ? "admin-shell-orders" : ""}`}>
      <div className="admin-sticky-header">
        <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/assets/site/vv-logo-full.svg" alt="Вместе Вкуснее" />
          <div>
            <b>Пульт заказов</b>
            <span>{getAccountLabel(account)} · {adminLogin || "аккаунт"}</span>
          </div>
        </div>
        <div className="admin-toolbar">
          <button
            type="button"
            onClick={setupAdminPush}
            disabled={pushLoading}
            aria-label="Включить push администратора"
            title="Включить push администратора"
          >
            <BellRing size={18} />
            <span>Push</span>
          </button>
          {passkeySupported ? (
            <button
              type="button"
              onClick={setupAdminPasskey}
              disabled={passkeyLoading}
              aria-label="Подключить вход по Face ID или отпечатку"
              title="Подключить быстрый вход"
            >
              <KeyRound size={18} />
              <span>{passkeyLoading ? "Подключаем" : "Биометрия"}</span>
            </button>
          ) : null}
          <button type="button" onClick={() => loadOrders()} disabled={loading} aria-label="Обновить">
            <RefreshCw size={18} />
            <span>{loading ? "Обновляем" : "Обновить"}</span>
          </button>
          <button type="button" onClick={logoutAdmin} aria-label="Выйти из админки">
            <UserRound size={18} />
            <span>Выйти</span>
          </button>
        </div>
        </header>

        <nav
          className={`admin-tabs ${canManageBusiness ? "admin-tabs-manager" : "admin-tabs-staff"}`}
          aria-label="Разделы панели"
        >
          {adminTabs.map(([view, label, Icon, accessibleLabel = label]) => (
            <button
              className={adminView === view ? "active" : ""}
              type="button"
              key={view}
              onClick={() => setAdminView(view)}
              aria-label={accessibleLabel}
              aria-current={adminView === view ? "page" : undefined}
              title={accessibleLabel === label ? undefined : accessibleLabel}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {demoMode ? (
        <div className="admin-demo-banner">
          Локальный демо-режим. На сервере здесь будут реальные заказы из базы.
        </div>
      ) : null}
      {error ? <div className="admin-alert">{error}</div> : null}
      {pushStatus ? (
        <div className={`admin-push-status ${pushStatus.includes("включён") ? "ok" : ""}`}>{pushStatus}</div>
      ) : null}
      {passkeyStatus ? (
        <div className={`admin-push-status ${passkeyStatus.includes("подключён") || passkeyStatus.includes("подтверждён") ? "ok" : ""}`}>
          {passkeyStatus}
        </div>
      ) : null}

      {canManageBusiness && adminView === "dashboard" ? (
        <section className="admin-manager-dashboard">
          <header className="admin-dashboard-heading">
            <div>
              <p className="eyebrow">Руководитель · {todayLabel}</p>
              <h1>Сводка руководителя</h1>
            </div>
            <div className="admin-chart-periods" role="tablist" aria-label="Период сводки">
              {DASHBOARD_PERIODS.map((period) => (
                <button
                  className={dashboardPeriod === period.id ? "active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={dashboardPeriod === period.id}
                  key={period.id}
                  onClick={() => setDashboardPeriod(period.id)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </header>

          <div
            className={`admin-dashboard-attention ${
              dashboardData.active.newOrders ? "is-urgent" : "is-calm"
            }`}
          >
            <span className="admin-dashboard-attention-icon">
              {dashboardData.active.newOrders ? <BellRing size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <div>
              <b>
                {dashboardData.active.newOrders
                  ? `${dashboardData.active.newOrders} ждут принятия`
                  : "Новых заказов без реакции нет"}
              </b>
              <span>
                В работе {dashboardData.active.orders} · готовится{" "}
                {dashboardData.active.byStatus?.cooking || 0} · у курьера{" "}
                {dashboardData.active.byStatus?.courier || 0}
              </span>
            </div>
            <button type="button" onClick={() => setAdminView("orders")}>
              <ListChecks size={16} />
              Открыть заказы
            </button>
          </div>

          <div className="admin-dashboard-kpis" aria-label={`Показатели за период ${dashboardPeriodTitle}`}>
            <article>
              <CircleDollarSign size={18} />
              <span>Выручка</span>
              <b>{formatPrice(dashboardPeriodSummary.revenue)} ₽</b>
              <small>{dashboardPeriodTitle.toLowerCase()}</small>
            </article>
            <article>
              <ReceiptText size={18} />
              <span>Заказы</span>
              <b>{dashboardPeriodSummary.orders}</b>
              <small>без отмен и ошибок оплаты</small>
            </article>
            <article>
              <BarChart3 size={18} />
              <span>Средний чек</span>
              <b>{formatPrice(dashboardPeriodSummary.averageTicket)} ₽</b>
              <small>на один заказ</small>
            </article>
            <article className={dashboardPeriodSummary.cancelledOrders ? "has-warning" : ""}>
              <Ban size={18} />
              <span>Отмены</span>
              <b>{dashboardPeriodSummary.cancelledOrders}</b>
              <small>{dashboardPeriodSummary.cancelRate}% от всех оформленных</small>
            </article>
          </div>

          <div className="admin-dashboard-primary-grid">
            <article className="admin-dashboard-panel admin-dashboard-trend">
              <div className="admin-dashboard-panel-head">
                <div>
                  <p className="eyebrow">Динамика</p>
                  <h2>Выручка и заказы</h2>
                </div>
                <div className="admin-chart-legend" aria-label="Легенда графика">
                  <span className="is-revenue"><i />Выручка</span>
                  <span className="is-orders"><i />Заказы</span>
                </div>
              </div>
              <ManagerTrendChart points={dashboardChartPoints} periodTitle={dashboardPeriodTitle} />
            </article>

            <article className="admin-dashboard-panel admin-dashboard-structure">
              <div className="admin-dashboard-panel-head">
                <div>
                  <p className="eyebrow">Заказы</p>
                  <h2>Способ получения</h2>
                </div>
              </div>

              <section>
                <div className="admin-breakdown-title">
                  <Bike size={16} />
                  <b>Получение</b>
                </div>
                <div className="admin-breakdown-list">
                  {dashboardPeriodSummary.fulfillment.map((item) => {
                    const share = dashboardPeriodSummary.orders
                      ? Math.round((Number(item.orders || 0) / dashboardPeriodSummary.orders) * 100)
                      : 0;
                    return (
                      <div className="admin-breakdown-row" key={item.id}>
                        <span>{item.label}</span>
                        <b>{item.orders} · {share}%</b>
                        <i><span style={{ width: `${share}%` }} /></i>
                      </div>
                    );
                  })}
                </div>
              </section>
            </article>
          </div>

          <article className="admin-dashboard-panel admin-dashboard-partner-ranking">
            <div className="admin-dashboard-panel-head">
              <div>
                <p className="eyebrow">Партнёры</p>
                <h2>Рейтинг по продажам</h2>
              </div>
              <span>{dashboardPeriodTitle}</span>
            </div>

            {dashboardPeriodSummary.partnerRanking.length ? (
              <div className="admin-partner-ranking-table">
                <div className="admin-partner-ranking-row is-head" aria-hidden="true">
                  <span>#</span>
                  <span>Партнёр</span>
                  <span>Заказы</span>
                  <span>Продажи</span>
                  <span>Начислено</span>
                  <span>Выплачено</span>
                  <span>К выплате</span>
                </div>
                {dashboardPeriodSummary.partnerRanking.map((partner, index) => (
                  <div className="admin-partner-ranking-row" key={partner.id || partner.promoCode || index}>
                    <span className="admin-partner-ranking-place">{index + 1}</span>
                    <div className="admin-partner-ranking-name">
                      <b>{partner.name}</b>
                      <span>{partner.promoCode}</span>
                    </div>
                    <div data-label="Заказы">
                      <strong>{partner.ordersCount}</strong>
                    </div>
                    <div data-label="Продажи">
                      <strong>{formatPrice(partner.revenue)} ₽</strong>
                    </div>
                    <div data-label="Начислено">
                      <strong>{formatPrice(partner.commissionAmount)} ₽</strong>
                    </div>
                    <div data-label="Выплачено">
                      <strong>{formatPrice(partner.paidAmount)} ₽</strong>
                    </div>
                    <div className="admin-partner-ranking-payable" data-label="К выплате">
                      <strong>{formatPrice(partner.payableAmount)} ₽</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty compact">
                <UsersRound size={28} />
                <h3>Заказов по партнёрским промокодам пока нет</h3>
                <p>Рейтинг появится после первого заказа за выбранный период.</p>
              </div>
            )}
          </article>

          <div className="admin-dashboard-secondary-grid">
            <article className="admin-dashboard-panel admin-dashboard-popular">
              <div className="admin-dashboard-panel-head">
                <div>
                  <p className="eyebrow">Продажи</p>
                  <h2>Популярные блюда</h2>
                </div>
                <span>{dashboardPeriodTitle}</span>
              </div>

              {dashboardPeriodSummary.topItems.length ? (
                <ol className="admin-popular-list">
                  {dashboardPeriodSummary.topItems.map((item, index) => {
                    const maxQuantity = Math.max(
                      1,
                      ...dashboardPeriodSummary.topItems.map((entry) => Number(entry.quantity || 0))
                    );
                    return (
                      <li key={`${item.name}-${index}`}>
                        <span className="admin-popular-rank">{index + 1}</span>
                        <div>
                          <b>{item.name}</b>
                          <i>
                            <span
                              style={{
                                width: `${Math.max(4, Math.round((Number(item.quantity || 0) / maxQuantity) * 100))}%`
                              }}
                            />
                          </i>
                        </div>
                        <span>{formatPrice(item.quantity)} шт.</span>
                        <strong>{formatPrice(item.revenue)} ₽</strong>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="admin-compact-empty">
                  <Utensils size={20} />
                  <span>Продаж блюд за этот период пока нет.</span>
                </div>
              )}
            </article>

            <article className="admin-dashboard-panel admin-dashboard-quality">
              <div className="admin-dashboard-panel-head">
                <div>
                  <p className="eyebrow">Качество смены</p>
                  <h2>Скорость обработки</h2>
                </div>
                <TimerReset size={19} />
              </div>

              <div className="admin-quality-metric">
                <span>Средняя реакция</span>
                <b>
                  {dashboardPeriodSummary.averageResponseSeconds
                    ? formatResponseSeconds(dashboardPeriodSummary.averageResponseSeconds)
                    : "Нет данных"}
                </b>
              </div>

              {dashboardData.response.slowest ? (
                <div className="admin-quality-detail">
                  <span>Самая долгая реакция</span>
                  <b>{formatResponseSeconds(dashboardData.response.slowest.seconds)}</b>
                  <small>
                    #{dashboardData.response.slowest.id} · {dashboardData.response.slowest.customerName} ·{" "}
                    {formatPrice(dashboardData.response.slowest.total)} ₽
                  </small>
                </div>
              ) : (
                <div className="admin-quality-detail">
                  <span>Самая долгая реакция</span>
                  <small>Появится после принятия первого заказа.</small>
                </div>
              )}

              <button type="button" onClick={() => setAdminView("orders")}>
                Проверить активные заказы
              </button>
            </article>
          </div>

          <section className="admin-dashboard-site-strip" aria-label="Состояние сайта">
            <div>
              <p className="eyebrow">Сайт</p>
              <b>Контент и настройки</b>
            </div>
            <button type="button" onClick={() => setAdminView("catalog")}>
              <PackageCheck size={17} />
              <span>Каталог</span>
              <b>{activeCatalogProducts.length} товаров</b>
            </button>
            <button type="button" onClick={() => setAdminView("gallery")}>
              <ImagePlus size={17} />
              <span>Галерея</span>
              <b>{activeGalleryItems.length} материалов</b>
            </button>
            <button type="button" onClick={() => setAdminView("partners")}>
              <Tags size={17} />
              <span>Партнёры</span>
              <b>{partners.length} аккаунтов</b>
            </button>
            <button type="button" onClick={() => setAdminView("settings")}>
              <Store size={17} />
              <span>Доставка</span>
              <b>{formatDuration(deliverySettings.currentMinutes)}</b>
            </button>
          </section>
        </section>
      ) : null}

      {adminView === "orders" ? (
      <section className="admin-hero">
        <div>
          <p className="eyebrow">{getAccountLabel(account)} · {todayLabel}</p>
          <h1>{activeOrders.length} активных</h1>
          <span>
            {canManageBusiness ? `В работе: ${formatPrice(revenue)} ₽ · ` : ""}
            доставка {deliveryCount} · самовывоз {pickupCount}
            {archivedCount ? ` · закрыто ${archivedCount}` : ""}
          </span>
        </div>
      </section>
      ) : null}

      {canManageBusiness && adminView === "settings" ? (
        <>
          <section className="admin-delivery-settings">
            <div>
              <p className="eyebrow">Загрузка кухни</p>
              <h2>Текущее время доставки</h2>
              <span>{getDeliveryLoadMessage(deliverySettings)}</span>
            </div>
            <label>
              <span>Интервал</span>
              <select
                value={deliverySettings.currentMinutes}
                onChange={(event) =>
                  setDeliverySettings((current) =>
                    normalizeDeliverySettings({ ...current, currentMinutes: event.target.value })
                  )
                }
              >
                {DELIVERY_TIME_OPTIONS.map((minutes) => (
                  <option value={minutes} key={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-delivery-status">
              <b>{getDeliveryLoadLabel(deliverySettings)}</b>
              <span>Клиент увидит ближайшие слоты с учетом этого времени.</span>
            </div>
            <button type="button" onClick={saveDeliveryTiming} disabled={deliverySettingsLoading}>
              {deliverySettingsLoading ? "Сохраняем..." : "Сохранить"}
            </button>
          </section>
          {deliverySettingsStatus ? <div className="admin-push-status">{deliverySettingsStatus}</div> : null}
        </>
      ) : null}

      {adminView === "catalog" ? (
      <section className="admin-catalog admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Товары меню</h2>
            <p>Поиск, цены, фотографии и публикация на сайте.</p>
          </div>
          <div className="admin-catalog-title-actions">
            <span>
              {activeCatalogProducts.length || "Нет"} товаров · {activeCatalogCategories.length || "нет"} категорий
            </span>
            <button type="button" onClick={openCatalogCreate}>
              <Plus size={17} />
              Добавить товар
            </button>
          </div>
        </div>

        {catalogStatus ? <div className="admin-push-status">{catalogStatus}</div> : null}

        <div className="admin-catalog-tools">
          <label className="field">
            <span>Поиск</span>
            <input
              type="search"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="Название, ID или описание"
            />
          </label>
          <label className="field">
            <span>Категория</span>
            <select value={catalogCategoryFilter} onChange={(event) => setCatalogCategoryFilter(event.target.value)}>
              <option value="all">Все категории</option>
              {catalogCategories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.shortTitle || category.title}
                </option>
              ))}
            </select>
          </label>
          <div>
            <b>{filteredCatalogProducts.length}</b>
            <span>в списке</span>
          </div>
          <div>
            <b>{archivedCatalogProducts.length}</b>
            <span>в архиве</span>
          </div>
        </div>

        <div className="admin-catalog-product-list">
          {filteredCatalogProducts.length ? (
            filteredCatalogProducts.map((product) => (
              <article
                className={`admin-catalog-product-card ${product.status === "hidden" ? "is-hidden" : ""}`}
                key={product.id}
              >
                <img src={getCatalogProductImage(product)} alt="" loading="lazy" />
                <div>
                  <span>{getCatalogCategoryLabel(catalogCategories, product.categoryId || product.category)}</span>
                  <b>{product.name}</b>
                  <p>{product.description || "Описание не заполнено"}</p>
                  <small>
                    {product.id} · {formatPrice(product.price)} ₽
                    {product.oldPrice ? ` · старая ${formatPrice(product.oldPrice)} ₽` : ""}
                    {product.videoUrl || product.video?.url ? " · видео есть" : ""}
                    {product.status === "hidden" ? " · скрыт на сайте" : ""}
                  </small>
                </div>
                <div className="admin-catalog-card-actions">
                  <button
                    type="button"
                    className={`visibility ${product.status === "hidden" ? "is-hidden" : ""}`}
                    onClick={() => toggleCatalogProductVisibility(product)}
                    disabled={catalogVisibilityLoadingId === product.id}
                    aria-label={product.status === "hidden" ? "Показать товар на сайте" : "Скрыть товар с сайта"}
                    title={product.status === "hidden" ? "Показать товар на сайте" : "Скрыть товар с сайта"}
                  >
                    {product.status === "hidden" ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {canManageBusiness ? (
                    <button type="button" onClick={() => openCatalogVideoDialog(product)}>
                      <Video size={15} />
                      Видео
                    </button>
                  ) : null}
                  <button type="button" onClick={() => startEditCatalogProduct(product)}>
                    <Pencil size={15} />
                    Править
                  </button>
                  <button type="button" className="danger" onClick={() => archiveAdminCatalogProduct(product.id)}>
                    <Trash2 size={15} />
                    Убрать
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-empty compact">
              <PackageCheck size={30} />
              <h3>Товаров по фильтру нет</h3>
              <p>Создайте новую карточку или измените поиск и категорию.</p>
            </div>
          )}
        </div>

        {catalogEditorOpen ? (
          <div className="admin-catalog-editor-layer" role="presentation" onMouseDown={resetCatalogProductForm}>
            <form
              className="admin-catalog-product-form admin-catalog-editor"
              onSubmit={saveCatalogProduct}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-catalog-editor-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="admin-catalog-form-head">
                <div>
                  <p className="eyebrow">Карточка товара</p>
                  <h3 id="admin-catalog-editor-title">
                    {editingCatalogProductId ? "Редактирование товара" : "Новый товар"}
                  </h3>
                </div>
                <button type="button" onClick={resetCatalogProductForm} aria-label="Закрыть форму товара">
                  <X size={15} />
                  Закрыть
                </button>
              </div>

              <label className={`admin-catalog-product-photo ${catalogProductPreviewImage ? "has-preview" : ""}`}>
                <input
                  key={catalogProductInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleCatalogProductFileChange}
                />
                {catalogProductPreviewImage ? (
                  <img src={catalogProductPreviewImage} alt="Предпросмотр товара" />
                ) : (
                  <span>
                    <ImagePlus size={24} />
                    Фото товара
                    <small>Загрузите фото. Сервер сожмёт его автоматически.</small>
                  </span>
                )}
              </label>

              <div className="admin-catalog-product-fields">
                <label className="field">
                  <span>Категория</span>
                  <select
                    value={catalogProductForm.categoryId}
                    onChange={(event) => updateCatalogProductForm("categoryId", event.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    {catalogCategories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.shortTitle || category.title}
                        {category.status === "archived" || category.archivedAt ? " · архив" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Название</span>
                  <input
                    value={catalogProductForm.name}
                    onChange={(event) => updateCatalogProductForm("name", event.target.value)}
                    placeholder="Пепперони"
                  />
                </label>
                <label className="field">
                  <span>Вес / формат</span>
                  <input
                    value={catalogProductForm.weight}
                    onChange={(event) => updateCatalogProductForm("weight", event.target.value)}
                    placeholder="30 см, 520 г или 3 пиццы"
                  />
                </label>
                <label className="field">
                  <span>Цена</span>
                  <input
                    value={catalogProductForm.price}
                    onChange={(event) => updateCatalogProductForm("price", event.target.value)}
                    inputMode="numeric"
                    placeholder="690"
                  />
                </label>
                <label className="field">
                  <span>Старая цена</span>
                  <input
                    value={catalogProductForm.oldPrice}
                    onChange={(event) => updateCatalogProductForm("oldPrice", event.target.value)}
                    inputMode="numeric"
                    placeholder="790"
                  />
                </label>
                <label className="field wide">
                  <span>Описание</span>
                  <textarea
                    value={catalogProductForm.description}
                    onChange={(event) => updateCatalogProductForm("description", event.target.value)}
                    placeholder="Коротко о вкусе, формате и для какого случая подходит"
                  />
                </label>
                <label className="field wide">
                  <span>Состав</span>
                  <textarea
                    value={catalogProductForm.ingredients}
                    onChange={(event) => updateCatalogProductForm("ingredients", event.target.value)}
                    placeholder="Моцарелла, пепперони, томатный соус"
                  />
                </label>
                <label className="field">
                  <span>Калорийность</span>
                  <input
                    value={catalogProductForm.calories}
                    onChange={(event) => updateCatalogProductForm("calories", event.target.value)}
                    inputMode="decimal"
                    placeholder="690"
                  />
                </label>
                <label className="field">
                  <span>Белки, г</span>
                  <input
                    value={catalogProductForm.protein}
                    onChange={(event) => updateCatalogProductForm("protein", event.target.value)}
                    inputMode="decimal"
                    placeholder="24.5"
                  />
                </label>
                <label className="field">
                  <span>Жиры, г</span>
                  <input
                    value={catalogProductForm.fat}
                    onChange={(event) => updateCatalogProductForm("fat", event.target.value)}
                    inputMode="decimal"
                    placeholder="18.2"
                  />
                </label>
                <label className="field">
                  <span>Углеводы, г</span>
                  <input
                    value={catalogProductForm.carbs}
                    onChange={(event) => updateCatalogProductForm("carbs", event.target.value)}
                    inputMode="decimal"
                    placeholder="72.4"
                  />
                </label>
                <label className="field">
                  <span>Бейджи</span>
                  <input
                    value={catalogProductForm.badges}
                    onChange={(event) => updateCatalogProductForm("badges", event.target.value)}
                    placeholder="новинка, комбо месяца"
                  />
                </label>
                <label className="field">
                  <span>Статус</span>
                  <select
                    value={catalogProductForm.status}
                    onChange={(event) => updateCatalogProductForm("status", event.target.value)}
                  >
                    <option value="active">Опубликован</option>
                    <option value="hidden">Временно скрыт</option>
                    <option value="archived">Архив</option>
                  </select>
                </label>
                <button className="admin-form-action" type="submit" disabled={catalogLoading}>
                  <Save size={17} />
                  {catalogLoading ? "Сохраняем..." : editingCatalogProductId ? "Сохранить товар" : "Добавить товар"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {catalogVideoProduct ? (
          <div className="admin-catalog-editor-layer" role="presentation" onMouseDown={closeCatalogVideoDialog}>
            <form
              className="admin-catalog-video-dialog"
              onSubmit={saveCatalogVideo}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-catalog-video-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="admin-catalog-form-head">
                <div>
                  <p className="eyebrow">Видео блюда</p>
                  <h3 id="admin-catalog-video-title">{catalogVideoProduct.name}</h3>
                </div>
                <button type="button" onClick={closeCatalogVideoDialog} aria-label="Закрыть видео товара">
                  <X size={15} />
                  Закрыть
                </button>
              </div>

              <label className={`admin-catalog-video-picker ${catalogVideoPreview || catalogVideoProduct.videoUrl ? "has-video" : ""}`}>
                <input
                  key={catalogVideoInputKey}
                  type="file"
                  accept="video/*"
                  onChange={handleCatalogVideoFileChange}
                />
                {catalogVideoPreview || catalogVideoProduct.videoUrl || catalogVideoProduct.video?.url ? (
                  <video
                    src={catalogVideoPreview || catalogVideoProduct.videoUrl || catalogVideoProduct.video?.url}
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <span>
                    <PlayCircle size={28} />
                    Прикрепить видео блюда
                    <small>Вертикальный ролик 10-15 секунд. Сервер сохранит без звука и подготовит для сайта.</small>
                  </span>
                )}
              </label>

              <div className="admin-catalog-video-meta">
                <div>
                  <b>{catalogVideoProduct.videoUrl || catalogVideoProduct.video?.url ? "Видео уже есть" : "Видео пока нет"}</b>
                  <span>
                    {catalogVideoFile
                      ? `${catalogVideoFile.name} · ${(catalogVideoFile.size / 1024 / 1024).toFixed(1)} МБ`
                      : catalogVideoProduct.videoSizeBytes
                        ? `${(catalogVideoProduct.videoSizeBytes / 1024 / 1024).toFixed(1)} МБ на сервере`
                        : "Загрузите файл MOV или MP4"}
                  </span>
                </div>
                <div className="admin-catalog-video-actions">
                  {(catalogVideoProduct.videoUrl || catalogVideoProduct.video?.url) ? (
                    <button type="button" className="danger" onClick={removeCatalogVideo} disabled={catalogLoading}>
                      <Trash2 size={15} />
                      Удалить видео
                    </button>
                  ) : null}
                  <button type="submit" disabled={catalogLoading || !catalogVideoFile}>
                    <Save size={16} />
                    {catalogLoading ? "Сохраняем..." : "Сохранить видео"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </section>
      ) : null}

      {adminView === "lost" ? (
      <section className="admin-lost-items admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Найденные вещи</h2>
            <p>Добавление на страницу «Потеряшки» и внутренний архив.</p>
          </div>
          <span>{activeLostItems.length || "Нет"} на странице · {archivedLostItems.length} в архиве</span>
        </div>

        <form className="admin-lost-form" onSubmit={createLostItem}>
          <label className={`admin-lost-photo-picker ${lostItemPreview ? "has-preview" : ""}`}>
            <input
              key={lostItemInputKey}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleLostItemPhotoChange}
            />
            {lostItemPreview ? (
              <img src={lostItemPreview} alt="Предпросмотр потеряшки" />
            ) : (
              <span>
                <Camera size={24} />
                Сделать фото
                <small>Камера откроется на телефоне. Фото сожмётся до 100-200 КБ.</small>
              </span>
            )}
          </label>

          <div className="admin-lost-form-fields">
            <label className="field">
              <span>Дата добавления</span>
              <input
                type="date"
                value={lostItemAddedAt}
                onChange={(event) => setLostItemAddedAt(event.target.value)}
              />
            </label>
            <button className="admin-form-action" type="submit" disabled={lostItemLoading || !lostItemPhoto}>
              <ImagePlus size={17} />
              {lostItemLoading ? "Отправляем..." : "Добавить потеряшку"}
            </button>
          </div>
        </form>

        {lostItemStatus ? <div className="admin-push-status">{lostItemStatus}</div> : null}

        <div className="admin-lost-tools">
          <label className="field">
            <span>Поиск по номеру</span>
            <input
              type="search"
              value={lostItemSearch}
              onChange={(event) => setLostItemSearch(event.target.value)}
              placeholder="Например: 071"
              inputMode="numeric"
            />
          </label>
          <div>
            <b>{filteredActiveLostItems.length}</b>
            <span>найдено на странице</span>
          </div>
          <div>
            <b>{filteredArchivedLostItems.length}</b>
            <span>в архиве удалённых</span>
          </div>
        </div>

        <div className="admin-lost-list">
          {filteredActiveLostItems.length ? (
            filteredActiveLostItems.map((item) => (
              <article className={`admin-lost-card ${item.archivedAt ? "is-archived" : ""}`} key={item.id}>
                <button
                  type="button"
                  className="admin-lost-image-button"
                  onClick={() => setLostItemViewer(item)}
                  aria-label={`Открыть фотографию потеряшки ${formatLostItemNumber(item)}`}
                >
                  <img
                    src={item.image}
                    alt={`Потеряшка ${formatLostItemNumber(item)}`}
                    loading="lazy"
                  />
                  <span aria-hidden="true">
                    <Eye size={15} />
                  </span>
                </button>
                <div>
                  <b>Потеряшка {formatLostItemNumber(item)}</b>
                  <span>
                    Добавили {formatDateOnly(item.addedAt)}
                    {item.sizeBytes ? ` · ${formatFileSize(item.sizeBytes)}` : ""}
                  </span>
                </div>
                <button type="button" onClick={() => archiveAdminLostItem(item.id)} disabled={lostItemLoading}>
                  <Trash2 size={15} />
                  Удалить
                </button>
              </article>
            ))
          ) : (
            <div className="admin-empty compact">
              <Camera size={30} />
              <h3>{lostItemSearch ? "По этому номеру ничего нет на странице" : "Потеряшек из админки пока нет"}</h3>
              <p>
                {lostItemSearch
                  ? "Проверьте номер или посмотрите архив удалённых ниже."
                  : "Сделайте фото найденной вещи, нажмите отправить, и она появится на публичной странице."}
              </p>
            </div>
          )}
        </div>

        <div className="admin-lost-archive-title">
          <div>
            <h3>Архив удалённых</h3>
            <p>Храним бессрочно внутри админки, на публичной странице эти карточки не показываются.</p>
          </div>
          <span>{filteredArchivedLostItems.length}</span>
        </div>

        <div className="admin-lost-list is-archive">
          {filteredArchivedLostItems.length ? (
            filteredArchivedLostItems.map((item) => (
              <article className="admin-lost-card is-archived" key={item.id}>
                <button
                  type="button"
                  className="admin-lost-image-button"
                  onClick={() => setLostItemViewer(item)}
                  aria-label={`Открыть фотографию потеряшки ${formatLostItemNumber(item)} из архива`}
                >
                  <img
                    src={item.image}
                    alt={`Потеряшка ${formatLostItemNumber(item)} из архива`}
                    loading="lazy"
                  />
                  <span aria-hidden="true">
                    <Eye size={15} />
                  </span>
                </button>
                <div>
                  <b>Потеряшка {formatLostItemNumber(item)}</b>
                  <span>
                    Добавили {formatDateOnly(item.addedAt)}
                    {item.archivedAt ? ` · удалили ${formatDate(item.archivedAt)}` : ""}
                  </span>
                </div>
                <strong>Архив</strong>
              </article>
            ))
          ) : (
            <div className="admin-empty compact">
              <Archive size={30} />
              <h3>{lostItemSearch ? "В архиве такого номера нет" : "Архив пока пуст"}</h3>
              <p>Удалённые потеряшки будут оставаться здесь без ограничения срока.</p>
            </div>
          )}
        </div>

        {lostItemViewer ? (
          <div
            className="admin-lost-viewer-layer"
            role="presentation"
            onMouseDown={() => setLostItemViewer(null)}
          >
            <section
              className="admin-lost-viewer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-lost-viewer-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>{lostItemViewer.archivedAt ? "В архиве" : "На странице"}</span>
                  <h3 id="admin-lost-viewer-title">
                    Потеряшка {formatLostItemNumber(lostItemViewer)}
                  </h3>
                  <p>
                    Добавили {formatDateOnly(lostItemViewer.addedAt)}
                    {lostItemViewer.sizeBytes ? ` · ${formatFileSize(lostItemViewer.sizeBytes)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLostItemViewer(null)}
                  aria-label="Закрыть фотографию"
                  autoFocus
                >
                  <X size={18} />
                </button>
              </header>

              <figure>
                <img
                  src={lostItemViewer.image}
                  alt={`Увеличенная фотография потеряшки ${formatLostItemNumber(lostItemViewer)}`}
                />
              </figure>

              <footer>
                <span>Нажмите Esc или область вокруг фото, чтобы закрыть.</span>
                <a href={lostItemViewer.image} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Открыть оригинал
                </a>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
      ) : null}

      {adminView === "blogger-rewards" ? (
      <section className="admin-blogger-rewards admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Отзывы блогеров</h2>
            <p>Ожидающие и уже выданные десерты.</p>
          </div>
          <span>{pendingBloggerRewards.length} ожидают · {redeemedBloggerRewards.length} выдано</span>
        </div>

        <form className="admin-blogger-reward-form" onSubmit={createBloggerReward}>
          <div className="admin-blogger-media-pickers">
            <label className={`admin-blogger-photo-picker ${bloggerRewardReviewPreview ? "has-preview" : ""}`}>
              <input
                key={`review-${bloggerRewardInputKey}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => handleBloggerRewardFile("review", event)}
              />
              {bloggerRewardReviewPreview ? (
                <img src={bloggerRewardReviewPreview} alt="Предпросмотр отзыва" />
              ) : (
                <span>
                  <ImagePlus size={24} />
                  Скриншот отзыва
                  <small>Отзыв на картах с фотографией</small>
                </span>
              )}
            </label>

            <label className={`admin-blogger-photo-picker ${bloggerRewardProfilePreview ? "has-preview" : ""}`}>
              <input
                key={`profile-${bloggerRewardInputKey}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => handleBloggerRewardFile("profile", event)}
              />
              {bloggerRewardProfilePreview ? (
                <img src={bloggerRewardProfilePreview} alt="Предпросмотр Instagram-аккаунта" />
              ) : (
                <span>
                  <Instagram size={24} />
                  Скриншот аккаунта
                  <small>Профиль блогера в Instagram</small>
                </span>
              )}
            </label>
          </div>

          <div className="admin-blogger-form-fields">
            <label className="field">
              <span>Ссылка на Instagram</span>
              <input
                type="url"
                value={bloggerRewardForm.instagramUrl}
                onChange={(event) =>
                  setBloggerRewardForm((current) => ({ ...current, instagramUrl: event.target.value }))
                }
                placeholder="https://instagram.com/account"
                required
              />
            </label>
            <button
              className="admin-form-action"
              type="submit"
              disabled={
                bloggerRewardLoading === "create" ||
                !bloggerRewardReviewFile ||
                !bloggerRewardProfileFile
              }
            >
              <Plus size={17} />
              {bloggerRewardLoading === "create" ? "Сохраняем..." : "Добавить в ожидающие"}
            </button>
          </div>
        </form>

        {bloggerRewardStatus ? <div className="admin-push-status">{bloggerRewardStatus}</div> : null}

        <div className="admin-blogger-tools">
          <label className="field">
            <span>Быстрый поиск</span>
            <input
              type="search"
              value={bloggerRewardSearch}
              onChange={(event) => setBloggerRewardSearch(event.target.value)}
              placeholder="@аккаунт, ссылка или сотрудник"
            />
          </label>
          <div className="admin-blogger-view-toggle" aria-label="Статус выдачи десерта">
            <button
              type="button"
              className={bloggerRewardView === "pending" ? "active" : ""}
              onClick={() => setBloggerRewardView("pending")}
            >
              Ожидают
              <span>{pendingBloggerRewards.length}</span>
            </button>
            <button
              type="button"
              className={bloggerRewardView === "redeemed" ? "active" : ""}
              onClick={() => setBloggerRewardView("redeemed")}
            >
              Выдано
              <span>{redeemedBloggerRewards.length}</span>
            </button>
          </div>
        </div>

        <div className="admin-blogger-reward-list">
          {filteredBloggerRewards.length ? (
            filteredBloggerRewards.map((reward) => {
              const isRedeemed = reward.status === "redeemed";
              const instagramLabel = reward.instagramKey ? `@${reward.instagramKey}` : "Instagram";
              const createdRole = ADMIN_ROLE_LABELS[reward.createdByRole] || reward.createdByRole;
              const redeemedRole = ADMIN_ROLE_LABELS[reward.redeemedByRole] || reward.redeemedByRole;

              return (
                <article
                  className={`admin-blogger-reward-card ${isRedeemed ? "is-redeemed" : ""}`}
                  key={reward.id}
                >
                  <div className="admin-blogger-card-media">
                    <a href={reward.reviewScreenshot} target="_blank" rel="noreferrer">
                      <img src={reward.reviewScreenshot} alt={`Отзыв ${instagramLabel}`} loading="lazy" />
                      <span>Отзыв</span>
                    </a>
                    <a href={reward.profileScreenshot} target="_blank" rel="noreferrer">
                      <img
                        src={reward.profileScreenshot}
                        alt={`Instagram ${instagramLabel}`}
                        loading="lazy"
                      />
                      <span>Аккаунт</span>
                    </a>
                  </div>

                  <div className="admin-blogger-card-body">
                    <div className="admin-blogger-card-head">
                      <div>
                        <span>{isRedeemed ? "Десерт выдан" : "Ожидает выдачи"}</span>
                        <h3>{instagramLabel}</h3>
                      </div>
                      <a href={reward.instagramUrl} target="_blank" rel="noreferrer">
                        <Instagram size={16} />
                        @{reward.instagramKey}
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <dl className="admin-blogger-meta">
                      <div>
                        <dt>Добавили</dt>
                        <dd>
                          {formatDate(reward.createdAt)} · {reward.createdBy}
                          {createdRole ? `, ${createdRole.toLowerCase()}` : ""}
                        </dd>
                      </div>
                      {isRedeemed ? (
                        <div>
                          <dt>Выдали</dt>
                          <dd>
                            {formatDate(reward.redeemedAt)} · {reward.redeemedBy}
                            {redeemedRole ? `, ${redeemedRole.toLowerCase()}` : ""}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="admin-blogger-reward-actions">
                      {isRedeemed ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => changeBloggerRewardStatus(reward, "pending")}
                          disabled={bloggerRewardLoading === reward.id}
                        >
                          <RefreshCw size={16} />
                          Вернуть в ожидающие
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => changeBloggerRewardStatus(reward, "redeemed")}
                          disabled={bloggerRewardLoading === reward.id}
                        >
                          <Gift size={16} />
                          {bloggerRewardLoading === reward.id ? "Сохраняем..." : "Десерт выдан"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="admin-empty compact">
              <Gift size={30} />
              <h3>{bloggerRewardSearch ? "Ничего не найдено" : "Здесь пока пусто"}</h3>
              <p>
                {bloggerRewardSearch
                  ? "Проверьте Instagram-аккаунт или имя сотрудника."
                  : bloggerRewardView === "redeemed"
                    ? "После выдачи десерта карточки останутся здесь с датой и сотрудником."
                    : "Добавьте первого блогера через форму выше."}
              </p>
            </div>
          )}
        </div>
      </section>
      ) : null}

      {adminView === "orders" ? (
      <>
      <section className="admin-stats">
        {stats.map(({ status, count }) => {
          const Icon = STATUS_ICONS[status];
          return (
            <article className={`admin-stat-card ${status}`} key={status}>
              <Icon size={18} />
              <span>{STATUS_LABELS[status]}</span>
              <b>{count}</b>
            </article>
          );
        })}
      </section>

      <section className="admin-orders">
        <div className="admin-section-title">
          <div>
            <h2>Заказы в работе</h2>
            <p>Сначала обработайте новые. Следующий этап доступен прямо в карточке.</p>
          </div>
          <span>{loading ? "Обновляем..." : `${activeOrders.length} в смене · ${revenue ? `${formatPrice(revenue)} ₽` : "0 ₽"}`}</span>
        </div>

        {activeOrders.length ? (
          <div className="admin-order-list">
          {activeOrders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status] || CheckCircle2;
            const draft = orderDrafts[order.id] || makeOrderDraft(order);
            const isEditing = editingOrderId === order.id;
            const paymentUrl = getOrderPaymentUrl(order);
            const isSavingOrder = orderActionLoading === `update:${order.id}`;
            const isCancellingOrder = orderActionLoading === `cancel:${order.id}`;
            const isRefundingOrder = orderActionLoading === `refund:${order.id}`;
            const isChangingStatus = orderActionLoading === `status:${order.id}`;
            const statusHistory = getOrderStatusHistory(order);
            const nextAction = getNextOrderAction(order);
            const NextActionIcon = nextAction?.Icon || CheckCircle2;
            const hasActiveRefund = Array.isArray(order.refunds)
              ? order.refunds.some((refund) => ["pending", "succeeded"].includes(refund?.status))
              : false;
            return (
              <article className={`admin-order-card status-${order.status}`} key={order.id}>
                <div className="admin-order-head">
                  <div>
                    <b>#{order.id}</b>
                    <span>
                      <Clock size={15} />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="admin-order-status-box">
                    <strong className={`admin-status ${order.status}`}>
                      <StatusIcon size={16} />
                      {STATUS_LABELS[order.status] || "Принят"}
                    </strong>
                    <span>{getOrderStageText(order)}</span>
                  </div>
                </div>

                <div className="admin-order-meta">
                  <div>
                    <UserRound size={16} />
                    <span>
                      <b>{order.customerName || "Гость"}</b>
                      {order.customerPhone ? <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a> : "-"}
                    </span>
                  </div>
                  <div>
                    {order.mode === "pickup" ? <PackageCheck size={16} /> : <Bike size={16} />}
                    <span>
                      <b>{order.mode === "pickup" ? "Самовывоз" : "Доставка"}</b>
                      {compactAddress(order)}
                    </span>
                  </div>
                </div>

                <div className="admin-items">
                  {(order.items || []).map((item, index) => (
                    <div key={`${order.id}-${item.name}-${index}`}>{itemLine(item)}</div>
                  ))}
                </div>

                <div className="admin-order-bottom">
                  <div>
                    <span>Сумма заказа</span>
                    <strong>{formatPrice(order.total)} ₽</strong>
                  </div>
                  <div>
                    <span>Оплата и уведомления</span>
                    <b>{order.payment || "оплата при получении"} · push {order.pushEnabled ? "включён" : "не включён"}</b>
                  </div>
                </div>

                <div className="admin-order-control-row">
                  <label className="admin-status-select">
                    <span>Текущий статус</span>
                    <select
                      value={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      disabled={isChangingStatus || order.status === "cancelled"}
                    >
                      {!ORDER_STATUS_OPTIONS.some(([status]) => status === order.status) ? (
                        <option value={order.status}>
                          {STATUS_LABELS[order.status] || order.status}
                        </option>
                      ) : null}
                      {ORDER_STATUS_OPTIONS.map(([status, label]) => (
                        <option key={status} value={status}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={`admin-order-push-note ${order.pushEnabled ? "is-enabled" : ""}`}>
                    <BellRing size={16} />
                    <span>
                      {order.pushEnabled
                        ? "Push включён"
                        : "Без push"}
                    </span>
                  </div>
                  {nextAction ? (
                    <button
                      className="admin-order-next"
                      type="button"
                      onClick={() =>
                        nextAction.archive
                          ? closeOrderCard(order.id)
                          : updateStatus(order.id, nextAction.status)
                      }
                      disabled={isChangingStatus}
                    >
                      <NextActionIcon size={17} />
                      {isChangingStatus ? "Сохраняем..." : nextAction.label}
                    </button>
                  ) : null}
                </div>

                {order.customerChangeRequest?.text ? (
                  <div className="admin-order-note admin-order-customer-request">
                    <span>
                      Запрос гостя на изменение: {order.customerChangeRequest.text}
                    </span>
                  </div>
                ) : null}

                {order.refundStatus === "requested" ? (
                  <div className="admin-order-note admin-order-customer-request">
                    <span>Гость отменил оплаченный заказ. Нужно проверить и оформить возврат.</span>
                  </div>
                ) : null}

                {order.adminNote || order.cancelReason ? (
                  <div className="admin-order-note">
                    {order.adminNote ? <span>Заметка: {order.adminNote}</span> : null}
                    {order.cancelReason ? <span>Отмена: {order.cancelReason}</span> : null}
                  </div>
                ) : null}

                <details className="admin-order-history">
                  <summary>
                    <Clock size={15} />
                    История статусов
                    <span>{statusHistory.length}</span>
                  </summary>
                  <div className="admin-order-timeline" aria-label="История статусов заказа">
                    {statusHistory.map((event, index) => {
                      const EventIcon = STATUS_ICONS[event.status] || CheckCircle2;
                      return (
                        <div className="admin-order-timeline-event" key={`${event.status}-${event.changedAt}-${index}`}>
                          <EventIcon size={14} />
                          <span>
                            <b>{event.statusLabel || STATUS_LABELS[event.status] || event.status}</b>
                            <small>
                              {formatDateTime(event.changedAt)}
                              {event.changedBy ? ` · ${event.changedBy}` : ""}
                              {event.note ? ` · ${event.note}` : ""}
                            </small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>

                {isEditing ? (
                  <div className="admin-order-edit">
                    <label className="field">
                      <span>Имя гостя</span>
                      <input
                        value={draft.customerName}
                        onChange={(event) => updateOrderDraft(order.id, "customerName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Телефон</span>
                      <input
                        value={draft.customerPhone}
                        onChange={(event) => updateOrderDraft(order.id, "customerPhone", event.target.value)}
                      />
                    </label>
                    <label className="field wide">
                      <span>Адрес или самовывоз</span>
                      <input
                        value={draft.address}
                        onChange={(event) => updateOrderDraft(order.id, "address", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Оплата</span>
                      <input
                        value={draft.payment}
                        onChange={(event) => updateOrderDraft(order.id, "payment", event.target.value)}
                      />
                    </label>
                    <label className="field wide">
                      <span>Внутренняя заметка</span>
                      <input
                        value={draft.adminNote}
                        onChange={(event) => updateOrderDraft(order.id, "adminNote", event.target.value)}
                        placeholder="Например: клиент просил убрать лук"
                      />
                    </label>
                    <div className="admin-order-edit-actions">
                      <button type="button" onClick={() => saveOrderDraft(order.id)} disabled={isSavingOrder}>
                        <Save size={16} />
                        {isSavingOrder ? "Сохраняем" : "Сохранить"}
                      </button>
                      <button type="button" onClick={() => setEditingOrderId("")}>
                        <X size={16} />
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="admin-status-actions">
                  <button type="button" onClick={() => startEditOrder(order)}>
                    <Pencil size={15} />
                    {isEditing ? "Свернуть" : "Править"}
                  </button>
                  {paymentUrl ? (
                    <a className="admin-order-payment-link" href={paymentUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} />
                      Ссылка оплаты
                    </a>
                  ) : null}
                  {canManageBusiness &&
                  order.paymentProvider === "yookassa" &&
                  order.paymentStatus === "paid" &&
                  !hasActiveRefund ? (
                    <button
                      type="button"
                      className="refund-order"
                      onClick={() => refundOrderPayment(order)}
                      disabled={isRefundingOrder}
                    >
                      <RefreshCw size={15} />
                      {isRefundingOrder ? "Возвращаем" : "Вернуть оплату"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="cancel-order"
                    onClick={() => cancelOrderCard(order.id)}
                    disabled={order.status === "cancelled" || isCancellingOrder}
                  >
                    <Ban size={15} />
                    {isCancellingOrder ? "Отменяем" : "Отменить"}
                  </button>
                </div>
              </article>
            );
          })}
          </div>
        ) : (
          <div className="admin-empty">
            <PackageCheck size={34} />
            <h3>Активных заказов нет</h3>
            <p>
              {archivedCount
                ? `Закрытые заказы скрыты из рабочего списка: ${archivedCount}.`
                : "Оформите тестовый заказ в приложении, и он появится здесь после сохранения в базе."}
            </p>
          </div>
        )}
      </section>
      </>
      ) : null}

      {canManageBusiness && adminView === "gallery" ? (
      <section className="admin-gallery admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Материалы галереи</h2>
            <p>Фотографии и видео, опубликованные на сайте.</p>
          </div>
          <span>{activeGalleryItems.length || "Нет"} на сайте · {archivedGalleryItems.length} в архиве</span>
        </div>

        <form className="admin-gallery-form" onSubmit={createGalleryMaterial}>
          <label className={`admin-gallery-media-picker ${galleryPreview ? "has-preview" : ""}`}>
            <input
              key={galleryInputKey}
              type="file"
              accept="image/*"
              onChange={handleGalleryFileChange}
            />
            {galleryPreview ? (
              <img src={galleryPreview} alt="Предпросмотр материала галереи" />
            ) : (
              <span>
                <ImagePlus size={24} />
                {galleryForm.type === "video" ? "Постер видео" : "Фото галереи"}
                <small>
                  Для видео файл необязателен, но с постером карточка выглядит лучше.
                </small>
              </span>
            )}
          </label>

          <div className="admin-gallery-form-fields">
            <label className="field">
              <span>Тип</span>
              <select value={galleryForm.type} onChange={(event) => updateGalleryForm("type", event.target.value)}>
                <option value="photo">Фото</option>
                <option value="video">Видео Kinescope</option>
              </select>
            </label>
            <label className="field">
              <span>Заголовок</span>
              <input
                value={galleryForm.title}
                onChange={(event) => updateGalleryForm("title", event.target.value)}
                placeholder="Например: День рождения в зале"
              />
            </label>
            <label className="field wide">
              <span>Подпись</span>
              <textarea
                value={galleryForm.caption}
                onChange={(event) => updateGalleryForm("caption", event.target.value)}
                placeholder="Коротко, что на фото или видео"
              />
            </label>
            {galleryForm.type === "video" ? (
              <label className="field wide">
                <span>Ссылка Kinescope</span>
                <input
                  value={galleryForm.videoUrl}
                  onChange={(event) => updateGalleryForm("videoUrl", event.target.value)}
                  placeholder="https://kinescope.io/embed/..."
                />
              </label>
            ) : null}
            <label className="field">
              <span>Формат</span>
              <select
                value={galleryForm.orientation}
                onChange={(event) => updateGalleryForm("orientation", event.target.value)}
              >
                <option value="landscape">Широкое</option>
                <option value="portrait">Вертикальное</option>
                <option value="square">Квадрат</option>
                <option value="video">Видео 9:16</option>
              </select>
            </label>
            <button className="admin-form-action" type="submit" disabled={galleryLoading}>
              <Plus size={17} />
              {galleryLoading ? "Сохраняем..." : "Добавить"}
            </button>
          </div>
        </form>

        {galleryStatus ? <div className="admin-push-status">{galleryStatus}</div> : null}

        <div className="admin-gallery-list">
          {activeGalleryItems.length ? (
            activeGalleryItems.map((item, galleryIndex) => {
              const draft = galleryDrafts[item.id] || makeGalleryDraft(item);
              const thumb = getGalleryThumb(item);
              const isFirstGalleryItem = galleryIndex === 0;
              const isLastGalleryItem = galleryIndex === activeGalleryItems.length - 1;
              return (
                <article className="admin-gallery-card" key={item.id}>
                  <div className="admin-gallery-preview">
                    {thumb ? <img src={thumb} alt="" loading="lazy" /> : <ImagePlus size={30} />}
                    <span>{galleryTypeLabel(item.type)}</span>
                  </div>
                  <div className="admin-gallery-editor">
                    <div className="admin-gallery-card-head">
                      <div>
                        <b>{item.title || "Без заголовка"}</b>
                        <span>
                          На сайте {galleryIndex + 1} · {galleryOrientationLabel(item.orientation)}
                          {item.sizeBytes ? ` · ${formatFileSize(item.sizeBytes)}` : ""}
                        </span>
                      </div>
                      <div className="admin-gallery-head-actions">
                        <div className="admin-gallery-reorder" aria-label="Порядок в галерее">
                          <button
                            type="button"
                            onClick={() => moveGalleryItem(item.id, -1)}
                            disabled={galleryLoading || isFirstGalleryItem}
                            aria-label="Поднять выше"
                            title="Поднять выше"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGalleryItem(item.id, 1)}
                            disabled={galleryLoading || isLastGalleryItem}
                            aria-label="Опустить ниже"
                            title="Опустить ниже"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        {item.videoUrl ? (
                          <a href={item.videoUrl} target="_blank" rel="noreferrer">
                            <ExternalLink size={15} />
                            Видео
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="admin-gallery-fields">
                      <label className="field">
                        <span>Заголовок</span>
                        <input
                          value={draft.title}
                          onChange={(event) => updateGalleryDraft(item.id, "title", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Формат</span>
                        <select
                          value={draft.orientation}
                          onChange={(event) => updateGalleryDraft(item.id, "orientation", event.target.value)}
                        >
                          <option value="landscape">Широкое</option>
                          <option value="portrait">Вертикальное</option>
                          <option value="square">Квадрат</option>
                          <option value="video">Видео 9:16</option>
                        </select>
                      </label>
                      <label className="field wide">
                        <span>Подпись</span>
                        <textarea
                          value={draft.caption}
                          onChange={(event) => updateGalleryDraft(item.id, "caption", event.target.value)}
                        />
                      </label>
                      {item.type === "video" ? (
                        <label className="field wide">
                          <span>Ссылка Kinescope</span>
                          <input
                            value={draft.videoUrl}
                            onChange={(event) => updateGalleryDraft(item.id, "videoUrl", event.target.value)}
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="admin-gallery-actions">
                      <button type="button" onClick={() => saveGalleryDraft(item.id)} disabled={galleryLoading}>
                        <Save size={15} />
                        Сохранить
                      </button>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) replaceGalleryMedia(item.id, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <ImagePlus size={15} />
                        {item.type === "video" ? "Заменить постер" : "Заменить фото"}
                      </label>
                      <button type="button" className="danger" onClick={() => archiveAdminGalleryItem(item.id)} disabled={galleryLoading}>
                        <Trash2 size={15} />
                        Убрать
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="admin-empty compact">
              <ImagePlus size={30} />
              <h3>В галерее пока нет материалов</h3>
              <p>Добавьте первое фото или видео, и оно появится на главной странице и в разделе “Галерея”.</p>
            </div>
          )}
        </div>

        {archivedGalleryItems.length ? (
          <>
            <div className="admin-lost-archive-title">
              <div>
                <h3>Архив галереи</h3>
                <p>Материалы не видны гостям, но остаются в панели руководителя.</p>
              </div>
              <span>{archivedGalleryItems.length}</span>
            </div>
            <div className="admin-gallery-archive">
              {archivedGalleryItems.map((item) => (
                <article className="admin-gallery-archive-card" key={item.id}>
                  {getGalleryThumb(item) ? <img src={getGalleryThumb(item)} alt="" loading="lazy" /> : <ImagePlus size={22} />}
                  <div>
                    <b>{item.title || "Материал без заголовка"}</b>
                    <span>{galleryTypeLabel(item.type)} · убран {item.archivedAt ? formatDate(item.archivedAt) : "из галереи"}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
      ) : null}

      {canManageBusiness && adminView === "reviews" ? (
      <section className="admin-reviews admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Модерация отзывов</h2>
            <p>Новые отзывы перед публикацией на сайте.</p>
          </div>
          <span>{reviewLoading ? "Обновляем..." : reviews.length ? `${reviews.length} отзывов` : "Очередь пуста"}</span>
        </div>

        <div className="admin-review-filters" aria-label="Фильтр отзывов">
          {[
            ["pending", "Новые"],
            ["approved", "Опубликованные"],
            ["rejected", "Отклонённые"],
            ["all", "Все"]
          ].map(([status, label]) => (
            <button
              className={reviewStatusFilter === status ? "active" : ""}
              type="button"
              key={status}
              onClick={() => changeReviewFilter(status)}
            >
              {label}
            </button>
          ))}
        </div>

        {reviewStatus ? <div className="admin-push-status">{reviewStatus}</div> : null}

        <div className="admin-review-list">
          {reviews.length ? (
            reviews.map((review) => (
              <article className={`admin-review-card ${review.status}`} key={review.id}>
                <header className="admin-review-head">
                  <div>
                    <b>{review.productId}</b>
                    <span>
                      {review.customerName || "Гость"} · {review.customerPhone || "телефон не указан"}
                    </span>
                  </div>
                  <div className="admin-review-meta">
                    <strong className={`admin-review-status ${review.status}`}>
                      {REVIEW_STATUS_LABELS[review.status] || review.status}
                    </strong>
                    {review.isDemo ? <span className="admin-review-demo-badge">Демо</span> : null}
                    <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                  </div>
                </header>

                {renderAdminStars(review.rating)}
                <p className="admin-review-text">{review.text || "Без текста"}</p>

                {review.photos?.length ? (
                  <div className="admin-review-photos" aria-label="Фотографии отзыва">
                    {review.photos.map((photo) => (
                      <img src={photo.url} alt="" loading="lazy" key={photo.id || photo.url} />
                    ))}
                  </div>
                ) : null}

                <div className="admin-review-actions">
                  <button
                    type="button"
                    disabled={review.status === "approved" || reviewLoading}
                    onClick={() => moderateAdminReview(review.id, "approved")}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    disabled={review.status === "rejected" || reviewLoading}
                    onClick={() => moderateAdminReview(review.id, "rejected")}
                  >
                    Отклонить
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-empty compact">
              <Star size={30} />
              <h3>Новых отзывов нет</h3>
              <p>Когда гость отправит отзыв, он появится здесь перед публикацией.</p>
            </div>
          )}
        </div>
      </section>
      ) : null}

      {canManageBusiness && adminView === "partners" ? (
      <section className="admin-partners admin-secondary-section">
        <div className="admin-section-title">
          <div>
            <h2>Партнёры и промокоды</h2>
            <p>Партнёрские аккаунты и скидочные коды сайта.</p>
          </div>
          <span>Только для руководителя</span>
        </div>

        <div className="admin-business-switch" role="tablist" aria-label="Партнёры и промокоды">
          <button
            className={partnerWorkspaceView === "partners" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={partnerWorkspaceView === "partners"}
            onClick={() => setPartnerWorkspaceView("partners")}
          >
            <UsersRound size={16} />
            <span>Партнёры</span>
            <b>{partners.length}</b>
          </button>
          <button
            className={partnerWorkspaceView === "promos" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={partnerWorkspaceView === "promos"}
            onClick={() => setPartnerWorkspaceView("promos")}
          >
            <Tags size={16} />
            <span>Промокоды сайта</span>
            <b>{promoCodes.length}</b>
          </button>
        </div>

        {partnerWorkspaceView === "partners" ? (
        <div className="admin-business-block">
          <div className="admin-business-block-head">
            <div>
              <h3>Партнёрские аккаунты</h3>
              <p>Доступ блогера, персональная скидка и комиссия с заказа.</p>
            </div>
            <span>{partners.length ? `${partners.length} партнёров` : "Пока нет партнёров"}</span>
          </div>

        <form className="admin-partner-form" onSubmit={createPartnerAccount}>
          <label className="field">
            <span>Имя блогера</span>
            <input
              value={partnerForm.name}
              onChange={(event) => updatePartnerForm("name", event.target.value)}
              placeholder="Например: Анна Иванова"
            />
          </label>
          <label className="field">
            <span>Логин</span>
            <input
              value={partnerForm.login}
              onChange={(event) => updatePartnerForm("login", event.target.value)}
              placeholder="anna"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              value={partnerForm.password}
              onChange={(event) => updatePartnerForm("password", event.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span>Промокод</span>
            <input
              value={partnerForm.promoCode}
              onChange={(event) => updatePartnerForm("promoCode", event.target.value.toUpperCase())}
              placeholder="ANNA10"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Скидка клиенту, %</span>
            <input
              value={partnerForm.discountPercent}
              onChange={(event) => updatePartnerForm("discountPercent", event.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="field">
            <span>Комиссия блогеру, %</span>
            <input
              value={partnerForm.commissionPercent}
              onChange={(event) => updatePartnerForm("commissionPercent", event.target.value)}
              inputMode="numeric"
            />
          </label>
          <button className="admin-form-action" type="submit" disabled={partnerLoading}>
            <Plus size={17} />
            {partnerLoading ? "Создаём..." : "Создать"}
          </button>
        </form>
        {partnerStatus ? <div className="admin-push-status">{partnerStatus}</div> : null}
        {partnerCredential && !partnerDetails ? (
          <div className="admin-partner-credential-issued">
            <div>
              <KeyRound size={16} />
              <span>
                <small>Доступ создан. Пароль показывается только сейчас.</small>
                <b>{partnerCredential.login} · {partnerCredential.password}</b>
              </span>
            </div>
            <button type="button" onClick={copyPartnerCredential}>
              <Copy size={15} />
              Копировать
            </button>
          </div>
        ) : null}

        <div className="admin-partner-list">
          {partners.length ? (
            partners.map((partner) => (
              <article
                className={`admin-partner-card ${partner.status === "archived" ? "is-archived" : ""}`}
                key={partner.id}
              >
                <div>
                  <span className={`admin-partner-access-badge ${partner.status === "archived" ? "is-archived" : ""}`}>
                    {partner.status === "archived" ? "Архив" : "Доступ открыт"}
                  </span>
                  <b>{partner.name}</b>
                  <span>{partner.login} · {partner.promoCode} · скидка {partner.discountPercent}%</span>
                </div>
                <div>
                  <small>Заказы</small>
                  <strong>{partner.ordersCount}</strong>
                </div>
                <div>
                  <small>Начислено</small>
                  <strong>{formatPrice(partner.commissionAmount)} ₽</strong>
                </div>
                <div>
                  <small>Выплачено</small>
                  <strong>{formatPrice(partner.paidAmount)} ₽</strong>
                </div>
                <div>
                  <small>К выплате</small>
                  <strong>{formatPrice(partner.payableAmount)} ₽</strong>
                </div>
                <button className="admin-partner-manage-button" type="button" onClick={() => openPartnerManager(partner)}>
                  <Settings2 size={15} />
                  Управлять
                </button>
              </article>
            ))
          ) : (
            <div className="admin-empty compact">
              <UsersRound size={30} />
              <h3>Блогеров пока нет</h3>
              <p>Создайте первого партнёра, выдайте ему промокод и доступ в кабинет.</p>
            </div>
          )}
        </div>

        {partnerDetails ? (
          <div className="admin-catalog-editor-layer" role="presentation" onMouseDown={closePartnerManager}>
            <section
              className="admin-partner-manager"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-partner-manager-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="admin-partner-manager-head">
                <div>
                  <p className="eyebrow">Управление партнёром</p>
                  <h3 id="admin-partner-manager-title">{managedPartner?.name}</h3>
                  <span>
                    {managedPartner?.promoCode} · комиссия {managedPartner?.commissionPercent}%
                  </span>
                </div>
                <div>
                  <span
                    className={`admin-partner-access-badge ${
                      managedPartner?.status === "archived" ? "is-archived" : ""
                    }`}
                  >
                    {managedPartner?.status === "archived" ? "Доступ закрыт" : "Доступ открыт"}
                  </span>
                  <button type="button" onClick={closePartnerManager} aria-label="Закрыть управление партнёром">
                    <X size={16} />
                    Закрыть
                  </button>
                </div>
              </header>

              {partnerDetailsLoading ? (
                <div className="admin-partner-manager-loading">Загружаем данные партнёра...</div>
              ) : (
                <>
                  <div className="admin-partner-finance-strip">
                    <div>
                      <small>Заказы</small>
                      <strong>{managedPartner?.ordersCount || 0}</strong>
                    </div>
                    <div>
                      <small>Продажи</small>
                      <strong>{formatPrice(managedPartner?.revenue)} ₽</strong>
                    </div>
                    <div>
                      <small>Начислено</small>
                      <strong>{formatPrice(managedPartner?.commissionAmount)} ₽</strong>
                    </div>
                    <div>
                      <small>Выплачено</small>
                      <strong>{formatPrice(managedPartner?.paidAmount)} ₽</strong>
                    </div>
                    <div className="is-payable">
                      <small>Осталось выплатить</small>
                      <strong>{formatPrice(managedPartner?.payableAmount)} ₽</strong>
                    </div>
                  </div>

                  {partnerManagerStatus ? (
                    <div className="admin-push-status admin-partner-manager-status">{partnerManagerStatus}</div>
                  ) : null}

                  <div className="admin-partner-manager-grid">
                    <section className="admin-partner-control-panel">
                      <div className="admin-partner-control-heading">
                        <LockKeyhole size={18} />
                        <div>
                          <h4>Доступ в кабинет</h4>
                          <p>Логин виден всегда. Действующий пароль хранится только в виде защищённого хеша.</p>
                        </div>
                      </div>

                      <label className="field">
                        <span>Логин партнёра</span>
                        <input value={managedPartner?.login || ""} readOnly />
                      </label>

                      {partnerCredential?.partnerId === managedPartner?.id ? (
                        <div className="admin-partner-current-credential">
                          <span>
                            <small>Новый пароль. Скопируйте и передайте партнёру.</small>
                            <b>{partnerCredential.password}</b>
                          </span>
                          <button type="button" onClick={copyPartnerCredential}>
                            <Copy size={15} />
                            Копировать доступ
                          </button>
                        </div>
                      ) : null}

                      <form className="admin-partner-password-form" onSubmit={savePartnerPassword}>
                        <label className="field">
                          <span>Назначить новый пароль</span>
                          <span className="admin-partner-password-control">
                            <input
                              type={partnerPasswordVisible ? "text" : "password"}
                              value={partnerPasswordDraft}
                              onChange={(event) => {
                                setPartnerPasswordDraft(event.target.value);
                                setPartnerManagerStatus("");
                              }}
                              placeholder="Минимум 6 символов"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setPartnerPasswordVisible((current) => !current)}
                              aria-label={partnerPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
                            >
                              {partnerPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </span>
                        </label>
                        <button type="submit" disabled={partnerActionLoading === "password"}>
                          <KeyRound size={15} />
                          {partnerActionLoading === "password" ? "Меняем..." : "Сменить пароль"}
                        </button>
                      </form>

                      <div className="admin-partner-access-actions">
                        {partnerAccessConfirmation ? (
                          <div className="admin-partner-inline-confirmation">
                            <p>
                              {partnerAccessConfirmation === "archive"
                                ? "Закрыть вход в кабинет и отключить партнёрский промокод? Начисления и история сохранятся."
                                : "Восстановить вход в кабинет и снова включить партнёрский промокод?"}
                            </p>
                            <div>
                              <button type="button" onClick={() => setPartnerAccessConfirmation("")}>
                                Отмена
                              </button>
                              <button
                                type="button"
                                className={partnerAccessConfirmation === "archive" ? "is-danger" : "is-primary"}
                                onClick={applyPartnerAccessStatus}
                                disabled={partnerActionLoading === "access"}
                              >
                                {partnerActionLoading === "access"
                                  ? "Сохраняем..."
                                  : partnerAccessConfirmation === "archive"
                                    ? "Да, закрыть доступ"
                                    : "Да, восстановить"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={managedPartner?.status === "archived" ? "is-restore" : "is-archive"}
                            onClick={() =>
                              setPartnerAccessConfirmation(
                                managedPartner?.status === "archived" ? "restore" : "archive"
                              )
                            }
                          >
                            {managedPartner?.status === "archived" ? (
                              <>
                                <ShieldCheck size={15} />
                                Восстановить доступ
                              </>
                            ) : (
                              <>
                                <Archive size={15} />
                                Отправить в архив
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </section>

                    <section className="admin-partner-control-panel">
                      <div className="admin-partner-control-heading">
                        <WalletCards size={18} />
                        <div>
                          <h4>Провести выплату</h4>
                          <p>Фиксирует фактически переданную сумму. Можно выплатить остаток частями.</p>
                        </div>
                      </div>

                      {Number(managedPartner?.payableAmount || 0) > 0 ? (
                        <form className="admin-partner-payout-form" onSubmit={preparePartnerPayout}>
                          <label className="field">
                            <span>Сумма выплаты, ₽</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              max={managedPartner?.payableAmount || undefined}
                              value={partnerPayoutDraft.amount}
                              onChange={(event) => {
                                setPartnerPayoutDraft((current) => ({
                                  ...current,
                                  amount: event.target.value
                                }));
                                setPartnerPayoutConfirmation(false);
                                setPartnerManagerStatus("");
                              }}
                              inputMode="decimal"
                            />
                          </label>
                          <label className="field">
                            <span>Комментарий</span>
                            <input
                              value={partnerPayoutDraft.note}
                              onChange={(event) =>
                                setPartnerPayoutDraft((current) => ({
                                  ...current,
                                  note: event.target.value
                                }))
                              }
                              placeholder="Например: перевод за первую половину месяца"
                            />
                          </label>
                          <button type="submit">
                            <CircleDollarSign size={16} />
                            Перейти к подтверждению
                          </button>
                        </form>
                      ) : (
                        <div className="admin-partner-payout-empty">
                          <CheckCircle2 size={20} />
                          <span>
                            <b>Задолженности нет</b>
                            <small>Все подтверждённые начисления уже выплачены.</small>
                          </span>
                        </div>
                      )}

                      {partnerPayoutConfirmation ? (
                        <div className="admin-partner-payout-confirmation">
                          <span>Подтвердите фактическую выплату</span>
                          <strong>{formatPrice(partnerPayoutDraft.amount)} ₽</strong>
                          <p>
                            После подтверждения сумма попадёт в историю и уменьшит остаток к выплате.
                          </p>
                          <div>
                            <button type="button" onClick={() => setPartnerPayoutConfirmation(false)}>
                              Назад
                            </button>
                            <button
                              type="button"
                              className="is-primary"
                              onClick={confirmPartnerPayout}
                              disabled={partnerActionLoading === "payout"}
                            >
                              {partnerActionLoading === "payout" ? "Проводим..." : "Подтвердить выплату"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </section>
                  </div>

                  <section className="admin-partner-payout-history">
                    <div>
                      <h4>История выплат</h4>
                      <span>{managedPartnerPayouts.length} операций</span>
                    </div>
                    {managedPartnerPayouts.length ? (
                      <div className="admin-partner-payout-list">
                        {managedPartnerPayouts.map((payout) => (
                          <article key={payout.id}>
                            <span>
                              <b>{formatPrice(payout.amount)} ₽</b>
                              <small>{formatDateTime(payout.paidAt || payout.createdAt)}</small>
                            </span>
                            <p>{payout.note || "Без комментария"}</p>
                            <small>{payout.createdBy || "Руководитель"}</small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-partner-payout-history-empty">
                        Выплат пока не было. Первая подтверждённая операция появится здесь.
                      </p>
                    )}
                  </section>
                </>
              )}
            </section>
          </div>
        ) : null}
        </div>
        ) : null}

        {partnerWorkspaceView === "promos" ? (
        <div className="admin-business-block admin-promo-manager">
          <div className="admin-business-block-head">
            <div>
              <h3>Промокоды сайта</h3>
              <p>Обычные скидки без партнёрских начислений.</p>
            </div>
            <span>{promoCodes.length ? `${promoCodes.length} кодов` : "Пока нет кодов"}</span>
          </div>

          <form className="admin-promo-form" onSubmit={savePromoCode}>
            <label className="field">
              <span>Промокод</span>
              <input
                value={promoCodeForm.code}
                onChange={(event) => updatePromoCodeForm("code", event.target.value)}
                placeholder="LUNCH15"
                autoComplete="off"
              />
            </label>
            <label className="field">
              <span>Скидка, %</span>
              <input
                type="number"
                min="1"
                max="90"
                value={promoCodeForm.percent}
                onChange={(event) => updatePromoCodeForm("percent", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Начало</span>
              <input
                type="date"
                value={promoCodeForm.validFrom}
                onChange={(event) => updatePromoCodeForm("validFrom", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Окончание</span>
              <input
                type="date"
                value={promoCodeForm.validUntil}
                onChange={(event) => updatePromoCodeForm("validUntil", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Каждый день с</span>
              <input
                type="time"
                value={promoCodeForm.dailyStart}
                onChange={(event) => updatePromoCodeForm("dailyStart", event.target.value)}
              />
            </label>
            <label className="field">
              <span>До</span>
              <input
                type="time"
                value={promoCodeForm.dailyEnd}
                onChange={(event) => updatePromoCodeForm("dailyEnd", event.target.value)}
              />
            </label>
            <details className="admin-promo-rules" open={editingPromoCodeId ? true : undefined}>
              <summary>
                <Settings2 size={16} />
                <span>
                  <b>Ограничения промокода</b>
                  <small>
                    Необязательно · {getPromoRuleSummary(promoCodeForm)}
                    {promoCodeForm.usageLimit ? ` · лимит ${promoCodeForm.usageLimit}` : " · без лимита"}
                  </small>
                </span>
              </summary>
              <div className="admin-promo-rules-grid">
                <label className="field admin-promo-scope-field">
                  <span>На что действует</span>
                  <select
                    value={promoCodeForm.scopeType}
                    onChange={(event) => updatePromoCodeForm("scopeType", event.target.value)}
                  >
                    <option value="all">На всё меню</option>
                    <option value="categories">Только на категории</option>
                    <option value="products">Только на блюда</option>
                  </select>
                </label>
                <label className="field">
                  <span>Всего использований</span>
                  <input
                    type="number"
                    min="1"
                    value={promoCodeForm.usageLimit}
                    onChange={(event) => updatePromoCodeForm("usageLimit", event.target.value)}
                    placeholder="Без лимита"
                  />
                </label>
                <label className="field">
                  <span>На одного гостя</span>
                  <input
                    type="number"
                    min="1"
                    value={promoCodeForm.perCustomerLimit}
                    onChange={(event) => updatePromoCodeForm("perCustomerLimit", event.target.value)}
                    placeholder="Без лимита"
                  />
                </label>
                <label className="field">
                  <span>Заказ от, ₽</span>
                  <input
                    type="number"
                    min="1"
                    value={promoCodeForm.minimumOrderAmount}
                    onChange={(event) => updatePromoCodeForm("minimumOrderAmount", event.target.value)}
                    placeholder="Любая сумма"
                  />
                </label>
                <label className="field">
                  <span>Макс. скидка, ₽</span>
                  <input
                    type="number"
                    min="1"
                    value={promoCodeForm.maximumDiscountAmount}
                    onChange={(event) => updatePromoCodeForm("maximumDiscountAmount", event.target.value)}
                    placeholder="Без ограничения"
                  />
                </label>
              </div>

              <div className="admin-promo-rule-selection admin-promo-weekday-selection">
                <div>
                  <b>Дни недели</b>
                  <span>{promoCodeForm.weekdays.length ? `Выбрано: ${promoCodeForm.weekdays.length}` : "Не выбрано = каждый день"}</span>
                </div>
                <div className="admin-promo-category-options">
                  {PROMO_WEEKDAY_OPTIONS.map((day) => (
                    <label key={day.value} title={day.label}>
                      <input
                        type="checkbox"
                        checked={promoCodeForm.weekdays.includes(day.value)}
                        onChange={() => togglePromoRuleId("weekdays", day.value)}
                      />
                      <span>{day.short}</span>
                    </label>
                  ))}
                </div>
              </div>

              {promoCodeForm.scopeType === "categories" ? (
                <div className="admin-promo-rule-selection">
                  <div>
                    <b>Категории</b>
                    <span>Выбрано: {promoCodeForm.categoryIds.length}</span>
                  </div>
                  <div className="admin-promo-category-options">
                    {activeCatalogCategories.map((category) => (
                      <label key={category.id}>
                        <input
                          type="checkbox"
                          checked={promoCodeForm.categoryIds.includes(category.id)}
                          onChange={() => togglePromoRuleId("categoryIds", category.id)}
                        />
                        <span>{category.shortTitle || category.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {promoCodeForm.scopeType === "products" ? (
                <div className="admin-promo-rule-selection">
                  <div>
                    <b>Блюда</b>
                    <span>Выбрано: {promoCodeForm.productIds.length}</span>
                  </div>
                  <input
                    className="admin-promo-product-search"
                    type="search"
                    value={promoProductSearch}
                    onChange={(event) => setPromoProductSearch(event.target.value)}
                    placeholder="Найти блюдо"
                  />
                  <div className="admin-promo-product-options">
                    {filteredPromoProducts.map((product) => (
                      <label key={product.id}>
                        <input
                          type="checkbox"
                          checked={promoCodeForm.productIds.includes(product.id)}
                          onChange={() => togglePromoRuleId("productIds", product.id)}
                        />
                        <span>
                          <b>{product.name}</b>
                          <small>
                            {getCatalogCategoryLabel(
                              activeCatalogCategories,
                              product.categoryId || product.category
                            )}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </details>
            <label className="field admin-promo-comment-field">
              <span>Внутренний комментарий</span>
              <input
                value={promoCodeForm.internalComment}
                onChange={(event) => updatePromoCodeForm("internalComment", event.target.value)}
                placeholder="Например: акция на обеды в будни"
                maxLength={500}
              />
            </label>
            <div className="admin-promo-form-actions">
              <button className="admin-form-action" type="submit" disabled={promoCodeLoading}>
                {editingPromoCodeId ? <Save size={16} /> : <Plus size={16} />}
                {promoCodeLoading
                  ? "Сохраняем..."
                  : editingPromoCodeId
                    ? "Сохранить"
                    : "Добавить"}
              </button>
              {editingPromoCodeId ? (
                <button className="admin-subtle-action" type="button" onClick={resetPromoCodeForm}>
                  <X size={16} />
                  Отмена
                </button>
              ) : null}
            </div>
          </form>
          {promoCodeStatus ? <div className="admin-push-status">{promoCodeStatus}</div> : null}

          <div className="admin-promo-list">
            {promoCodes.length ? (
              promoCodes.map((promoCode) => (
                <article className="admin-promo-card" key={promoCode.id}>
                  <div className="admin-promo-code-main">
                    <div>
                      <b>{promoCode.code}</b>
                      <span className={`admin-promo-state is-${promoCode.availability?.state || promoCode.status}`}>
                        {promoCode.availability?.label || (promoCode.status === "active" ? "Действует" : "Отключён")}
                      </span>
                    </div>
                    <strong>−{promoCode.percent}%</strong>
                  </div>
                  <div className="admin-promo-schedule">
                    <span><Clock size={15} />{formatPromoDateRange(promoCode)}</span>
                    <span>{formatPromoDailyRange(promoCode)}</span>
                    <span>{getPromoRuleSummary(promoCode)}</span>
                    <span>
                      {promoCode.usageLimit
                        ? `${Number(promoCode.usageCount || 0)} оплачено${
                            promoCode.reservedCount ? ` · ${promoCode.reservedCount} в оплате` : ""
                          } · лимит ${promoCode.usageLimit}`
                        : "Использования без лимита"}
                      {promoCode.perCustomerLimit ? ` · до ${promoCode.perCustomerLimit} на гостя` : ""}
                    </span>
                    {promoCode.minimumOrderAmount || promoCode.maximumDiscountAmount ? (
                      <span>
                        {promoCode.minimumOrderAmount
                          ? `Заказ от ${formatPrice(promoCode.minimumOrderAmount)} ₽`
                          : "Любая сумма"}
                        {promoCode.maximumDiscountAmount
                          ? ` · скидка до ${formatPrice(promoCode.maximumDiscountAmount)} ₽`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                  <p>{promoCode.internalComment || "Без внутреннего комментария"}</p>
                  <div className="admin-promo-card-actions">
                    <button type="button" onClick={() => editPromoCode(promoCode)}>
                      <Pencil size={15} />
                      Править
                    </button>
                    <button
                      type="button"
                      className={promoCode.status === "active" ? "is-danger" : "is-success"}
                      disabled={promoCodeLoading}
                      onClick={() => togglePromoCode(promoCode)}
                    >
                      {promoCode.status === "active" ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      {promoCode.status === "active" ? "Отключить" : "Включить"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-empty compact">
                <Tags size={28} />
                <h3>Обычных промокодов пока нет</h3>
                <p>Добавьте код, скидку и при необходимости ограничьте даты и часы действия.</p>
              </div>
            )}
          </div>
        </div>
        ) : null}
      </section>
      ) : null}
    </main>
  );
}
