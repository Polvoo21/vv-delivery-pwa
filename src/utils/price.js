import { OFFER_DISCOUNT } from "../data/config";

export const formatPrice = (value) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(Number(value) || 0)));

const sizeDelta = {
  25: -90,
  30: 0,
  35: 160
};

export function calculateItemPrice(product, options = {}) {
  const size = Number(options.size || 30);
  const addonTotal = (options.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
  const doughDelta = options.dough === "Тонкое" ? 40 : 0;
  const pizzaDelta = product.category === "pizza" ? sizeDelta[size] || 0 : 0;

  return Math.max(0, Math.round(product.price + pizzaDelta + doughDelta + addonTotal));
}

export function getDiscountState(promo, offer) {
  const promoPercent = promo?.active ? Number(promo.percent || 0) : 0;
  const offerPercent = offer?.active ? Number(offer.percent || OFFER_DISCOUNT.percent) : 0;
  const percent = Math.max(promoPercent, offerPercent);

  if (!percent) {
    return {
      active: false,
      percent: 0,
      label: ""
    };
  }

  return {
    active: true,
    percent,
    label: promoPercent >= offerPercent && promo?.active ? promo.label : offer?.label || OFFER_DISCOUNT.label
  };
}

export function calculateCartTotals(cart, promo, offer) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 0), 0);
  const discountState = getDiscountState(promo, offer);
  const discount = discountState.active ? Math.round((subtotal * discountState.percent) / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total,
    discountState
  };
}
