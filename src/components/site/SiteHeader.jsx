import { useEffect, useId, useRef, useState } from "react";
import { Activity, Clock3, Menu, MessageCircle, Phone, ShoppingBag, Star, UserRound, X } from "lucide-react";
import { getDeliveryEtaLabel, getDeliveryLoadLabel } from "../../utils/deliveryTiming";
import { formatPrice } from "../../utils/price";
import { ASSET, PHONE, SOCIAL_LINKS, getSiteHomePath, headerLinks, telHref } from "./siteCoreData";

function getHeaderLinkHref(href) {
  if (!href?.startsWith("#")) {
    return href;
  }

  return `${getSiteHomePath()}${href}`;
}

function DeliveryMeta({ className = "", deliverySettings }) {
  return (
    <div className={`site-delivery-meta ${className}`.trim()} aria-label="Информация о доставке">
      <span>Доставка Чебоксары</span>
      <b>{getDeliveryEtaLabel(deliverySettings)}</b>
      <span>{getDeliveryLoadLabel(deliverySettings)}</span>
      <b className="site-rating">
        4.8 <Star size={14} fill="currentColor" />
      </b>
    </div>
  );
}

export function SiteHeader({
  customer = null,
  hasCartItems,
  cartSummary,
  isCartDrawerOpen,
  isCartDrawerClosing,
  deliverySettings,
  onAuthClick,
  onCartClick
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileMenuId = useId();
  const deliveryEtaLabel = getDeliveryEtaLabel(deliverySettings);
  const deliveryLoadLabel = getDeliveryLoadLabel(deliverySettings);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const closeOnOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`site-header-v3 ${isMobileMenuOpen ? "is-mobile-menu-open" : ""}`} ref={headerRef}>
      <div className="site-header-topline">
        <nav className="site-header-links" aria-label="Дополнительные разделы">
          {headerLinks.map((link) => (
            <a href={getHeaderLinkHref(link.href)} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="site-header-main">
        <a className="site-brand-v3" href={getSiteHomePath()} aria-label="На главную">
          <span className="site-brand-logo">
            <img src={`${ASSET}vv-logo-full.svg`} alt="" />
          </span>
        </a>

        <DeliveryMeta className="site-header-delivery" deliverySettings={deliverySettings} />

        <div className="site-header-actions">
          {onAuthClick ? (
            <button
              className={`site-header-login ${customer ? "is-authorized" : ""}`}
              type="button"
              aria-haspopup="dialog"
              aria-label={customer ? "Открыть личный кабинет" : "Войти в личный кабинет"}
              onClick={onAuthClick}
            >
              <UserRound size={20} />
              <span>{customer ? "Кабинет" : "Войти"}</span>
            </button>
          ) : null}
          <button
            className={`site-header-cart ${hasCartItems ? "is-filled" : ""}`}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isCartDrawerOpen && !isCartDrawerClosing}
            aria-label={
              hasCartItems
                ? `Открыть корзину на сумму ${formatPrice(cartSummary.total)} рублей`
                : "Открыть пустую корзину"
            }
            onClick={onCartClick}
          >
            <ShoppingBag size={20} />
            <span>{hasCartItems ? `${formatPrice(cartSummary.total)} ₽` : "Корзина"}</span>
          </button>
        </div>

        <button
          className={`site-header-mobile-menu ${isMobileMenuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          {isMobileMenuOpen ? <X size={22} strokeWidth={2.8} /> : <Menu size={22} strokeWidth={2.8} />}
        </button>
      </div>

      <div
        className={`site-mobile-menu-panel ${isMobileMenuOpen ? "is-open" : ""}`}
        id={mobileMenuId}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="site-mobile-menu-status" aria-label="Информация о доставке">
          <span>
            <Clock3 size={17} />
            <small>Среднее время</small>
            <b>{deliveryEtaLabel}</b>
          </span>
          <span>
            <Activity size={17} />
            <small>Загруженность</small>
            <b>{deliveryLoadLabel}</b>
          </span>
          <span>
            <Star size={17} fill="currentColor" />
            <small>Рейтинг</small>
            <b>4.8</b>
          </span>
        </div>

        <nav className="site-mobile-menu-links" aria-label="Мобильное меню">
          {headerLinks.map((link) => (
            <a href={getHeaderLinkHref(link.href)} key={link.label} onClick={closeMobileMenu}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-mobile-menu-actions">
          {onAuthClick ? (
            <button
              className="site-mobile-menu-action"
              type="button"
              onClick={() => {
                closeMobileMenu();
                onAuthClick();
              }}
            >
              <UserRound size={18} />
              <span>{customer ? "Открыть кабинет" : "Войти в кабинет"}</span>
            </button>
          ) : null}

          <a className="site-mobile-menu-action" href={telHref(PHONE)} onClick={closeMobileMenu}>
            <Phone size={18} />
            <span>{PHONE}</span>
          </a>

          <a className="site-mobile-menu-action" href={`${getSiteHomePath()}#contacts`} onClick={closeMobileMenu}>
            <MessageCircle size={18} />
            <span>Обратная связь</span>
          </a>
        </div>

        <div className="site-mobile-menu-socials" aria-label="Социальные сети">
          <a href={SOCIAL_LINKS.vk} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
            VK
          </a>
          <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
            Telegram
          </a>
        </div>
      </div>

    </header>
  );
}
