import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { PROMO_CODES } from "../../data/config";
import { apiPath } from "../../utils/api";
import { formatPrice } from "../../utils/price";
import { evaluatePromoCart } from "../../../shared/promo-rules";
import { getCartItemDetails, getCartItemImage } from "./cartModel";
import { EMPTY_CART_IMAGE, cartUpsellItems, getSiteHomePath } from "./siteData";

export function CartDrawer({
  isOpen,
  isVisible,
  isClosing,
  hasItems,
  cartItems,
  cartItemsLabel,
  cartSummary,
  onClose,
  onRemoveItem,
  onUpdateItemQty,
  onEditItem,
  onApplyPromo,
  onCheckout
}) {
  const [promoCode, setPromoCode] = useState(cartSummary.promo?.code || "");
  const [promoStatus, setPromoStatus] = useState(
    cartSummary.promo?.active
      ? { type: "success", text: `${cartSummary.promo.label || "Промокод применён"}` }
      : null
  );
  const [promoLoading, setPromoLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const trimmedPromoCode = promoCode.trim();
  const canApplyPromo = trimmedPromoCode.length > 0;

  const changePromoCode = (event) => {
    setPromoCode(event.target.value.toUpperCase());
    setPromoStatus(null);
  };

  const applyPromoCode = async (event) => {
    event.preventDefault();

    if (!canApplyPromo || promoLoading) {
      return;
    }

    const normalizedCode = trimmedPromoCode.toUpperCase();
    setPromoLoading(true);
    setPromoStatus(null);

    try {
      let promo = null;
      const response = await fetch(`${apiPath("promoCodes")}/${encodeURIComponent(normalizedCode)}`);
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok === true && data.promo) {
        promo = data.promo;
      } else if (response.status === 404 && PROMO_CODES[normalizedCode]) {
        promo = PROMO_CODES[normalizedCode];
      } else {
        const requestError = new Error(data.error || "Промокод не найден. Попробуйте другой");
        requestError.allowStaticFallback = response.status === 404;
        throw requestError;
      }

      const activePromo = {
        ...promo,
        active: true
      };
      const promoEvaluation = evaluatePromoCart(activePromo, cartItems);
      if (!promoEvaluation.eligible) {
        const requestError = new Error(promoEvaluation.message);
        requestError.allowStaticFallback = false;
        throw requestError;
      }

      onApplyPromo?.(activePromo);
      setPromoCode(activePromo.code);
      setPromoStatus({
        type: "success",
        text: `Промокод применён: скидка ${activePromo.percent}%`
      });
    } catch (promoError) {
      const fallbackPromo = PROMO_CODES[normalizedCode];
      if (fallbackPromo && promoError.allowStaticFallback !== false) {
        const activePromo = { ...fallbackPromo, active: true };
        const promoEvaluation = evaluatePromoCart(activePromo, cartItems);
        if (!promoEvaluation.eligible) {
          onApplyPromo?.(null);
          setPromoStatus({
            type: "error",
            text: promoEvaluation.message
          });
          return;
        }
        onApplyPromo?.(activePromo);
        setPromoCode(activePromo.code);
        setPromoStatus({
          type: "success",
          text: `Промокод применён: скидка ${activePromo.percent}%`
        });
      } else {
        onApplyPromo?.(null);
        setPromoStatus({
          type: "error",
          text: promoError.message || "Промокод не найден. Попробуйте другой"
        });
      }
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div
      className={`site-cart-drawer-layer ${isVisible ? "is-open" : ""} ${isClosing ? "is-closing" : ""}`}
      role="presentation"
    >
      <div
        className="site-cart-drawer-scrim"
        aria-label="Закрыть корзину"
        aria-hidden="true"
        onClick={onClose}
      />
      <button
        className="site-cart-drawer-close"
        type="button"
        aria-label="Закрыть корзину"
        onClick={onClose}
      >
        <X size={28} strokeWidth={2.4} />
      </button>
      <aside
        className="site-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasItems ? "site-cart-title" : "site-empty-cart-title"}
      >
        {hasItems ? (
          <div className="site-cart-filled">
            <div className="site-cart-scroll">
              <header className="site-cart-panel-head">
                <h2 id="site-cart-title">
                  {cartItemsLabel} на {formatPrice(cartSummary.total)} ₽
                </h2>
              </header>

              <div className="site-cart-panel-list">
                {cartItems.map((item, index) => {
                  const qty = Number(item.qty || 0);
                  const unitPrice = Number(item.unitPrice || item.price || 0);
                  const lineTotal = unitPrice * qty;
                  const details = getCartItemDetails(item);
                  const itemImage = getCartItemImage(item);

                  return (
                    <article className="site-cart-line" key={item.uid || `${item.name}-${index}`}>
                      <img className="site-cart-line-image" src={itemImage} alt="" loading="lazy" />
                      <div className="site-cart-line-copy">
                        <div className="site-cart-line-top">
                          <h3>{item.name}</h3>
                          <button
                            type="button"
                            aria-label={`Удалить ${item.name}`}
                            onClick={() => onRemoveItem(index)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {details ? <p>{details}</p> : null}
                        <div className="site-cart-line-bottom">
                          <strong>{formatPrice(lineTotal)} ₽</strong>
                          <button
                            className="site-cart-edit"
                            type="button"
                            onClick={() => {
                              if (onEditItem) {
                                onEditItem(item, index);
                                return;
                              }

                              onClose();
                              window.location.href = `${getSiteHomePath()}#menu`;
                            }}
                          >
                            Изменить
                          </button>
                          <div className="site-cart-qty" aria-label={`Количество ${item.name}`}>
                            <button type="button" onClick={() => onUpdateItemQty(index, -1)} aria-label="Уменьшить">
                              −
                            </button>
                            <span>{qty}</span>
                            <button type="button" onClick={() => onUpdateItemQty(index, 1)} aria-label="Увеличить">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <section className="site-cart-upsell" aria-label="Добавить к заказу">
                <h3>Добавить к заказу?</h3>
                <div className="site-cart-upsell-track">
                  {cartUpsellItems.map((item) => (
                    <a className="site-cart-upsell-card" href={`${getSiteHomePath()}#menu`} onClick={onClose} key={item.id}>
                      <img src={getCartItemImage(item)} alt="" loading="lazy" />
                      <span>{item.name}</span>
                      <b>от {formatPrice(item.price)} ₽</b>
                    </a>
                  ))}
                </div>
              </section>

              <footer className="site-cart-summary">
                <form className="site-cart-promo-form" onSubmit={applyPromoCode}>
                  <label className="site-cart-promo-field">
                    <span className="site-cart-promo-label">Промокод</span>
                    <input
                      value={promoCode}
                      onChange={changePromoCode}
                      placeholder="Промокод"
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </label>
                  {canApplyPromo ? (
                    <button className="site-cart-promo-apply" type="submit" disabled={promoLoading}>
                      {promoLoading ? "Проверяем..." : "Применить"}
                    </button>
                  ) : null}
                  {promoStatus ? (
                    <p className={`site-cart-promo-status is-${promoStatus.type}`}>{promoStatus.text}</p>
                  ) : null}
                </form>
                <div className="site-cart-summary-rows">
                  <span>{cartItemsLabel}</span>
                  <b>{formatPrice(cartSummary.subtotal)} ₽</b>
                  <span>Начислим бонусы</span>
                  <b>+{formatPrice(Math.round(cartSummary.total * 0.05))}</b>
                  {cartSummary.discount > 0 ? (
                    <>
                      <span>{cartSummary.discountState?.label || "Скидка"}</span>
                      <b>−{formatPrice(cartSummary.discount)} ₽</b>
                    </>
                  ) : null}
                  <span>Доставка</span>
                  <b>Бесплатно</b>
                </div>
                <div className="site-cart-total">
                  <span>Сумма заказа</span>
                  <b>{formatPrice(cartSummary.total)} ₽</b>
                </div>
              </footer>
            </div>

            <div className="site-cart-checkout-bar">
              <button
                className="site-cart-checkout"
                type="button"
                onClick={() => {
                  if (onCheckout) {
                    onCheckout();
                    return;
                  }

                  window.location.href = "/checkout";
                }}
              >
                К оформлению заказа
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        ) : (
          <div className="site-cart-empty">
            <img src={EMPTY_CART_IMAGE} alt="" aria-hidden="true" />
            <h2 id="site-empty-cart-title">Пока тут пусто</h2>
            <p>
              Добавьте пиццу. Или две!
              <br />
              А мы доставим ваш заказ от 649 ₽
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
