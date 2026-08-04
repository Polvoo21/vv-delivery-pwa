const CURRENT_ORDER_KEY = "vv_current_customer_order";

export function saveCurrentCustomerOrder(order) {
  if (typeof window === "undefined" || !order?.id) return order || null;

  const nextOrder = {
    ...order,
    cachedAt: new Date().toISOString()
  };
  window.localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(nextOrder));
  return nextOrder;
}

export function readCurrentCustomerOrder(orderId = "") {
  if (typeof window === "undefined") return null;

  try {
    const order = JSON.parse(window.localStorage.getItem(CURRENT_ORDER_KEY) || "null");
    if (!order?.id) return null;
    if (orderId && String(order.id) !== String(orderId)) return null;
    return order;
  } catch {
    return null;
  }
}

export function getCustomerOrdersPath(orderId = "") {
  if (typeof window === "undefined") {
    return orderId ? `/account/orders/${encodeURIComponent(orderId)}` : "/account/orders";
  }

  const localPrefix =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.pathname.startsWith("/dev")
      ? "/dev"
      : "";
  const base = `${localPrefix}/account/orders`;
  return orderId ? `${base}/${encodeURIComponent(orderId)}` : base;
}

export function getCustomerOrderIdFromPath(pathname = window.location.pathname) {
  const match = String(pathname).match(/^\/(?:dev\/)?account\/orders\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
