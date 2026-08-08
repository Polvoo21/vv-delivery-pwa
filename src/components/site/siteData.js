import { Baby, CakeSlice, CalendarCheck, ChefHat, Coffee, Pizza, Salad, ShoppingBag, Users } from "lucide-react";
import { RESTAURANT } from "../../data/config";
import { MENU, MENU_CATEGORIES, isPublicMenuCategory } from "../../data/menu";
import { BUSINESS_PROFILES } from "../../../shared/site-profiles.js";

export const DELIVERY_URL = "/checkout";
export const PARTNERS_URL = "/partners";
export const PHONE = RESTAURANT.phone;
export const SOCIAL_LINKS = BUSINESS_PROFILES;

export const ASSET = "/assets/site/";
export const TEST_CARD_IMAGE = `${ASSET}product-photo-placeholder.png`;
export const NEWS_RIBBON_IMAGE = `${ASSET}news-chicken.png`;
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

export const categoryTabs = MENU_CATEGORIES
  .filter((category) => isPublicMenuCategory(category.id))
  .map((category) => ({
    id: category.id,
    label: category.shortTitle || category.title,
    title: category.title,
    description: category.description
  }));

const comboCategory = {
  id: "combo",
  label: "Комбо",
  title: "Комбо из пицц",
  description: "Собрали семейные наборы из главных пицц. Для заказа откройте доставку и выберите состав."
};

const siteCategoryOverrides = {
  pizza: {
    label: "Пиццы",
    title: "Пиццы",
    description:
      "Итальянская пицца на тесте с долгой ферментацией, румяным бортом и понятными начинками для всей семьи."
  },
  summer: {
    label: "Летнее",
    title: "Летнее меню",
    description: "Сезонное меню 2026: салаты, окрошка, поке, лепешки, клубничный суп и лимонад."
  },
  "breakfast-addon": {
    label: "К завтраку"
  },
  main: {
    label: "Горячее",
    title: "Горячее"
  }
};

const siteMenuOrder = [
  "summer",
  "pizza",
  "breakfast",
  "breakfast-addon",
  "kids",
  "soup",
  "main",
  "pasta",
  "salad",
  "starter",
  "dumplings",
  "waffle",
  "side",
  "bread",
  "dessert",
  "drink"
];

const categoryById = Object.fromEntries(categoryTabs.map((category) => [category.id, category]));

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

export const categoryIcons = {
  starter: Salad,
  combo: ShoppingBag,
  breakfast: Coffee,
  "breakfast-addon": Coffee,
  summer: Salad,
  salad: Salad,
  soup: Coffee,
  main: ChefHat,
  side: ChefHat,
  pasta: ChefHat,
  dumplings: ChefHat,
  pizza: Pizza,
  waffle: Coffee,
  kids: Baby,
  bread: ChefHat,
  dessert: CakeSlice,
  drink: Coffee
};

export const newsRibbonItems = [
  {
    title: "Новинка: три новых завтрака",
    image: `${ASSET}news-three-breakfasts.webp`,
    href: "#menu"
  },
  { title: "Детское меню за стеклом", image: `${ASSET}news-kids-room.webp`, href: "#kids" },
  { title: "Завтраки с 9:00", image: `${ASSET}concept-breakfast.webp`, href: "#menu" },
  { title: "Бизнес-ланчи каждый день", image: `${ASSET}news-business-lunch.webp`, href: "#menu" },
  { title: "Праздники и банкеты", image: `${ASSET}concept-birthday.jpg`, href: "#events" },
  { title: "Десерты к кофе", image: `${ASSET}concept-cake.webp`, href: "#dessert" }
];

export const storyCards = [
  {
    icon: Pizza,
    title: "Итальянское тесто",
    text: "Ферментация 48 часов, пышный леопардовый борт.",
    image: `${ASSET}concept-pizza-table.webp`
  },
  {
    icon: ChefHat,
    title: "Morello Forni",
    text: "Печь для живого огня и ровной корочки пиццерии.",
    image: `${ASSET}concept-oven.webp`
  },
  {
    icon: Baby,
    title: "Детская за стеклом",
    text: "Родители отдыхают и видят ребенка из зала.",
    image: `${ASSET}concept-kids-zone.webp`
  },
  {
    icon: Coffee,
    title: "Завтраки и ланчи",
    text: "Кофе, вафли, обеды и понятное меню на каждый день.",
    image: `${ASSET}concept-breakfast.webp`
  }
];

export const eventCards = [
  {
    icon: CakeSlice,
    title: "Детские праздники",
    text: "Пицца, десерты, спокойный зал и детская зона за стеклом."
  },
  {
    icon: Users,
    title: "Семейные встречи",
    text: "Большие столы, понятное меню и формат, где удобно с детьми."
  },
  {
    icon: CalendarCheck,
    title: "Банкетный зал",
    text: "Поможем собрать меню под день рождения, выпускной или небольшой праздник."
  }
];

export const proofPoints = [
  { value: RESTAURANT.workHours, label: "работаем каждый день" },
  { value: "Пирогова, 1Т", label: "самовывоз и зал" },
  { value: "3 сценария", label: "зал, доставка, праздники" }
];

export const siteMenuCategories = siteMenuOrder
  .map((id) => {
    const baseCategory = id === "combo" ? comboCategory : categoryById[id];
    if (!baseCategory) return null;
    return {
      ...baseCategory,
      ...siteCategoryOverrides[id]
    };
  })
  .filter(Boolean);

export const siteVisibleCategories = siteMenuCategories.slice(0, 8);
export const siteHiddenCategories = siteMenuCategories.slice(8);

export const siteComboItems = [
  {
    id: "combo-family-pizza",
    category: "combo",
    name: "Семейное комбо из 3 пицц",
    description: "Три пиццы на компанию: классика, пепперони и фирменная пицца.",
    weight: "3 пиццы",
    price: 1890,
    badges: [],
    image: TEST_CARD_IMAGE,
    comboItems: ["signature-vv-pizza", "margarita", "pepperoni"]
      .map((id) => MENU.find((product) => product.id === id))
      .filter(Boolean)
  },
  {
    id: "combo-date-pizza",
    category: "combo",
    name: "Комбо на двоих",
    description: "Две пиццы и напиток к ужину дома или самовывозу.",
    weight: "2 пиццы",
    price: 1290,
    badges: [],
    image: TEST_CARD_IMAGE,
    comboItems: ["margarita", "pepperoni"]
      .map((id) => MENU.find((product) => product.id === id))
      .filter(Boolean)
  },
  {
    id: "combo-kids-party",
    category: "combo",
    name: "Комбо для детского праздника",
    description: "Пиццы, фокачча и понятные вкусы для детского стола.",
    weight: "для праздника",
    price: 2290,
    badges: [],
    image: TEST_CARD_IMAGE,
    comboItems: ["kids-margarita-pizza", "kids-ham-pizza", "parmesan-focaccia"]
      .map((id) => MENU.find((product) => product.id === id))
      .filter(Boolean)
  }
];

export const siteMenuHighlights = [
  {
    label: "",
    title: "Семейное комбо из 3 пицц",
    subtitle: "Три большие пиццы для дома, гостей или долгого воскресного ужина.",
    price: siteComboItems[0].price,
    image: TEST_CARD_IMAGE,
    product: siteComboItems[0],
    tone: "blue",
    featured: true
  },
  {
    label: "",
    title: "Комбо на день рождения",
    subtitle: "Пиццы, фокачча и понятные вкусы для детского стола.",
    price: siteComboItems[2].price,
    image: TEST_CARD_IMAGE,
    product: siteComboItems[2],
    tone: "green"
  },
  {
    label: "",
    title: "Комбо на двоих",
    subtitle: "Две пиццы и напиток для спокойного вечера без готовки.",
    price: siteComboItems[1].price,
    image: TEST_CARD_IMAGE,
    product: siteComboItems[1],
    tone: "neutral"
  }
];

export const menuByCategory = siteMenuCategories.map((category) => ({
  ...category,
  items: MENU.filter((item) => item.category === category.id)
}));

export const featuredItems = MENU.filter((item) => item.featured).slice(0, 4);
export const cartUpsellItems = MENU.filter((item) => ["drink", "dessert", "starter"].includes(item.category)).slice(0, 4);

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
  const normalizedPath = String(path || "/").startsWith("/")
    ? String(path || "/")
    : `/${path}`;
  return getSiteHomePath() === "/dev" ? `/dev${normalizedPath}` : normalizedPath;
}

export function getSiteOrderPath() {
  return `${getSiteHomePath()}#menu`;
}

export function getCategoryVisual(categoryId) {
  return categoryVisuals[categoryId] || categoryVisuals.pizza;
}
