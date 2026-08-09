const DELIVERY_MIN_ORDER_AMOUNT = 1500;
function getDeliveryMinimumRemaining(total) {
  const normalizedTotal = Number(total);
  const safeTotal = Number.isFinite(normalizedTotal) ? Math.max(0, normalizedTotal) : 0;
  return Math.max(0, DELIVERY_MIN_ORDER_AMOUNT - safeTotal);
}
export {
  DELIVERY_MIN_ORDER_AMOUNT as D,
  getDeliveryMinimumRemaining as g
};
