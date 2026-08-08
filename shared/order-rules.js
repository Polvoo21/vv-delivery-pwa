export const DELIVERY_MIN_ORDER_AMOUNT = 1500;

export function getDeliveryMinimumRemaining(total) {
  const normalizedTotal = Number(total);
  const safeTotal = Number.isFinite(normalizedTotal) ? Math.max(0, normalizedTotal) : 0;
  return Math.max(0, DELIVERY_MIN_ORDER_AMOUNT - safeTotal);
}

export function isDeliveryMinimumMet(total) {
  return getDeliveryMinimumRemaining(total) === 0;
}
