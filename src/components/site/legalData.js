import { RESTAURANT } from "../../data/config";

export const LEGAL_ENTITY = {
  name: "ООО «АвтоТехнологии»",
  inn: "2130140563",
  kpp: "213001001",
  ogrn: "1142130009735",
  email: "Avtotex2014@mail.ru",
  legalAddress: "428033, Чувашская Республика, г. Чебоксары, ул. Пирогова, 1Т",
  pizzeriaAddress: RESTAURANT.address,
  phone: RESTAURANT.phone,
  updatedAt: "30.07.2026"
};

export const legalDocuments = [
  {
    id: "requisites",
    path: "/legal",
    title: "Правовая информация",
    shortTitle: "Правовая информация",
    lead: "Реквизиты, контакты и основная информация о семейной пиццерии «Вместе Вкуснее»."
  },
  {
    id: "user-agreement",
    path: "/legal/user-agreement",
    title: "Пользовательское соглашение",
    shortTitle: "Пользовательское соглашение",
    lead: "Правила использования сайта, доставки, личного кабинета и отзывов."
  },
  {
    id: "offer",
    path: "/legal/offer",
    title: "Публичная оферта",
    shortTitle: "Публичная оферта",
    lead: "Условия заказа блюд, доставки, самовывоза и оплаты."
  },
  {
    id: "delivery-payment",
    path: "/legal/delivery-payment",
    title: "Доставка, оплата и возврат",
    shortTitle: "Доставка и возврат",
    lead: "Как оформить заказ, получить блюда и вернуть оплату при отмене или ошибке."
  },
  {
    id: "privacy",
    path: "/legal/privacy",
    title: "Политика обработки персональных данных",
    shortTitle: "Политика ПДн",
    lead: "Как сайт обрабатывает данные гостей, заказы, cookies, отзывы и обращения."
  },
  {
    id: "personal-data",
    path: "/legal/personal-data",
    title: "Согласие на обработку персональных данных",
    shortTitle: "Персональные данные",
    lead: "Согласие гостя на обработку данных при заказе, бронировании или обращении."
  },
  {
    id: "cookies",
    path: "/legal/cookies",
    title: "Политика cookies",
    shortTitle: "Cookies",
    lead: "Какие технические данные использует сайт и как они помогают работе доставки."
  },
  {
    id: "advertising-consent",
    path: "/legal/advertising-consent",
    title: "Согласие на рекламные сообщения",
    shortTitle: "Рекламные сообщения",
    lead: "Отдельное согласие на акции, новости, промокоды и специальные предложения."
  },
  {
    id: "e-receipts",
    path: "/legal/e-receipts",
    title: "Электронные чеки",
    shortTitle: "Электронные чеки",
    lead: "Как гость получает кассовый чек при онлайн-оплате и заказе доставки."
  },
  {
    id: "loyalty",
    path: "/legal/loyalty",
    title: "Правила бонусов и промокодов",
    shortTitle: "Бонусы и промокоды",
    lead: "Текущий статус бонусной системы, правила промокодов и партнерских скидок."
  },
  {
    id: "partners",
    path: "/legal/partners",
    title: "Правила партнёрской программы",
    shortTitle: "Партнёры",
    lead: "Как работают личные промокоды партнёров, скидки гостей и партнёрские начисления."
  },
  {
    id: "reviews",
    path: "/legal/reviews",
    title: "Правила отзывов",
    shortTitle: "Отзывы",
    lead: "Как гости оставляют оценки, тексты и фотографии к заказанным блюдам."
  },
  {
    id: "nutrition",
    path: "/legal/nutrition",
    title: "Калорийность и состав",
    shortTitle: "Калорийность и состав",
    lead: "Информация о составе блюд, аллергенах и актуальности меню."
  }
];

export function getLegalDocument(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/legal";
  return legalDocuments.find((document) => document.path === normalizedPath) || legalDocuments[0];
}
