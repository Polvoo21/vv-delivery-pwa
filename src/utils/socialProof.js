function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

export function getProductSocialProof(product, summary = {}) {
  const reviewAverage = firstPositiveNumber(summary?.average, product?.reviewAverage);
  const reviewCount = firstPositiveNumber(summary?.count, product?.reviewCount);
  const orderedCount = firstPositiveNumber(
    summary?.orderedCount,
    product?.orderedCount,
    product?.ordersCount
  );

  return {
    reviewAverage,
    reviewCount,
    orderedCount
  };
}

export function formatOrdersCount(value) {
  const count = Math.max(0, Math.round(Number(value) || 0));
  const formatted = new Intl.NumberFormat("ru-RU").format(count);
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "заказ"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "заказа"
        : "заказов";

  return `${formatted} ${word}`;
}
