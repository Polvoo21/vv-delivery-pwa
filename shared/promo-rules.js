function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalPositiveNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = finiteNumber(value, 0);
  return number > 0 ? number : null;
}

function optionalPositiveInteger(value) {
  const number = optionalPositiveNumber(value);
  return number === null ? null : Math.max(1, Math.floor(number));
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
}

function getItemSubtotal(item) {
  if (!item || typeof item !== "object") return 0;
  const qty = Math.max(0, finiteNumber(item.qty ?? item.quantity, 0));
  const explicitLineTotal = finiteNumber(item.lineTotal, -1);
  if (explicitLineTotal >= 0) return explicitLineTotal;
  return Math.max(0, finiteNumber(item.unitPrice ?? item.price, 0) * qty);
}

function itemMatchesScope(item, promo) {
  const scopeType = ["categories", "products"].includes(promo?.scopeType)
    ? promo.scopeType
    : "all";

  if (scopeType === "all") return true;
  if (scopeType === "categories") {
    const categoryId = String(item?.categoryId || item?.category || "").trim();
    return normalizeIdList(promo?.categoryIds).includes(categoryId);
  }

  const productId = String(item?.productId || item?.id || "").trim();
  return normalizeIdList(promo?.productIds).includes(productId);
}

export function getPromoRuleSummary(promo = {}) {
  const scopeType = ["categories", "products"].includes(promo.scopeType)
    ? promo.scopeType
    : "all";
  const categoryCount = normalizeIdList(promo.categoryIds).length;
  const productCount = normalizeIdList(promo.productIds).length;

  if (scopeType === "categories") {
    return categoryCount
      ? `${categoryCount} ${categoryCount === 1 ? "категория" : categoryCount < 5 ? "категории" : "категорий"}`
      : "Категории не выбраны";
  }
  if (scopeType === "products") {
    return productCount
      ? `${productCount} ${productCount === 1 ? "блюдо" : productCount < 5 ? "блюда" : "блюд"}`
      : "Блюда не выбраны";
  }
  return "Всё меню";
}

export function evaluatePromoCart(promo = {}, items = [], context = {}) {
  const cartItems = Array.isArray(items) ? items : [];
  const subtotal = cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const eligibleSubtotal = cartItems.reduce(
    (sum, item) => sum + (itemMatchesScope(item, promo) ? getItemSubtotal(item) : 0),
    0
  );
  const usageLimit = optionalPositiveInteger(promo.usageLimit);
  const perCustomerLimit = optionalPositiveInteger(promo.perCustomerLimit);
  const countedUses = Math.max(
    0,
    finiteNumber(
      context.totalUsageCount,
      finiteNumber(promo.countedUses, finiteNumber(promo.usageCount, 0))
    )
  );
  const customerUsageCount = Math.max(0, finiteNumber(context.customerUsageCount, 0));
  const minimumOrderAmount = optionalPositiveNumber(promo.minimumOrderAmount);
  const maximumDiscountAmount = optionalPositiveNumber(promo.maximumDiscountAmount);
  const scopeType = ["categories", "products"].includes(promo.scopeType)
    ? promo.scopeType
    : "all";

  if (usageLimit !== null && countedUses >= usageLimit) {
    return {
      eligible: false,
      state: "exhausted",
      message: "Лимит использований этого промокода закончился.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }

  if (perCustomerLimit !== null && customerUsageCount >= perCustomerLimit) {
    return {
      eligible: false,
      state: "customer-limit",
      message: "Вы уже использовали этот промокод максимальное число раз.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }

  if (minimumOrderAmount !== null && subtotal < minimumOrderAmount) {
    return {
      eligible: false,
      state: "minimum-order",
      message: `Промокод действует при заказе от ${Math.round(minimumOrderAmount)} ₽.`,
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }

  if (scopeType !== "all" && eligibleSubtotal <= 0) {
    return {
      eligible: false,
      state: "scope-mismatch",
      message:
        scopeType === "categories"
          ? "В корзине нет блюд из категорий этого промокода."
          : "В корзине нет блюд, на которые действует этот промокод.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }

  const percent = Math.max(0, Math.min(100, finiteNumber(promo.percent, 0)));
  const calculatedDiscount = Math.round((eligibleSubtotal * percent) / 100);
  const discount =
    maximumDiscountAmount === null
      ? calculatedDiscount
      : Math.min(calculatedDiscount, Math.round(maximumDiscountAmount));

  if (discount <= 0) {
    return {
      eligible: false,
      state: "no-discount",
      message: "Промокод не даёт скидку для текущей корзины.",
      subtotal,
      eligibleSubtotal,
      discount: 0
    };
  }

  return {
    eligible: true,
    state: "eligible",
    message: "",
    subtotal,
    eligibleSubtotal,
    discount
  };
}
