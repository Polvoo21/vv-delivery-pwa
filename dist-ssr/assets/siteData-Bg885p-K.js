import { M as MENU, a as MENU_CATEGORIES, i as isPublicMenuCategory } from "./config-DkuDoHBX.js";
import "../home-ssr.js";
const ASSET = "/assets/site/";
const TEST_CARD_IMAGE = `${ASSET}product-photo-placeholder.png`;
const EMPTY_CART_IMAGE = "/assets/empty-cart-visual-vv.png";
const categoryTabs = MENU_CATEGORIES.filter((category) => isPublicMenuCategory(category.id)).map((category) => ({
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
    description: "Итальянская пицца на тесте с долгой ферментацией, румяным бортом и понятными начинками для всей семьи."
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
const siteMenuCategories = siteMenuOrder.map((id) => {
  const baseCategory = id === "combo" ? comboCategory : categoryById[id];
  if (!baseCategory) return null;
  return {
    ...baseCategory,
    ...siteCategoryOverrides[id]
  };
}).filter(Boolean);
[
  {
    id: "combo-family-pizza",
    category: "combo",
    name: "Семейное комбо из 3 пицц",
    description: "Три пиццы на компанию: классика, пепперони и фирменная пицца.",
    weight: "3 пиццы",
    price: 1890,
    badges: [],
    image: TEST_CARD_IMAGE,
    comboItems: ["signature-vv-pizza", "margarita", "pepperoni"].map((id) => MENU.find((product) => product.id === id)).filter(Boolean)
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
    comboItems: ["margarita", "pepperoni"].map((id) => MENU.find((product) => product.id === id)).filter(Boolean)
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
    comboItems: ["kids-margarita-pizza", "kids-ham-pizza", "parmesan-focaccia"].map((id) => MENU.find((product) => product.id === id)).filter(Boolean)
  }
];
const menuByCategory = siteMenuCategories.map((category) => ({
  ...category,
  items: MENU.filter((item) => item.category === category.id)
}));
MENU.filter((item) => item.featured).slice(0, 4);
MENU.filter((item) => ["drink", "dessert", "starter"].includes(item.category)).slice(0, 4);
function getSiteHomePath() {
  if (typeof window === "undefined") return "/";
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal || window.location.pathname.startsWith("/dev") ? "/dev" : "/";
}
function getCategoryVisual(categoryId) {
  return categoryVisuals[categoryId] || categoryVisuals.pizza;
}
export {
  EMPTY_CART_IMAGE as E,
  TEST_CARD_IMAGE as T,
  getCategoryVisual as a,
  getSiteHomePath as g,
  menuByCategory as m
};
