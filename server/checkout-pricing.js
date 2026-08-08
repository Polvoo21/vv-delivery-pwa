import { PIZZA_ADDONS } from "../src/data/menu.js";
import { DELIVERY_MIN_ORDER_AMOUNT, getDeliveryMinimumRemaining } from "../shared/order-rules.js";
import { listPublicCatalog } from "./catalog.js";

const PIZZA_SIZE_DELTA = new Map([
  [25, -90],
  [30, 0],
  [35, 160]
]);
const MAX_ADDON_QUANTITY = 10;

function checkoutError(message, statusCode = 409) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safeText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeQuantity(value, label = "Количество") {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw checkoutError(`${label} должно быть целым числом от 1 до 99`, 400);
  }
  return quantity;
}

function normalizeAddons(addons) {
  const addonById = new Map(PIZZA_ADDONS.map((addon) => [addon.id, addon]));
  return (Array.isArray(addons) ? addons : []).map((rawAddon) => {
    const addon = addonById.get(safeText(rawAddon?.id, 80));
    if (!addon) {
      throw checkoutError("Одна из добавок больше недоступна. Обновите корзину.");
    }
    const qty = normalizeQuantity(rawAddon?.qty || 1, `Количество добавки «${addon.name}»`);
    if (qty > MAX_ADDON_QUANTITY) {
      throw checkoutError(`Можно добавить не больше ${MAX_ADDON_QUANTITY} порций «${addon.name}»`, 400);
    }
    return {
      id: addon.id,
      name: addon.name,
      weight: addon.weight,
      price: Number(addon.price),
      qty
    };
  });
}

function addonTotal(addons) {
  return addons.reduce((sum, addon) => sum + addon.price * addon.qty, 0);
}

function normalizeRemoved(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => safeText(typeof value === "string" ? value : value?.name, 100))
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeComboCustomizations(item, product) {
  const comboProductIds = new Set((product.comboItems || []).map((comboItem) => comboItem.id));
  return (Array.isArray(item.customizations) ? item.customizations : []).map((customization) => {
    const productId = safeText(customization?.id, 100);
    if (!comboProductIds.has(productId)) {
      throw checkoutError("Состав комбо изменился. Обновите корзину.");
    }
    const addons = normalizeAddons(customization.addons);
    return {
      id: productId,
      lineId: safeText(customization.lineId, 140),
      name: safeText(customization.name, 160),
      weight: safeText(customization.weight, 80),
      removed: normalizeRemoved(customization.removed),
      addons
    };
  });
}

function priceCatalogItem(item, product) {
  const qty = normalizeQuantity(item.qty, `Количество «${product.name}»`);
  const category = product.categoryId || product.category || "";
  let unitPrice = Number(product.price || 0);
  let addons = [];
  let customizations = [];

  if (category === "combo") {
    customizations = normalizeComboCustomizations(item, product);
    unitPrice += customizations.reduce((sum, customization) => sum + addonTotal(customization.addons), 0);
  } else if (category === "pizza" && product.customizable !== false) {
    addons = normalizeAddons(item.addons);
    const parsedSize = Number.parseInt(item.size, 10);
    if (PIZZA_SIZE_DELTA.has(parsedSize)) unitPrice += PIZZA_SIZE_DELTA.get(parsedSize);
    if (safeText(item.dough, 40).toLowerCase() === "тонкое") unitPrice += 40;
    unitPrice += addonTotal(addons);
  }

  unitPrice = Math.max(0, Math.round(unitPrice));
  if (!unitPrice) {
    throw checkoutError(`Для блюда «${product.name}» не задана корректная цена.`);
  }

  return {
    ...item,
    id: product.id,
    productId: product.id,
    category,
    categoryId: category,
    name: product.name,
    description: product.description || "",
    image: product.image || item.image || "",
    qty,
    price: unitPrice,
    unitPrice,
    lineTotal: unitPrice * qty,
    weight: safeText(item.weight || product.weight, 80),
    addons,
    removed: normalizeRemoved(item.removed),
    customizations,
    comboItems: Array.isArray(product.comboItems)
      ? product.comboItems.map((comboItem) => ({
          id: comboItem.id,
          name: comboItem.name,
          weight: comboItem.weight || ""
        }))
      : []
  };
}

export function priceCheckoutItems(items, catalog) {
  const productById = new Map((catalog?.products || []).map((product) => [product.id, product]));
  return (Array.isArray(items) ? items : []).map((item) => {
    const productId = safeText(item?.productId || item?.id, 100);
    const product = productById.get(productId);
    if (!product) {
      throw checkoutError(`Блюдо «${safeText(item?.name || productId, 160)}» больше недоступно. Обновите корзину.`);
    }
    return priceCatalogItem(item, product);
  });
}

export async function priceCheckoutOrder(order, { catalog } = {}) {
  const trustedCatalog = catalog || (await listPublicCatalog());
  const items = priceCheckoutItems(order?.items, trustedCatalog);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const claimedSubtotal = Number(order?.subtotal || 0);

  if (claimedSubtotal > 0 && Math.round(claimedSubtotal) !== subtotal) {
    throw checkoutError("Цены в корзине изменились. Обновите страницу и проверьте заказ.");
  }

  return {
    ...order,
    items,
    subtotal,
    discount: false,
    discountLabel: "",
    discountAmount: 0,
    total: subtotal
  };
}

export function assertCheckoutTotalMatches(claimedTotal, trustedOrder) {
  if (Math.round(Number(claimedTotal || 0)) !== Math.round(Number(trustedOrder?.total || 0))) {
    throw checkoutError("Итоговая сумма заказа изменилась. Обновите корзину перед оплатой.");
  }
}

export function assertDeliveryMinimum(order) {
  if (order?.mode !== "delivery") return;

  const remaining = getDeliveryMinimumRemaining(order.total);
  if (!remaining) return;

  const minimumLabel = new Intl.NumberFormat("ru-RU").format(DELIVERY_MIN_ORDER_AMOUNT);
  const remainingLabel = new Intl.NumberFormat("ru-RU").format(remaining);
  throw checkoutError(
    `Минимальная сумма доставки после скидок — ${minimumLabel} ₽. Добавьте блюда ещё на ${remainingLabel} ₽.`,
    400
  );
}
