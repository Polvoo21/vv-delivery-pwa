import { OFFER_DISCOUNT } from "../data/config";
import { evaluatePromoCart } from "../../shared/promo-rules";

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

export function getDiscountState(promo, offer, cart = []) {
  const promoPercent = promo?.active ? Number(promo.percent || 0) : 0;
  const offerPercent = offer?.active ? Number(offer.percent || OFFER_DISCOUNT.percent) : 0;
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.qty || 0),
    0
  );
  const promoEvaluation = promo?.active ? evaluatePromoCart(promo, cart) : null;
  const promoDiscount = promoEvaluation?.eligible ? promoEvaluation.discount : 0;
  const offerDiscount = offerPercent ? Math.round((subtotal * offerPercent) / 100) : 0;
  const promoWins = promoDiscount >= offerDiscount && promoDiscount > 0;
  const percent = promoWins ? promoPercent : offerDiscount > 0 ? offerPercent : 0;

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
    label: promoWins ? promo.label : offer?.label || OFFER_DISCOUNT.label,
    source: promoWins ? "promo" : "offer",
    promoEvaluation
  };
}

export function calculateCartTotals(cart, promo, offer) {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.qty || 0),
    0
  );
  const discountState = getDiscountState(promo, offer, cart);
  const promoDiscount =
    discountState.source === "promo" ? Number(discountState.promoEvaluation?.discount || 0) : 0;
  const discount = discountState.active
    ? discountState.source === "promo"
      ? promoDiscount
      : Math.round((subtotal * discountState.percent) / 100)
    : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total,
    discountState
  };
}
