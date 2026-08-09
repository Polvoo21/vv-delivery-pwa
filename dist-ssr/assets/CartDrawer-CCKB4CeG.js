import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { g as getDeliveryMinimumRemaining, D as DELIVERY_MIN_ORDER_AMOUNT } from "./order-rules-DteAI564.js";
import { f as formatPrice, g as getCartItemDetails, a as getCartItemImage, b as apiPath, e as evaluatePromoCart } from "../home-ssr.js";
import { g as getSiteHomePath, E as EMPTY_CART_IMAGE } from "./siteData-Bg885p-K.js";
import "react-dom/server";
import "./config-DkuDoHBX.js";
function CartDrawer({
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
  var _a, _b, _c;
  const [promoCode, setPromoCode] = useState(((_a = cartSummary.promo) == null ? void 0 : _a.code) || "");
  const [promoStatus, setPromoStatus] = useState(
    ((_b = cartSummary.promo) == null ? void 0 : _b.active) ? { type: "success", text: `${cartSummary.promo.label || "Промокод применён"}` } : null
  );
  const [promoLoading, setPromoLoading] = useState(false);
  if (!isOpen) {
    return null;
  }
  const trimmedPromoCode = promoCode.trim();
  const canApplyPromo = trimmedPromoCode.length > 0;
  const deliveryMinimumRemaining = getDeliveryMinimumRemaining(cartSummary.total);
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
      const response = await fetch(`${apiPath("promoCodes")}/${encodeURIComponent(normalizedCode)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true || !data.promo) {
        throw new Error(data.error || "Промокод не найден. Попробуйте другой");
      }
      const activePromo = {
        ...data.promo,
        active: true
      };
      const promoEvaluation = evaluatePromoCart(activePromo, cartItems);
      if (!promoEvaluation.eligible) {
        throw new Error(promoEvaluation.message);
      }
      onApplyPromo == null ? void 0 : onApplyPromo(activePromo);
      setPromoCode(activePromo.code);
      setPromoStatus({
        type: "success",
        text: `Промокод применён: скидка ${activePromo.percent}%`
      });
    } catch (promoError) {
      onApplyPromo == null ? void 0 : onApplyPromo(null);
      setPromoStatus({
        type: "error",
        text: promoError.message || "Промокод не найден. Попробуйте другой"
      });
    } finally {
      setPromoLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `site-cart-drawer-layer ${isVisible ? "is-open" : ""} ${isClosing ? "is-closing" : ""}`,
      role: "presentation",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "site-cart-drawer-scrim",
            "aria-label": "Закрыть корзину",
            "aria-hidden": "true",
            onClick: onClose
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "site-cart-drawer-close",
            type: "button",
            "aria-label": "Закрыть корзину",
            onClick: onClose,
            children: /* @__PURE__ */ jsx(X, { size: 28, strokeWidth: 2.4 })
          }
        ),
        /* @__PURE__ */ jsx(
          "aside",
          {
            className: "site-cart-drawer",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": hasItems ? "site-cart-title" : "site-empty-cart-title",
            children: hasItems ? /* @__PURE__ */ jsxs("div", { className: "site-cart-filled", children: [
              /* @__PURE__ */ jsxs("div", { className: "site-cart-scroll", children: [
                /* @__PURE__ */ jsx("header", { className: "site-cart-panel-head", children: /* @__PURE__ */ jsxs("h2", { id: "site-cart-title", children: [
                  cartItemsLabel,
                  " на ",
                  formatPrice(cartSummary.total),
                  " ₽"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "site-cart-panel-list", children: cartItems.map((item, index) => {
                  const qty = Number(item.qty || 0);
                  const unitPrice = Number(item.unitPrice || item.price || 0);
                  const lineTotal = unitPrice * qty;
                  const details = getCartItemDetails(item);
                  const itemImage = getCartItemImage(item);
                  return /* @__PURE__ */ jsxs("article", { className: "site-cart-line", children: [
                    /* @__PURE__ */ jsx("img", { className: "site-cart-line-image", src: itemImage, alt: "", loading: "lazy" }),
                    /* @__PURE__ */ jsxs("div", { className: "site-cart-line-copy", children: [
                      /* @__PURE__ */ jsxs("div", { className: "site-cart-line-top", children: [
                        /* @__PURE__ */ jsx("h3", { children: item.name }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            "aria-label": `Удалить ${item.name}`,
                            onClick: () => onRemoveItem(index),
                            children: /* @__PURE__ */ jsx(X, { size: 16 })
                          }
                        )
                      ] }),
                      details ? /* @__PURE__ */ jsx("p", { children: details }) : null,
                      /* @__PURE__ */ jsxs("div", { className: "site-cart-line-bottom", children: [
                        /* @__PURE__ */ jsxs("strong", { children: [
                          formatPrice(lineTotal),
                          " ₽"
                        ] }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            className: "site-cart-edit",
                            type: "button",
                            onClick: () => {
                              if (onEditItem) {
                                onEditItem(item, index);
                                return;
                              }
                              onClose();
                              window.location.href = `${getSiteHomePath()}#menu`;
                            },
                            children: "Изменить"
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "site-cart-qty", "aria-label": `Количество ${item.name}`, children: [
                          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onUpdateItemQty(index, -1), "aria-label": "Уменьшить", children: "−" }),
                          /* @__PURE__ */ jsx("span", { children: qty }),
                          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onUpdateItemQty(index, 1), "aria-label": "Увеличить", children: "+" })
                        ] })
                      ] })
                    ] })
                  ] }, item.uid || `${item.name}-${index}`);
                }) }),
                /* @__PURE__ */ jsxs("footer", { className: "site-cart-summary", children: [
                  /* @__PURE__ */ jsxs("form", { className: "site-cart-promo-form", onSubmit: applyPromoCode, children: [
                    /* @__PURE__ */ jsxs("label", { className: "site-cart-promo-field", children: [
                      /* @__PURE__ */ jsx("span", { className: "site-cart-promo-label", children: "Промокод" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          value: promoCode,
                          onChange: changePromoCode,
                          placeholder: "Промокод",
                          autoComplete: "off",
                          spellCheck: "false"
                        }
                      )
                    ] }),
                    canApplyPromo ? /* @__PURE__ */ jsx("button", { className: "site-cart-promo-apply", type: "submit", disabled: promoLoading, children: promoLoading ? "Проверяем..." : "Применить" }) : null,
                    promoStatus ? /* @__PURE__ */ jsx("p", { className: `site-cart-promo-status is-${promoStatus.type}`, children: promoStatus.text }) : null
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "site-cart-summary-rows", children: [
                    /* @__PURE__ */ jsx("span", { children: cartItemsLabel }),
                    /* @__PURE__ */ jsxs("b", { children: [
                      formatPrice(cartSummary.subtotal),
                      " ₽"
                    ] }),
                    cartSummary.discount > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("span", { children: ((_c = cartSummary.discountState) == null ? void 0 : _c.label) || "Скидка" }),
                      /* @__PURE__ */ jsxs("b", { children: [
                        "−",
                        formatPrice(cartSummary.discount),
                        " ₽"
                      ] })
                    ] }) : null,
                    /* @__PURE__ */ jsx("span", { children: "Доставка" }),
                    /* @__PURE__ */ jsx("b", { children: "Бесплатно" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "site-cart-total", children: [
                    /* @__PURE__ */ jsx("span", { children: "Сумма заказа" }),
                    /* @__PURE__ */ jsxs("b", { children: [
                      formatPrice(cartSummary.total),
                      " ₽"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: `site-cart-minimum ${deliveryMinimumRemaining > 0 ? "is-pending" : "is-ready"}`, children: [
                    /* @__PURE__ */ jsxs("b", { children: [
                      "Бесплатная доставка от ",
                      formatPrice(DELIVERY_MIN_ORDER_AMOUNT),
                      " ₽ после скидок"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      deliveryMinimumRemaining > 0 ? `Добавьте блюда ещё на ${formatPrice(deliveryMinimumRemaining)} ₽.` : "Минимальная сумма набрана.",
                      " ",
                      "Самовывоз доступен без минимальной суммы."
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "site-cart-checkout-bar", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "site-cart-checkout",
                  type: "button",
                  onClick: () => {
                    if (onCheckout) {
                      onCheckout();
                      return;
                    }
                    window.location.href = "/checkout";
                  },
                  children: [
                    "К оформлению заказа",
                    /* @__PURE__ */ jsx(ChevronRight, { size: 22 })
                  ]
                }
              ) })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "site-cart-empty", children: [
              /* @__PURE__ */ jsx("img", { src: EMPTY_CART_IMAGE, alt: "", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx("h2", { id: "site-empty-cart-title", children: "Пока тут пусто" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "Добавьте пиццу. Или две!",
                /* @__PURE__ */ jsx("br", {}),
                "Бесплатная доставка от ",
                formatPrice(DELIVERY_MIN_ORDER_AMOUNT),
                " ₽",
                /* @__PURE__ */ jsx("br", {}),
                "Самовывоз без минимальной суммы"
              ] })
            ] })
          }
        )
      ]
    }
  );
}
export {
  CartDrawer
};
