const PENDING_PAYMENT_KEY = "vv_pending_payment_order";

export const ONLINE_PAYMENT_IDS = new Set(["online-card"]);

export function isOnlinePayment(paymentId) {
  return ONLINE_PAYMENT_IDS.has(paymentId);
}

export function savePendingPayment(payload) {
  if (typeof window === "undefined") return null;

  const pending = {
    ...payload,
    createdAt: new Date().toISOString()
  };
  window.localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));
  return pending;
}

export function readPendingPayment() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(PENDING_PAYMENT_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PENDING_PAYMENT_KEY);
  }
}
