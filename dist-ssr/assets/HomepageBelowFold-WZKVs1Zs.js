import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { HelpCircle, ChevronDown, Images, ArrowUpRight, Play, X, ChevronLeft, ChevronRight, MapPin, Clock, Navigation, Phone } from "lucide-react";
import { R as RESTAURANT, P as PHONE, t as telHref, S as SOCIAL_LINKS, d as PARTNERS_URL, h as getSiteOrderPath, I as INDIVIDUAL_MASTERCLASS_PATH, A as ASSET, b as apiPath, u as useBodyScrollLock, f as formatPrice } from "../home-ssr.js";
import "./config-DkuDoHBX.js";
import { D as DELIVERY_MIN_ORDER_AMOUNT } from "./order-rules-DteAI564.js";
import "react-dom/server";
const faqItems = [
  {
    question: "Где находится пиццерия?",
    answer: "Мы на Пирогова, 1Т в Чебоксарах. Можно поесть в зале, забрать заказ самовывозом или оформить доставку."
  },
  {
    question: "Как работает доставка?",
    answer: "Доставка доступна по Чебоксарам в пределах зоны. Перед оформлением заказа попросим указать адрес, чтобы проверить возможность доставки."
  },
  {
    question: "Можно забрать заказ самовывозом?",
    answer: "Да, самовывоз из пиццерии на Пирогова, 1Т. После оформления заказа подготовим блюда ко времени готовности."
  },
  {
    question: "Можно забронировать стол?",
    answer: "Да. Позвоните нам или оставьте заявку через сайт, мы уточним время, количество гостей и формат посадки."
  },
  {
    question: "Есть ли детская зона?",
    answer: "Да, у нас большая детская зона за стеклом. Родители сидят в зале и видят ребенка рядом."
  },
  {
    question: "Можно провести день рождения?",
    answer: "Да, помогаем с детскими днями рождения, семейными встречами и небольшими банкетами. Меню и формат обсуждаем заранее."
  },
  {
    question: "Во сколько вы работаете?",
    answer: `Работаем ежедневно ${RESTAURANT.workHours}. Если планируете праздник или большую компанию, лучше предупредить заранее.`
  },
  {
    question: "Какая у вас пицца?",
    answer: "Готовим итальянскую пиццу на тесте с долгой ферментацией, с румяным бортом и понятными начинками."
  },
  {
    question: "Есть завтраки и бизнес-ланчи?",
    answer: "Да, каждый день есть завтраки, обеды и ланчи. Актуальные позиции смотрите в меню."
  },
  {
    question: "Можно убрать ингредиент из блюда?",
    answer: "В карточке блюда можно отметить ингредиенты, которые нужно убрать, и выбрать доступные добавки."
  },
  {
    question: "Как оплатить заказ?",
    answer: "Заказ оплачивается онлайн на защищённой странице ЮKassa. Доступные способы оплаты будут показаны при переходе к оплате."
  },
  {
    question: "Как узнать про акции?",
    answer: "Акции и сезонные предложения появляются в верхнем блоке сайта и в разделе меню."
  }
];
function SiteFaqSection() {
  const [openItems, setOpenItems] = useState(() => /* @__PURE__ */ new Set());
  const toggleItem = (index) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  return /* @__PURE__ */ jsxs("section", { className: "site-section-v2 site-faq-section", id: "faq", "aria-labelledby": "site-faq-title", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-faq-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Частые вопросы" }),
        /* @__PURE__ */ jsx("h2", { id: "site-faq-title", children: "Ответы перед заказом и визитом" }),
        /* @__PURE__ */ jsx("p", { children: "Собрали короткие ответы про доставку, самовывоз, бронь столов, детскую зону и семейные праздники." })
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx(HelpCircle, { size: 17 }),
        faqItems.length,
        " вопросов"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "site-faq-list", children: faqItems.map((item, index) => {
      const isOpen = openItems.has(index);
      const panelId = `site-faq-answer-${index}`;
      return /* @__PURE__ */ jsxs("article", { className: `site-faq-item ${isOpen ? "is-open" : ""}`, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "site-faq-trigger",
            type: "button",
            "aria-expanded": isOpen,
            "aria-controls": panelId,
            onClick: () => toggleItem(index),
            children: [
              /* @__PURE__ */ jsx("span", { children: item.question }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 18, "aria-hidden": "true" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "site-faq-panel", id: panelId, children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: item.answer }) }) })
      ] }, item.question);
    }) })
  ] });
}
const LEGAL_ENTITY = {
  name: "ООО «АвтоТехнологии»",
  inn: "2130140563",
  kpp: "213001001",
  ogrn: "1142130009735",
  email: "Avtotex2014@mail.ru",
  legalAddress: "428033, Чувашская Республика, г. Чебоксары, ул. Пирогова, 1Т",
  phone: RESTAURANT.phone
};
const legalDocuments = [
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
const footerStats = [
  {
    value: RESTAURANT.workHours,
    label: "работаем каждый день"
  },
  {
    value: "Пирогова, 1Т",
    label: "зал, самовывоз и доставка"
  }
];
function getSiteBasePath() {
  if (typeof window === "undefined") {
    return "/";
  }
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "/dev" : "/";
}
function siteHref(hash) {
  const basePath = getSiteBasePath();
  return basePath === "/" ? `/${hash}` : `${basePath}${hash}`;
}
function sitePageHref(path) {
  const basePath = getSiteBasePath();
  return basePath === "/" ? path : `${basePath}${path}`;
}
function isExternalHref(href) {
  return /^https?:\/\//.test(href);
}
function getFooterLinkGroups() {
  return [
    {
      title: "Гостям",
      links: [
        { label: "Меню", href: siteHref("#menu") },
        { label: "Доставка и самовывоз", href: sitePageHref("/dostavka") },
        { label: "Зоны доставки", href: sitePageHref("/delivery-zones") },
        { label: "Мастер-классы", href: sitePageHref("/master-klassy") },
        {
          label: "Мастер-класс на праздник",
          href: sitePageHref(INDIVIDUAL_MASTERCLASS_PATH)
        },
        { label: "Забронировать стол", href: siteHref("#contacts") },
        { label: "Праздники и банкеты", href: siteHref("#events") },
        { label: "Потеряшки", href: sitePageHref("/lost") }
      ]
    },
    {
      title: "Документы",
      links: legalDocuments.map((document2) => ({
        label: document2.shortTitle,
        href: document2.path
      }))
    },
    {
      title: "Это интересно",
      links: [
        { label: "Почему мы готовим без перчаток?", href: "/bez-perchatok" }
      ]
    },
    {
      title: "Контакты",
      links: [
        { label: PHONE, href: telHref(PHONE) },
        { label: LEGAL_ENTITY.email, href: `mailto:${LEGAL_ENTITY.email}` },
        { label: "Чебоксары, Пирогова, 1Т", href: siteHref("#contacts") }
      ]
    }
  ];
}
function getFooterSocialLinks() {
  return [
    { label: "VK", href: SOCIAL_LINKS.vk },
    { label: "TG", href: SOCIAL_LINKS.telegram }
  ];
}
function getFooterServiceBadges() {
  return [
    { title: "Меню", caption: "открыть", href: siteHref("#menu") },
    { title: "Доставку", caption: "заказать", href: getSiteOrderPath() },
    { title: "Самовывоз", caption: "оформить", href: getSiteOrderPath() },
    { title: "Стол", caption: "забронировать", href: siteHref("#contacts") },
    { title: "Позвонить", caption: "быть на связи", href: telHref(PHONE) },
    { title: "Партнеры", caption: "кабинет", href: PARTNERS_URL }
  ];
}
function SiteFooter() {
  const footerLinkGroups = getFooterLinkGroups();
  const footerSocialLinks = getFooterSocialLinks();
  const footerServiceBadges = getFooterServiceBadges();
  return /* @__PURE__ */ jsx("footer", { className: "site-footer-v2", id: "contacts", children: /* @__PURE__ */ jsxs("div", { className: "site-footer-inner", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-footer-main", children: [
      /* @__PURE__ */ jsx("div", { className: "site-footer-links", children: footerLinkGroups.map((group) => /* @__PURE__ */ jsxs("nav", { className: "site-footer-section", "aria-label": group.title, children: [
        /* @__PURE__ */ jsx("h3", { children: group.title }),
        group.links.map((link) => /* @__PURE__ */ jsx(
          "a",
          {
            href: link.href,
            target: isExternalHref(link.href) ? "_blank" : void 0,
            rel: isExternalHref(link.href) ? "noreferrer" : void 0,
            children: link.label
          },
          link.label
        ))
      ] }, group.title)) }),
      /* @__PURE__ */ jsx("div", { className: "site-footer-apps", "aria-label": "Быстрые действия", children: footerServiceBadges.map((badge) => /* @__PURE__ */ jsxs("a", { href: badge.href, children: [
        /* @__PURE__ */ jsx("span", { children: badge.caption }),
        /* @__PURE__ */ jsx("b", { children: badge.title })
      ] }, badge.title)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "site-footer-stats", children: footerStats.map((item) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("b", { children: item.value }),
      /* @__PURE__ */ jsx("span", { children: item.label })
    ] }, item.value)) }),
    /* @__PURE__ */ jsxs("div", { className: "site-footer-bottom", children: [
      /* @__PURE__ */ jsxs("div", { className: "site-footer-legal", children: [
        /* @__PURE__ */ jsxs("b", { children: [
          RESTAURANT.name,
          " © ",
          (/* @__PURE__ */ new Date()).getFullYear()
        ] }),
        /* @__PURE__ */ jsx("a", { href: "/legal", children: "Правовая информация" }),
        /* @__PURE__ */ jsx("a", { href: "/legal/offer", children: "Публичная оферта" }),
        /* @__PURE__ */ jsx("a", { href: "/legal/privacy", children: "Политика ПДн" }),
        /* @__PURE__ */ jsx("a", { href: "/legal/cookies", children: "Cookies" }),
        /* @__PURE__ */ jsx("a", { href: sitePageHref("/dostavka"), children: "Доставка и самовывоз" }),
        /* @__PURE__ */ jsx("a", { href: sitePageHref("/delivery-zones"), children: "Зоны доставки" }),
        /* @__PURE__ */ jsx("a", { href: "/legal/nutrition", children: "Калорийность и состав" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "site-footer-social", children: footerSocialLinks.map((link) => /* @__PURE__ */ jsx("a", { href: link.href, "aria-label": link.label, target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ jsx("span", { children: link.label }) }, link.label)) })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "site-footer-company", children: [
      LEGAL_ENTITY.name,
      ", ИНН ",
      LEGAL_ENTITY.inn,
      ", КПП ",
      LEGAL_ENTITY.kpp,
      ", ОГРН ",
      LEGAL_ENTITY.ogrn,
      ". Адрес: ",
      LEGAL_ENTITY.legalAddress,
      ". Телефон: ",
      LEGAL_ENTITY.phone,
      ". Почта: ",
      LEGAL_ENTITY.email,
      "."
    ] })
  ] }) });
}
const siteGalleryPhotos = [
  {
    title: "Зал для семейного ужина",
    caption: "Столы, свет и спокойная посадка",
    orientation: "landscape",
    image: `${ASSET}concept-interior.webp`
  },
  {
    title: "Детская за стеклом",
    caption: "Родители рядом, дети заняты игрой",
    orientation: "landscape",
    image: `${ASSET}concept-kids-zone.webp`
  },
  {
    title: "Пицца из печи",
    caption: "Румяный борт и живое тесто",
    orientation: "landscape",
    image: `${ASSET}concept-pizza-plate.jpg`
  },
  {
    title: "Завтраки и ланчи",
    caption: "Понятная еда на каждый день",
    orientation: "landscape",
    image: `${ASSET}concept-breakfast.webp`
  },
  {
    title: "Праздники",
    caption: "Дни рождения, встречи и банкеты",
    orientation: "landscape",
    image: `${ASSET}concept-birthday.jpg`
  },
  {
    title: "Печь Morello Forni",
    caption: "Живой жар и румяная корочка",
    orientation: "landscape",
    image: `${ASSET}concept-pizza-oven.jpg`
  },
  {
    title: "Пицца на стол",
    caption: "Готовим для семьи и компании",
    orientation: "landscape",
    image: `${ASSET}concept-pizza-table.webp`
  },
  {
    title: "Зал пиццерии",
    caption: "Уютная посадка на каждый день",
    orientation: "landscape",
    image: `${ASSET}concept-hall.jpg`
  },
  {
    title: "Паста и горячее",
    caption: "Сытные блюда к обеду и ужину",
    orientation: "landscape",
    image: `${ASSET}concept-pasta.jpg`
  },
  {
    title: "Салаты",
    caption: "Легкие сочетания к пицце и завтраку",
    orientation: "landscape",
    image: `${ASSET}concept-salad.jpg`
  },
  {
    title: "Десерты",
    caption: "Сладкое к кофе и празднику",
    orientation: "landscape",
    image: `${ASSET}concept-cake.webp`
  },
  {
    title: "Кофе и выпечка",
    caption: "Для завтрака и спокойной паузы",
    orientation: "landscape",
    image: `${ASSET}concept-croissant.webp`
  },
  {
    title: "Сезонное меню",
    caption: "Новинки, акции и блюда месяца",
    orientation: "portrait",
    image: `${ASSET}concept-menu.webp`
  }
];
const siteGalleryVideos = [
  {
    title: "Видео детской зоны",
    caption: "Вертикальный слот 9:16 под Kinescope",
    orientation: "video",
    poster: `${ASSET}concept-kids-zone.webp`,
    videoUrl: ""
  },
  {
    title: "Видео блюда",
    caption: "Вертикальный слот 9:16 под Kinescope",
    orientation: "video",
    poster: `${ASSET}concept-pizza-oven.jpg`,
    videoUrl: ""
  }
];
function getFallbackGalleryItems() {
  return [
    ...siteGalleryPhotos.slice(0, 5).map((item) => ({ ...item, type: "photo" })),
    ...siteGalleryVideos.map((item) => ({ ...item, type: "video" })),
    ...siteGalleryPhotos.slice(5).map((item) => ({ ...item, type: "photo" }))
  ];
}
function useSiteGalleryItems() {
  const fallbackItems = useMemo(getFallbackGalleryItems, []);
  const [items, setItems] = useState(fallbackItems);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function loadGallery() {
      try {
        const response = await fetch(apiPath("siteGallery"));
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && data.ok === true && Array.isArray(data.items)) {
          setItems(data.items);
        }
      } catch {
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);
  const photos = useMemo(() => items.filter((item) => item.type !== "video"), [items]);
  const videos = useMemo(() => items.filter((item) => item.type === "video"), [items]);
  return {
    items,
    photos,
    videos,
    loading
  };
}
function getNextIndex(currentIndex, direction, total) {
  if (!total) return 0;
  return (currentIndex + direction + total) % total;
}
function getGalleryPageHref() {
  if (typeof window === "undefined") {
    return "/gallery";
  }
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "/dev/gallery" : "/gallery";
}
function getMediaShape(item) {
  if (item.type === "video" || item.orientation === "video") return "video";
  if (item.orientation === "portrait") return "portrait";
  if (item.orientation === "square") return "square";
  return "landscape";
}
function SiteGallerySection() {
  const { items: galleryPreviewItems, photos } = useSiteGalleryItems();
  const [activeIndex, setActiveIndex] = useState(null);
  const activeItem = Number.isInteger(activeIndex) ? galleryPreviewItems[activeIndex] || null : null;
  const closeGallery = () => setActiveIndex(null);
  const showPrevious = () => setActiveIndex((current) => getNextIndex(current, -1, galleryPreviewItems.length));
  const showNext = () => setActiveIndex((current) => getNextIndex(current, 1, galleryPreviewItems.length));
  useBodyScrollLock(activeItem !== null, closeGallery);
  useEffect(() => {
    if (!activeItem) return void 0;
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => getNextIndex(current, -1, galleryPreviewItems.length));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) => getNextIndex(current, 1, galleryPreviewItems.length));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, galleryPreviewItems.length]);
  return /* @__PURE__ */ jsxs("section", { className: "site-section-v2 site-gallery-section", "aria-labelledby": "site-gallery-title", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-gallery-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Галерея" }),
        /* @__PURE__ */ jsx("h2", { id: "site-gallery-title", children: "Наше настроение" }),
        /* @__PURE__ */ jsx("p", { children: "Зал, детская зона, пицца из печи и моменты, ради которых к нам приходят всей семьей." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "site-gallery-actions", children: [
        /* @__PURE__ */ jsxs("span", { className: "site-gallery-count", children: [
          /* @__PURE__ */ jsx(Images, { size: 18 }),
          photos.length,
          " фото"
        ] }),
        /* @__PURE__ */ jsxs("a", { className: "site-gallery-more-link", href: getGalleryPageHref(), children: [
          "Посмотреть все фотографии",
          /* @__PURE__ */ jsx(ArrowUpRight, { size: 16 })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "site-gallery-grid", "aria-label": "Фотографии пиццерии", children: galleryPreviewItems.map((item, index) => {
      if (item.type === "video") {
        const shape2 = getMediaShape(item);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            className: `site-gallery-video-card is-${shape2}`,
            type: "button",
            onClick: () => setActiveIndex(index),
            children: [
              /* @__PURE__ */ jsx("img", { src: item.poster, alt: "", loading: "lazy" }),
              /* @__PURE__ */ jsx("span", { className: "site-gallery-video-play", children: /* @__PURE__ */ jsx(Play, { size: 18, fill: "currentColor" }) })
            ]
          },
          item.id || `video-${item.title}`
        );
      }
      const shape = getMediaShape(item);
      return /* @__PURE__ */ jsx(
        "button",
        {
          className: `site-gallery-card is-${shape} ${index === 0 ? "is-large" : ""}`,
          type: "button",
          onClick: () => setActiveIndex(index),
          children: /* @__PURE__ */ jsx("img", { src: item.image, alt: item.title, loading: "lazy" })
        },
        item.id || item.title
      );
    }) }),
    activeItem ? /* @__PURE__ */ jsxs("div", { className: "site-gallery-lightbox-layer", role: "presentation", children: [
      /* @__PURE__ */ jsx("div", { className: "site-gallery-lightbox-scrim", "aria-hidden": "true", onClick: closeGallery }),
      /* @__PURE__ */ jsxs(
        "section",
        {
          className: `site-gallery-lightbox is-${getMediaShape(activeItem)}`,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Просмотр фотографии",
          children: [
            /* @__PURE__ */ jsx("button", { className: "site-gallery-lightbox-close", type: "button", "aria-label": "Закрыть галерею", onClick: closeGallery, children: /* @__PURE__ */ jsx(X, { size: 26 }) }),
            /* @__PURE__ */ jsx("button", { className: "site-gallery-lightbox-arrow is-prev", type: "button", "aria-label": "Предыдущее фото", onClick: showPrevious, children: /* @__PURE__ */ jsx(ChevronLeft, { size: 30 }) }),
            activeItem.type === "video" && activeItem.videoUrl ? /* @__PURE__ */ jsx(
              "iframe",
              {
                src: activeItem.videoUrl,
                title: activeItem.title,
                allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
                allowFullScreen: true
              }
            ) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: activeItem.type === "video" ? activeItem.poster : activeItem.image,
                  alt: activeItem.type === "video" ? "" : activeItem.title
                }
              ),
              activeItem.type === "video" ? /* @__PURE__ */ jsx("span", { className: "site-gallery-lightbox-play", children: /* @__PURE__ */ jsx(Play, { size: 22, fill: "currentColor" }) }) : null
            ] }),
            /* @__PURE__ */ jsx("button", { className: "site-gallery-lightbox-arrow is-next", type: "button", "aria-label": "Следующее фото", onClick: showNext, children: /* @__PURE__ */ jsx(ChevronRight, { size: 30 }) }),
            /* @__PURE__ */ jsxs("span", { className: "site-gallery-lightbox-counter", children: [
              activeIndex + 1,
              " / ",
              galleryPreviewItems.length
            ] })
          ]
        }
      )
    ] }) : null
  ] });
}
function getYandexMapWidgetUrl() {
  const { lat, lng } = RESTAURANT.coords;
  const params = new URLSearchParams({
    ll: `${lng},${lat}`,
    pt: `${lng},${lat},pm2rdm`,
    z: "16",
    l: "map"
  });
  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}
function getYandexRouteUrl() {
  const { lat, lng } = RESTAURANT.coords;
  const params = new URLSearchParams({
    rtext: `~${lat},${lng}`,
    rtt: "auto"
  });
  return `https://yandex.ru/maps/?${params.toString()}`;
}
function SiteMapSection() {
  return /* @__PURE__ */ jsxs("section", { className: "site-section-v2 site-map-section", id: "map", "aria-labelledby": "site-map-title", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-map-copy", children: [
      /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Как нас найти" }),
      /* @__PURE__ */ jsx("h2", { id: "site-map-title", children: "Пирогова, 1Т" }),
      /* @__PURE__ */ jsx("p", { children: "Семейная пиццерия, зал, самовывоз и доставка по Чебоксарам. Заезжайте на ужин, детский праздник или заберите заказ с собой." }),
      /* @__PURE__ */ jsxs("div", { className: "site-map-facts", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx(MapPin, { size: 18 }),
          RESTAURANT.address
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx(Clock, { size: 18 }),
          "Ежедневно ",
          RESTAURANT.workHours
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "site-map-actions", children: [
        /* @__PURE__ */ jsxs("a", { className: "site-primary-btn", href: getYandexRouteUrl(), target: "_blank", rel: "noreferrer", children: [
          /* @__PURE__ */ jsx(Navigation, { size: 18 }),
          "Построить маршрут"
        ] }),
        /* @__PURE__ */ jsxs("a", { className: "site-dark-btn", href: telHref(PHONE), children: [
          /* @__PURE__ */ jsx(Phone, { size: 18 }),
          "Позвонить"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "site-map-frame", children: [
      /* @__PURE__ */ jsx(
        "iframe",
        {
          src: getYandexMapWidgetUrl(),
          title: "Карта: Вместе Вкуснее, Пирогова, 1Т",
          loading: "lazy",
          allowFullScreen: true
        }
      ),
      /* @__PURE__ */ jsxs("a", { className: "site-map-brand-card", href: SOCIAL_LINKS.yandexMaps, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("img", { src: `${ASSET}vv-logo-full.svg`, alt: "" }) }),
        /* @__PURE__ */ jsx("b", { children: RESTAURANT.name }),
        /* @__PURE__ */ jsx("small", { children: RESTAURANT.shortAddress })
      ] })
    ] })
  ] });
}
const seoCards = [
  {
    title: "Настоящая итальянская пицца",
    text: "Готовим пиццу в Чебоксарах на тесте с долгой ферментацией, с румяным бортом и понятными начинками. В меню есть классика, сезонные новинки, блюда для детей, десерты, завтраки и напитки."
  },
  {
    title: "Быстрая доставка по Чебоксарам",
    text: `Доставляем пиццу, пасту, салаты, горячие блюда и десерты по доступной зоне города. Доставка бесплатная при заказе от ${formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок, самовывоз доступен без минимальной суммы. Обычно доставка занимает ${RESTAURANT.deliveryEta}.`
  },
  {
    title: "Самовывоз с Пирогова, 1Т",
    text: "Можно заказать еду домой или забрать заказ самостоятельно из семейной пиццерии. Самовывоз удобен, если вы рядом с Пирогова, 1Т или хотите быстро забрать пиццу по дороге."
  },
  {
    title: "Акции и специальные предложения",
    text: "Публикуем промокоды, скидки, сезонные предложения и новости о новинках на сайте и в наших соцсетях. Условия каждой акции показываем рядом с промокодом, чтобы всё было понятно до оформления заказа."
  }
];
function SiteSeoSection() {
  return /* @__PURE__ */ jsxs("section", { className: "site-seo-section", "aria-labelledby": "site-seo-title", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-seo-head", children: [
      /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Доставка и самовывоз" }),
      /* @__PURE__ */ jsx("h2", { id: "site-seo-title", children: "Доставка пиццы в Чебоксарах от «Вместе Вкуснее»" }),
      /* @__PURE__ */ jsx("p", { children: "Семейная пиццерия с живой кухней, большой детской зоной и доставкой по Чебоксарам. Закажите итальянскую пиццу, пасту, салаты, десерты или попробуйте новое сезонное меню." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "site-seo-grid", children: seoCards.map((card) => /* @__PURE__ */ jsxs("article", { className: "site-seo-card", children: [
      /* @__PURE__ */ jsx("h3", { children: card.title }),
      /* @__PURE__ */ jsx("p", { children: card.text })
    ] }, card.title)) }),
    /* @__PURE__ */ jsxs("div", { className: "site-seo-bottom", children: [
      /* @__PURE__ */ jsx("p", { children: "Оформить заказ можно онлайн на сайте: выберите блюда, укажите доставку или самовывоз, примените промокод и оплатите удобным способом. Мы готовим без хаоса и внимательно собираем каждый заказ." }),
      /* @__PURE__ */ jsx("a", { href: getSiteOrderPath(), children: "Перейти к меню" })
    ] })
  ] });
}
function HomepageBelowFold() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteGallerySection, {}),
    /* @__PURE__ */ jsx(SiteFaqSection, {}),
    /* @__PURE__ */ jsx(SiteMapSection, {}),
    /* @__PURE__ */ jsx(SiteSeoSection, {}),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  HomepageBelowFold
};
