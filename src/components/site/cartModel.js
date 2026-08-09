import { calculateCartTotals } from "../../utils/price";
import { PRICING_POLICY_VERSION } from "../../data/pricing-policy";
import { DELIVERY_STORAGE_KEY, emptyCartSummary, getCategoryVisual } from "./siteCoreData";

export function getStoredCartSummary() {
  if (typeof window === "undefined") {
    return emptyCartSummary;
  }

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    const cart = Array.isArray(parsedState.cart) ? parsedState.cart : [];
    const promo = parsedState.pricingPolicyVersion === PRICING_POLICY_VERSION ? parsedState.promo || null : null;
    const offer = null;
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const totals = calculateCartTotals(cart, promo, offer);

    return { cart, count, promo, offer, ...totals };
  } catch (error) {
    console.warn("Не удалось прочитать корзину доставки", error);
    return emptyCartSummary;
  }
}

export function saveStoredCart(nextCart) {
  if (typeof window === "undefined") return null;

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    const promo = parsedState.pricingPolicyVersion === PRICING_POLICY_VERSION ? parsedState.promo || null : null;
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({
        ...parsedState,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        cart: nextCart,
        promo,
        offer: null
      })
    );
    return getStoredCartSummary();
  } catch (error) {
    console.warn("Не удалось сохранить корзину доставки", error);
    return null;
  }
}

export function saveStoredPromo(nextPromo) {
  if (typeof window === "undefined") return null;

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({
        ...parsedState,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        promo: nextPromo,
        offer: null
      })
    );
    return getStoredCartSummary();
  } catch (error) {
    console.warn("Не удалось сохранить промокод", error);
    return null;
  }
}

function formatAddon(addon) {
  if (!addon) return "";
  if (typeof addon === "string") return addon;

  const qty = Number(addon.qty || 1);
  const addonName = [addon.name, addon.weight].filter(Boolean).join(" ");
  return qty > 1 ? `${addonName} x${qty}` : addonName;
}

function formatCustomization(customization) {
  if (!customization || typeof customization !== "object") return "";

  const parts = [];
  const removed = Array.isArray(customization.removed) ? customization.removed.filter(Boolean) : [];
  const addons = Array.isArray(customization.addons)
    ? customization.addons.map(formatAddon).filter(Boolean)
    : [];

  if (removed.length) parts.push(`без ${removed.join(", ")}`);
  if (addons.length) parts.push(`+ ${addons.join(", ")}`);

  return parts.length ? `${customization.name}: ${parts.join(", ")}` : "";
}

export function getCartItemDetails(item) {
  const details = [];
  const addons = Array.isArray(item.addons)
    ? item.addons.map(formatAddon).filter(Boolean)
    : [];
  const removed = Array.isArray(item.removed) ? item.removed.filter(Boolean) : [];
  const comboItems = Array.isArray(item.comboItems)
    ? item.comboItems.map((comboItem) => comboItem?.name).filter(Boolean)
    : [];
  const customizations = Array.isArray(item.customizations)
    ? item.customizations.map(formatCustomization).filter(Boolean)
    : [];

  if (item.size) details.push(`${item.size} см`);
  if (item.dough) details.push(`${item.dough} тесто`);
  if (item.weight) details.push(item.weight);
  if (comboItems.length) details.push(`в наборе: ${comboItems.join(", ")}`);
  if (addons.length) details.push(`+ ${addons.join(", ")}`);
  if (removed.length) details.push(`без ${removed.join(", ")}`);
  if (customizations.length) details.push(customizations.join("; "));

  return details.join(", ");
}

export function getCartItemImage(item) {
  return item.image || getCategoryVisual(item.category).image;
}
