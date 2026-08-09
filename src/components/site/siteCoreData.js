import { RESTAURANT } from "../../data/restaurant";
import { BUSINESS_PROFILES } from "../../../shared/site-profiles.js";

export const DELIVERY_URL = "/checkout";
export const PARTNERS_URL = "/partners";
export const PHONE = RESTAURANT.phone;
export const SOCIAL_LINKS = BUSINESS_PROFILES;
export const ASSET = "/assets/site/";
export const TEST_CARD_IMAGE = `${ASSET}product-photo-placeholder.png`;
export const EMPTY_CART_IMAGE = "/assets/empty-cart-visual-vv.png";
export const DELIVERY_STORAGE_KEY = "vv_delivery_mvp_state";
export const CART_DRAWER_EXIT_MS = 340;

export { RESTAURANT };

export const headerLinks = [
  { label: "Работа Вместе Вкуснее", href: "#contacts" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
  { label: "Корпоративные заказы", href: "#events" },
  { label: "Банкеты, праздники, дни рождения", href: "#events" },
  { label: "Сертификаты", href: "#contacts" },
  { label: "Потеряшки", href: "/lost" },
  { label: "Акции", href: "#menu" }
];

export const categoryVisuals = {
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

export const emptyCartSummary = {
  cart: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  total: 0,
  discountState: { active: false, percent: 0 }
};

export function telHref(phone) {
  return `tel:${phone.replace(/\D/g, "")}`;
}

export function pluralRu(value, one, few, many) {
  const number = Math.abs(Number(value) || 0);
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function getSiteHomePath() {
  if (typeof window === "undefined") return "/";
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal || window.location.pathname.startsWith("/dev") ? "/dev" : "/";
}

export function getSitePagePath(path) {
  const normalizedPath = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`;
  return getSiteHomePath() === "/dev" ? `/dev${normalizedPath}` : normalizedPath;
}

export function getSiteOrderPath() {
  return `${getSiteHomePath()}#menu`;
}

export function getCategoryVisual(categoryId) {
  return categoryVisuals[categoryId] || categoryVisuals.pizza;
}
