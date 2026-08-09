import { INDIVIDUAL_MASTERCLASS_PATH } from "../../../shared/masterclass-events";
import { PARTNERS_URL, PHONE, RESTAURANT, SOCIAL_LINKS, getSiteOrderPath, telHref } from "./siteCoreData";
import { LEGAL_ENTITY, legalDocuments } from "./legalData";

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
      links: legalDocuments.map((document) => ({
        label: document.shortTitle,
        href: document.path
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

export function SiteFooter() {
  const footerLinkGroups = getFooterLinkGroups();
  const footerSocialLinks = getFooterSocialLinks();
  const footerServiceBadges = getFooterServiceBadges();

  return (
    <footer className="site-footer-v2" id="contacts">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-links">
            {footerLinkGroups.map((group) => (
              <nav className="site-footer-section" aria-label={group.title} key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map((link) => (
                  <a
                    href={link.href}
                    key={link.label}
                    target={isExternalHref(link.href) ? "_blank" : undefined}
                    rel={isExternalHref(link.href) ? "noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            ))}
          </div>

          <div className="site-footer-apps" aria-label="Быстрые действия">
            {footerServiceBadges.map((badge) => (
              <a href={badge.href} key={badge.title}>
                <span>{badge.caption}</span>
                <b>{badge.title}</b>
              </a>
            ))}
          </div>
        </div>

        <div className="site-footer-stats">
          {footerStats.map((item) => (
            <div key={item.value}>
              <b>{item.value}</b>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-legal">
            <b>{RESTAURANT.name} © {new Date().getFullYear()}</b>
            <a href="/legal">Правовая информация</a>
            <a href="/legal/offer">Публичная оферта</a>
            <a href="/legal/privacy">Политика ПДн</a>
            <a href="/legal/cookies">Cookies</a>
            <a href={sitePageHref("/dostavka")}>Доставка и самовывоз</a>
            <a href={sitePageHref("/delivery-zones")}>Зоны доставки</a>
            <a href="/legal/nutrition">Калорийность и состав</a>
          </div>
          <div className="site-footer-social">
            {footerSocialLinks.map((link) => (
              <a href={link.href} key={link.label} aria-label={link.label} target="_blank" rel="noreferrer">
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <p className="site-footer-company">
          {LEGAL_ENTITY.name}, ИНН {LEGAL_ENTITY.inn}, КПП {LEGAL_ENTITY.kpp}, ОГРН {LEGAL_ENTITY.ogrn}.
          Адрес: {LEGAL_ENTITY.legalAddress}. Телефон: {LEGAL_ENTITY.phone}. Почта: {LEGAL_ENTITY.email}.
        </p>
      </div>
    </footer>
  );
}
