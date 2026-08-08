import { MENU_CATEGORIES, isPublicMenuCategory } from "./menu";

export const RESTAURANT = {
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

export const MAP_CONFIG = {
  defaultZoom: 13,
  pickupZoom: 16,
  deliveryZoom: 16,
  tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution: "",
  reverseGeocodeUrl: "https://nominatim.openstreetmap.org/reverse"
};

export const STORIES = [
  {
    id: "new",
    title: "Что новенького",
    accent: "🍕",
    image: "/assets/site/pizza-plate.webp",
    text: "Собираем новые блюда и обновления меню."
  },
  {
    id: "kids",
    title: "Детская зона",
    accent: "🧸",
    image: "/assets/site/kids-zone.webp",
    text: "Большая детская зона за стеклом. Родители отдыхают за столом и видят ребёнка."
  },
  {
    id: "summer",
    title: "Летнее меню",
    accent: "☀",
    image: "/assets/site/breakfast.webp",
    text: "Сезонные блюда, напитки и десерты."
  },
  {
    id: "breakfast",
    title: "Завтраки",
    accent: "☕",
    image: "/assets/site/feature-breakfast.webp",
    text: "Завтраки, кофе и свежая выпечка для спокойного начала дня."
  },
  {
    id: "gifts",
    title: "Подарки",
    accent: "🎁",
    image: "/assets/site/dessert.webp",
    text: "Акции, бонусы и приятные предложения для гостей."
  }
];

export const CATEGORY_LIST = [
  { id: "featured", title: "Для вас" },
  ...MENU_CATEGORIES
    .filter((category) => isPublicMenuCategory(category.id))
    .map((category) => ({
      id: category.id,
      title: category.shortTitle || category.title
    }))
];

export const PROMO_CODES = {
  VV25: {
    code: "VV25",
    percent: 25,
    label: "-25% по промокоду VV25"
  }
};

export const OFFER_DISCOUNT = {
  percent: 25,
  label: "-25% на первые 3 доставки"
};
