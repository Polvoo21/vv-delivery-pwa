import { DELIVERY_MIN_ORDER_AMOUNT } from "./order-rules.js";
import {
  getMasterclassEventByPath,
  getNextMasterclassEvent,
  INDIVIDUAL_MASTERCLASS_PAGE,
  INDIVIDUAL_MASTERCLASS_PATH,
  MASTERCLASS_EVENTS,
  MASTERCLASSES_PATH,
  SITE_ORIGIN
} from "./masterclass-events.js";
import { getRouteRedirect, normalizeRoutePath } from "./site-routes.js";
import { BUSINESS_PROFILES, BUSINESS_PROFILE_URLS } from "./site-profiles.js";

export const SITE_ENTITY = Object.freeze({
  name: "Вместе Вкуснее",
  legalName: "ООО «АвтоТехнологии»",
  taxId: "2130140563",
  registrationId: "1142130009735",
  kpp: "213001001",
  url: SITE_ORIGIN,
  logoUrl: `${SITE_ORIGIN}/assets/site/vv-logo-full.svg`,
  imageUrl: `${SITE_ORIGIN}/assets/social/og-default-1200x630.jpg`,
  telephone: "+7 (8352) 66-77-77",
  email: "Avtotex2014@mail.ru",
  address: Object.freeze({
    postalCode: "428033",
    addressRegion: "Чувашская Республика — Чувашия",
    addressLocality: "Чебоксары",
    streetAddress: "улица Пирогова, 1Т",
    addressCountry: "RU"
  }),
  geo: Object.freeze({ latitude: 56.140976, longitude: 47.223716 }),
  openingHours: Object.freeze({ opens: "09:00", closes: "22:00" }),
  servesCuisine: Object.freeze([
    "Итальянская кухня",
    "Европейская кухня",
    "Русская кухня"
  ]),
  menuUrl: `${SITE_ORIGIN}/#menu`,
  orderUrl: `${SITE_ORIGIN}/checkout`,
  mapUrl: BUSINESS_PROFILES.yandexMaps,
  profiles: BUSINESS_PROFILES,
  sameAs: BUSINESS_PROFILE_URLS
});

const HOME_CRUMB = Object.freeze({ name: "Вместе Вкуснее", path: "/" });
const MASTERCLASSES_CRUMB = Object.freeze({ name: "Мастер-классы", path: MASTERCLASSES_PATH });
const LEGAL_CRUMB = Object.freeze({ name: "Правовая информация", path: "/legal" });

const COMMON_LINKS = Object.freeze([
  { label: "Меню пиццерии", href: "/#menu" },
  { label: "Доставка и самовывоз", href: "/dostavka" },
  { label: "Зоны доставки", href: "/delivery-zones" },
  { label: "Мастер-классы", href: MASTERCLASSES_PATH },
  { label: "Контакты", href: "/#contacts" }
]);

const CORE_PAGES = [
  {
    path: "/",
    title: "Вместе Вкуснее | Семейная пиццерия",
    description:
      "Семейная пиццерия «Вместе Вкуснее» в Чебоксарах: итальянская пицца, завтраки, бизнес-ланчи, детская зона, доставка и самовывоз.",
    h1: "Семейная итальянская пиццерия в Чебоксарах",
    intro:
      "«Вместе Вкуснее» на Пирогова, 1Т — семейная пиццерия с итальянской пиццей, завтраками, бизнес-ланчами, праздниками, доставкой и самовывозом.",
    imagePath: "/assets/social/og-default-1200x630.jpg",
    imageAlt: "Итальянская пицца в семейной пиццерии «Вместе Вкуснее»",
    schemaType: "WebPage",
    answers: [
      {
        heading: "Где находится пиццерия и когда она работает?",
        answer:
          "Мы находимся в Чебоксарах по адресу улица Пирогова, 1Т. Пиццерия работает ежедневно с 09:00 до 22:00, телефон +7 (8352) 66-77-77."
      },
      {
        heading: "Можно ли заказать доставку или самовывоз?",
        answer:
          `Да. Бесплатная доставка доступна в отмеченной зоне при заказе от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок. Самовывоз с Пирогова, 1Т доступен без минимальной суммы.`
      },
      {
        heading: "Какие услуги доступны?",
        answer:
          "В пиццерии можно поесть в зале, оформить доставку или самовывоз, записаться на кулинарный мастер-класс и обсудить семейный праздник."
      }
    ],
    breadcrumbs: [],
    links: COMMON_LINKS
  },
  {
    path: "/gallery",
    title: "Галерея | Вместе Вкуснее",
    description:
      "Фотографии и видео семейной пиццерии «Вместе Вкуснее» в Чебоксарах: зал, детская зона, блюда, праздники и мастер-классы.",
    h1: "Фотографии и видео пиццерии",
    intro:
      "Галерея зала, детской зоны, блюд, праздников и мастер-классов семейной пиццерии «Вместе Вкуснее» в Чебоксарах.",
    imagePath: "/assets/social/og-gallery-1200x630.jpg",
    imageAlt: "Интерьер семейной пиццерии «Вместе Вкуснее»",
    schemaType: "CollectionPage",
    breadcrumbs: [HOME_CRUMB, { name: "Галерея", path: "/gallery" }],
    links: [
      { label: "На главную", href: "/" },
      { label: "Посмотреть меню", href: "/#menu" },
      { label: "Мастер-классы", href: MASTERCLASSES_PATH }
    ]
  },
  {
    path: "/dostavka",
    title: "Доставка пиццы и еды в Чебоксарах | Вместе Вкуснее",
    description:
      `Доставка пиццы и блюд «Вместе Вкуснее» по Чебоксарам: бесплатно от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок. Самовывоз с Пирогова, 1Т без минимальной суммы.`,
    h1: "Доставка пиццы и еды в Чебоксарах",
    intro:
      `Закажите блюда «Вместе Вкуснее» онлайн. Доставка по доступной зоне бесплатна от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок, а самовывоз с Пирогова, 1Т доступен без минимальной суммы.`,
    imagePath: "/assets/social/og-delivery-1200x630.jpg",
    imageAlt: "Пицца для доставки из семейной пиццерии «Вместе Вкуснее»",
    schemaType: "Service",
    serviceType: "Доставка еды и самовывоз",
    answers: [
      {
        heading: "Сколько стоит доставка?",
        answer:
          `Доставка бесплатная при сумме заказа от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после применения скидок. Отдельной платы за доставку в доступной зоне нет.`
      },
      {
        heading: "Есть ли минимальная сумма для самовывоза?",
        answer:
          "Нет. Самовывоз можно оформить на любую сумму и забрать по адресу Чебоксары, улица Пирогова, 1Т."
      },
      {
        heading: "Как узнать, доставляете ли вы по моему адресу?",
        answer:
          "Откройте карту зон или укажите адрес при оформлении заказа. Сайт сразу проверит адрес и покажет доступный способ получения."
      },
      {
        heading: "В какое время можно заказать?",
        answer:
          "Пиццерия работает ежедневно с 09:00 до 22:00. Доступные интервалы и точное время получения показываются при оформлении заказа."
      }
    ],
    breadcrumbs: [HOME_CRUMB, { name: "Доставка и самовывоз", path: "/dostavka" }],
    links: [
      { label: "Открыть меню", href: "/#menu" },
      { label: "Проверить зоны доставки", href: "/delivery-zones" },
      { label: "Оформить заказ", href: "/checkout" }
    ]
  },
  {
    path: "/delivery-zones",
    title: "Зоны доставки | Вместе Вкуснее",
    description:
      `Актуальные зоны доставки «Вместе Вкуснее» по Чебоксарам. Бесплатная доставка от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок, самовывоз с Пирогова, 1Т.`,
    h1: "Актуальные зоны доставки",
    intro:
      `Показываем районы Чебоксар, куда привозим заказы. Доставка бесплатная от ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок, самовывоз доступен без минимальной суммы.`,
    imagePath: "/assets/social/og-delivery-1200x630.jpg",
    imageAlt: "Доставка блюд семейной пиццерии «Вместе Вкуснее»",
    schemaType: "WebPage",
    answers: [
      {
        heading: "Куда доставляет «Вместе Вкуснее»?",
        answer:
          "Мы доставляем по отмеченным на карте районам Чебоксар. Окончательная доступность определяется по адресу при оформлении заказа."
      },
      {
        heading: "Какая минимальная сумма заказа?",
        answer:
          `Для доставки нужно заказать минимум на ${DELIVERY_MIN_ORDER_AMOUNT.toLocaleString("ru-RU")} ₽ после скидок. Для самовывоза минимальной суммы нет.`
      },
      {
        heading: "Могут ли зоны меняться?",
        answer:
          "Да. Доступность может временно меняться из-за загрузки кухни, погоды и дорожной обстановки; актуальная проверка выполняется при вводе адреса."
      }
    ],
    breadcrumbs: [HOME_CRUMB, { name: "Зоны доставки", path: "/delivery-zones" }],
    links: [
      { label: "Посмотреть меню", href: "/#menu" },
      { label: "Оформить заказ", href: "/checkout" },
      { label: "Контакты пиццерии", href: "/#contacts" }
    ]
  },
  {
    path: "/lost",
    title: "Потеряшки | Вместе Вкуснее",
    description:
      "Забытые вещи в пиццерии «Вместе Вкуснее» на Пирогова, 1Т в Чебоксарах. Посмотрите фотографии и свяжитесь с нами, если узнали свою вещь.",
    h1: "Забытые вещи в пиццерии",
    intro:
      "Мы бережно храним забытые вещи три месяца с даты публикации. Посмотрите фотографии и свяжитесь с нами, если узнали свою вещь.",
    imagePath: "/assets/social/og-default-1200x630.jpg",
    imageAlt: "Зал пиццерии «Вместе Вкуснее», где хранят найденные вещи",
    schemaType: "CollectionPage",
    breadcrumbs: [HOME_CRUMB, { name: "Потеряшки", path: "/lost" }],
    links: [
      { label: "На главную", href: "/" },
      { label: "Связаться с пиццерией", href: "/#contacts" },
      { label: "Правовая информация", href: "/legal" }
    ]
  },
  {
    path: "/bez-perchatok",
    title: "Почему мы готовим без перчаток | Вместе Вкуснее",
    description:
      "Как в «Вместе Вкуснее» организована гигиена кухни: мытьё рук, чистый инвентарь, термообработка и случаи, когда сотрудники используют перчатки.",
    h1: "Почему мы готовим пиццу без перчаток?",
    intro:
      "Для приготовления пиццы важны чистые руки, дисциплина кухни, чистый инвентарь и горячая печь. Перчатки используем там, где они действительно нужны.",
    imagePath: "/assets/social/og-kitchen-1200x630.jpg",
    imageAlt: "Пицца рядом с горячей печью в «Вместе Вкуснее»",
    schemaType: "Article",
    dateModified: "2026-08-08",
    answers: [
      {
        heading: "Разрешено ли готовить пиццу без перчаток?",
        answer:
          "Санитарные правила требуют перчатки для порционирования готовых блюд, холодных закусок и салатов. Для работы с тестом до выпекания ключевыми остаются гигиена рук, чистый инвентарь и соблюдение технологического процесса."
      },
      {
        heading: "Когда сотрудники используют перчатки?",
        answer:
          "Перчатки используются при работе с готовыми холодными блюдами, порционировании и сервировке, а также при повреждении кожи, уборке и работе с химией."
      },
      {
        heading: "На какие документы мы ссылаемся?",
        answer:
          "На СанПиН 2.3/2.4.3590-20 и разъяснения Роспотребнадзора о личной гигиене работников общественного питания."
      }
    ],
    sources: [
      {
        label: "СанПиН 2.3/2.4.3590-20 на официальном портале правовой информации",
        href: "https://publication.pravo.gov.ru/document/view/0001202011120001"
      },
      {
        label: "Рекомендации Роспотребнадзора для предприятий общественного питания",
        href: "https://zpp.rospotrebnadzor.ru/news/federal/574818"
      }
    ],
    breadcrumbs: [HOME_CRUMB, { name: "Открыто о кухне", path: "/bez-perchatok" }],
    links: [
      { label: "Посмотреть меню", href: "/#menu" },
      { label: "Калорийность и состав", href: "/legal/nutrition" },
      { label: "Задать вопрос", href: "/#contacts" }
    ]
  }
];

const LEGAL_PAGES = [
  ["/legal", "Правовая информация", "Реквизиты, контакты и основные документы семейной пиццерии «Вместе Вкуснее» в Чебоксарах."],
  ["/legal/user-agreement", "Пользовательское соглашение", "Правила использования сайта «Вместе Вкуснее», оформления доставки, работы личного кабинета и публикации отзывов."],
  ["/legal/offer", "Публичная оферта", "Условия заказа блюд в «Вместе Вкуснее», доставки, самовывоза, оплаты, отмены и возврата денежных средств."],
  ["/legal/delivery-payment", "Доставка, оплата и возврат", "Порядок оформления и получения заказа «Вместе Вкуснее», способы оплаты, правила отмены и возврата."],
  ["/legal/privacy", "Политика обработки персональных данных", "Как сайт «Вместе Вкуснее» обрабатывает персональные данные гостей, сведения о заказах, cookies, отзывы и обращения."],
  ["/legal/personal-data", "Согласие на обработку персональных данных", "Условия согласия на обработку персональных данных при заказе, бронировании, регистрации и обращении в «Вместе Вкуснее»."],
  ["/legal/cookies", "Политика cookies", "Какие cookies и технические данные использует сайт «Вместе Вкуснее» и как они обеспечивают работу доставки и личного кабинета."],
  ["/legal/advertising-consent", "Согласие на рекламные сообщения", "Условия отдельного согласия на получение акций, новостей, промокодов и специальных предложений «Вместе Вкуснее»."],
  ["/legal/e-receipts", "Электронные чеки", "Как гости «Вместе Вкуснее» получают электронные кассовые чеки при онлайн-оплате и оформлении доставки."],
  ["/legal/loyalty", "Правила бонусов и промокодов", "Текущий статус бонусной системы, правила применения промокодов и партнёрских скидок в «Вместе Вкуснее»."],
  ["/legal/partners", "Правила партнёрской программы", "Как работают личные промокоды партнёров, скидки гостей и партнёрские начисления в программе «Вместе Вкуснее»."],
  ["/legal/reviews", "Правила отзывов", "Правила публикации гостевых оценок, текстов и фотографий к заказанным блюдам на сайте «Вместе Вкуснее»."],
  ["/legal/nutrition", "Калорийность и состав", "Информация о составе, пищевой ценности, аллергенах и актуальности данных меню семейной пиццерии «Вместе Вкуснее»." ]
].map(([path, h1, description]) => ({
  path,
  title: `${h1} | Вместе Вкуснее`,
  description,
  h1,
  intro: description,
  imagePath: "/assets/social/og-default-1200x630.jpg",
  imageAlt: "Семейная пиццерия «Вместе Вкуснее»",
  schemaType: "WebPage",
  breadcrumbs:
    path === "/legal"
      ? [HOME_CRUMB, LEGAL_CRUMB]
      : [HOME_CRUMB, LEGAL_CRUMB, { name: h1, path }],
  links: [
    { label: "Все документы", href: "/legal" },
    { label: "Доставка и оплата", href: "/legal/delivery-payment" },
    { label: "Контакты пиццерии", href: "/#contacts" }
  ]
}));

function normalizeSeoPath(pathname) {
  let normalizedPath = normalizeRoutePath(pathname);
  normalizedPath = normalizedPath.replace(/^\/dev(?=\/|$)/, "") || "/";
  normalizedPath = normalizedPath.replace(/^\/site(?=\/|$)/, "") || "/";
  return getRouteRedirect(normalizedPath)?.target || normalizedPath;
}

function finalizePage(page) {
  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  return Object.freeze({
    ...page,
    canonicalUrl,
    imageUrl: `${SITE_ORIGIN}${page.imagePath}`,
    answers: Object.freeze(
      (page.answers || []).map((item) => Object.freeze({ ...item }))
    ),
    sources: Object.freeze(
      (page.sources || []).map((item) => Object.freeze({ ...item }))
    ),
    breadcrumbs: Object.freeze(
      page.breadcrumbs.map((item) => Object.freeze({
        ...item,
          url: `${SITE_ORIGIN}${item.path}`
      }))
    ),
    links: Object.freeze(page.links.map((link) => Object.freeze({ ...link })))
  });
}

const STATIC_SEO_PAGES = new Map(
  [...CORE_PAGES, ...LEGAL_PAGES].map((page) => [page.path, finalizePage(page)])
);

function getMasterclassSeoPage(pathname) {
  if (pathname === MASTERCLASSES_PATH) {
    return finalizePage({
      path: MASTERCLASSES_PATH,
      title: "Куда сходить с ребёнком в Чебоксарах | Вместе Вкуснее",
      description:
        "Кулинарные мастер-классы для детей и взрослых в Чебоксарах. Готовим пиццу с пиццайоло: актуальные даты, стоимость и онлайн-запись.",
      h1: "Кулинарные мастер-классы для детей и взрослых в Чебоксарах",
      intro:
        "Если вы выбираете, чем заняться в Чебоксарах или куда сходить с ребёнком, приходите на кулинарный мастер-класс: готовим на настоящей кухне, учимся у пиццайоло и уходим со своей горячей пиццей.",
      imagePath: "/assets/social/og-masterclasses-1200x630.jpg",
      imageAlt: "Кулинарный мастер-класс в семейной пиццерии «Вместе Вкуснее»",
      schemaType: "CollectionPage",
      answers: [
        {
          heading: "Куда сходить с ребёнком в Чебоксарах?",
          answer:
            "На воскресном мастер-классе во «Вместе Вкуснее» дети и взрослые готовят свою пиццу вместе с пиццайоло на настоящей кухне пиццерии."
        },
        {
          heading: "Где проходят встречи?",
          answer:
            "В семейной пиццерии «Вместе Вкуснее» по адресу Чебоксары, улица Пирогова, 1Т."
        },
        {
          heading: "Как узнать дату и стоимость?",
          answer:
            "Актуальные даты и цена публикуются на странице конкретной встречи. Для отдельного праздника дату, программу и стоимость согласует администратор."
        }
      ],
      breadcrumbs: [HOME_CRUMB, MASTERCLASSES_CRUMB],
      links: [
        { label: "Индивидуальный мастер-класс", href: INDIVIDUAL_MASTERCLASS_PATH },
        { label: "Фотографии пиццерии", href: "/gallery" },
        { label: "Контакты", href: "/#contacts" }
      ]
    });
  }

  if (pathname === INDIVIDUAL_MASTERCLASS_PATH) {
    return finalizePage({
      path: INDIVIDUAL_MASTERCLASS_PATH,
      title: INDIVIDUAL_MASTERCLASS_PAGE.seoTitle,
      description: INDIVIDUAL_MASTERCLASS_PAGE.seoDescription,
      h1: "Мастер-класс по пицце на день рождения в Чебоксарах",
      intro:
        "Выберите удобный день и приходите своей компанией готовить пиццу и лимонад вместе с пиццайоло на настоящей кухне.",
      imagePath: "/assets/social/og-masterclasses-1200x630.jpg",
      imageAlt: "Ребёнок готовит пиццу вместе с пиццайоло на празднике",
      schemaType: "Service",
      serviceType: "Индивидуальный кулинарный мастер-класс",
      answers: [
        {
          heading: "Что входит в индивидуальный мастер-класс?",
          answer:
            "Участники готовят пиццу и лимонад вместе с пиццайоло на настоящей кухне. Программу уточняем под возраст и размер компании."
        },
        {
          heading: "Когда можно провести праздник?",
          answer:
            "Дату и время согласовываем индивидуально после проверки загрузки кухни и зала."
        },
        {
          heading: "Сколько стоит мастер-класс?",
          answer:
            "Итоговая стоимость зависит от даты, программы и числа участников. Администратор называет точную сумму до подтверждения записи."
        }
      ],
      breadcrumbs: [
        HOME_CRUMB,
        MASTERCLASSES_CRUMB,
        { name: "Индивидуальный мастер-класс", path: INDIVIDUAL_MASTERCLASS_PATH }
      ],
      links: [
        { label: "Все мастер-классы", href: MASTERCLASSES_PATH },
        { label: "Фотографии пиццерии", href: "/gallery" },
        { label: "Связаться с администратором", href: "/#contacts" }
      ]
    });
  }

  const event = getMasterclassEventByPath(pathname);
  if (!event) return null;
  const isCancelled = event.status === "cancelled" || event.pageMode === "archive";
  const nextEvent = getNextMasterclassEvent(event);

  return finalizePage({
    path: event.path,
    title: event.seoTitle,
    description: event.seoDescription,
    h1: isCancelled
      ? `Мастер-класс ${event.shortDateLabel} не состоялся`
      : "Мастер-класс по пицце для детей и взрослых",
    intro: isCancelled
      ? `Мастер-класс ${event.shortDateLabel} не состоялся: группа не набралась. Фотографий и видео с этой встречи не будет. На странице можно перейти к ближайшему мастер-классу с открытой записью.`
      : `На мастер-классе ${event.shortDateLabel} участники приготовят ${event.pizzaAccusative} и лимонад вместе с пиццайоло. Стоимость — ${event.pricePerParticipant.toLocaleString("ru-RU")} ₽ за участника.`,
    imagePath: "/assets/social/og-masterclasses-1200x630.jpg",
    imageAlt: "Ребёнок готовит пиццу вместе с пиццайоло",
    schemaType: "Event",
    answers: isCancelled ? [
      {
        heading: "Почему мастер-класс не состоялся?",
        answer: `На ${event.shortDateLabel} не набралось минимальное число участников, поэтому встречу отменили.`
      },
      {
        heading: "Будут ли фотографии и видео?",
        answer: "Нет. Мастер-класс не проводился, поэтому фотографий и видео с этой даты не будет."
      },
      {
        heading: "Где записаться на следующий мастер-класс?",
        answer: nextEvent
          ? `Ближайший мастер-класс пройдёт ${nextEvent.dateLabel.toLowerCase()} в ${nextEvent.timeLabel}. Ссылка на этой странице ведёт на актуальную запись.`
          : "Новые даты появятся в разделе мастер-классов."
      }
    ] : [
      {
        heading: `Куда сходить с ребёнком в Чебоксарах ${event.shortDateLabel}?`,
        answer:
          `${event.dateLabel} в ${event.timeLabel} можно прийти на мастер-класс по пицце для детей и взрослых по адресу Чебоксары, улица Пирогова, 1Т.`
      },
      {
        heading: "Сколько стоит участие?",
        answer:
          `${event.pricePerParticipant.toLocaleString("ru-RU")} ₽ за одного участника. Запись подтверждается после оплаты.`
      },
      {
        heading: "Что приготовит участник?",
        answer:
          `Каждый участник приготовит ${event.pizzaAccusative} и лимонад вместе с пиццайоло.`
      }
    ],
    breadcrumbs: [
      HOME_CRUMB,
      MASTERCLASSES_CRUMB,
      { name: event.cardTitle, path: event.path }
    ],
    links: [
      ...(nextEvent
        ? [{ label: `Записаться на ${nextEvent.shortDateLabel}`, href: nextEvent.path }]
        : []),
      { label: "Все мастер-классы", href: MASTERCLASSES_PATH },
      { label: "Индивидуальный мастер-класс", href: INDIVIDUAL_MASTERCLASS_PATH },
      { label: "Контакты", href: "/#contacts" }
    ]
  });
}

export const STATIC_SITE_SEO_PAGES = Object.freeze(Array.from(STATIC_SEO_PAGES.values()));

export const SITE_SEO_PAGES = Object.freeze([
  ...STATIC_SITE_SEO_PAGES,
  getMasterclassSeoPage(MASTERCLASSES_PATH),
  getMasterclassSeoPage(INDIVIDUAL_MASTERCLASS_PATH),
  ...MASTERCLASS_EVENTS.map((event) => getMasterclassSeoPage(event.path))
]);

const SITE_SEO_PAGE_MAP = new Map(SITE_SEO_PAGES.map((page) => [page.path, page]));

export function getSiteSeoPage(pathname = "/") {
  return SITE_SEO_PAGE_MAP.get(normalizeSeoPath(pathname)) || null;
}
