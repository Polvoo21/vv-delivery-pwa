import { evaluatePromoCart } from "../../shared/promo-rules.js";

export const formatPrice = (value) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(Number(value) || 0)));

export function getProductOldPrice(product) {
  const currentPrice = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || product?.regularPrice || product?.basePrice || 0);

  return oldPrice > currentPrice ? oldPrice : 0;
}

const sizeDelta = {
  25: -90,
  30: 0,
  35: 160
};

export function calculateItemPrice(product, options = {}) {
  const size = Number(options.size || 30);
  const isCustomizablePizza = product.category === "pizza" && product.customizable !== false;
  const addonTotal = isCustomizablePizza
    ? (options.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0)
    : 0;
  const doughDelta = isCustomizablePizza && options.dough === "Тонкое" ? 40 : 0;
  const pizzaDelta = isCustomizablePizza ? sizeDelta[size] || 0 : 0;

  return Math.max(0, Math.round(product.price + pizzaDelta + doughDelta + addonTotal));
}

export function getDiscountState(promo, cart = []) {
  const promoPercent = promo?.active ? Number(promo.percent || 0) : 0;
  const promoEvaluation = promo?.active ? evaluatePromoCart(promo, cart) : null;
  const promoDiscount = promoEvaluation?.eligible ? promoEvaluation.discount : 0;
  const percent = promoDiscount > 0 ? promoPercent : 0;

  if (!percent) {
    return {
      active: false,
      percent: 0,
      label: "",
      promoEvaluation
    };
  }

  return {
    active: true,
    percent,
    label: promo.label,
    source: "promo",
    promoEvaluation
  };
}

export function calculateCartTotals(cart, promo) {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.qty || 0),
    0
  );
  const discountState = getDiscountState(promo, cart);
  const promoDiscount =
    discountState.source === "promo" ? Number(discountState.promoEvaluation?.discount || 0) : 0;
  const discount = discountState.active ? promoDiscount : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total,
    discountState
  };
}
