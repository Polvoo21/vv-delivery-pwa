const API_BASE = String(import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const PATHS = {
  sendOrder: "/api/send-order",
  adminOrders: "/api/admin/orders",
  adminPush: "/api/admin/push",
  adminMaxTest: "/api/admin/max-test",
  pushConfig: "/api/push-config",
  promoCodes: "/api/promo-codes",
  adminPartners: "/api/admin/partners",
  partnerLogin: "/api/partners/login",
  partnerMe: "/api/partners/me"
};

export function apiPath(name) {
  const path = PATHS[name];
  if (!path) {
    throw new Error(`Unknown API path: ${name}`);
  }

  return `${API_BASE}${path}`;
}
