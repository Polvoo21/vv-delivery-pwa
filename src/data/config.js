export const RESTAURANT = {
  name: "Вместе Вкуснее",
  subtitle: "Семейная пиццерия",
  address: "Чебоксары, ул. Пирогова, 1Т",
  shortAddress: "Пирогова, 1Т",
  phone: "+7 (8352) 70-00-97",
  workHours: "09:00–22:00",
  coords: {
    lat: 56.1512,
    lng: 47.2014
  },
  deliveryEta: "примерно 45 мин",
  pickupEta: "15–20 мин"
};

export const MAP_CONFIG = {
  defaultZoom: 13,
  pickupZoom: 16,
  deliveryZoom: 16,
  tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  reverseGeocodeUrl: "https://nominatim.openstreetmap.org/reverse"
};

export const STORIES = [
  {
    id: "new",
    title: "Что новенького",
    accent: "🍕",
    text: "Собираем новые блюда и обновления меню."
  },
  {
    id: "kids",
    title: "Детская зона",
    accent: "🧸",
    text: "Большая детская зона за стеклом. Родители отдыхают за столом и видят ребёнка."
  },
  {
    id: "summer",
    title: "Летнее меню",
    accent: "☀",
    text: "Сезонные блюда, напитки и десерты."
  },
  {
    id: "breakfast",
    title: "Завтраки",
    accent: "☕",
    text: "Завтраки, кофе и свежая выпечка для спокойного начала дня."
  },
  {
    id: "gifts",
    title: "Подарки",
    accent: "🎁",
    text: "Акции, бонусы и приятные предложения для гостей."
  }
];

export const CATEGORY_LIST = [
  { id: "featured", title: "Для вас" },
  { id: "pizza", title: "Пицца" },
  { id: "lunch", title: "Обеды" },
  { id: "dessert", title: "Десерты" },
  { id: "drink", title: "Напитки" }
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
