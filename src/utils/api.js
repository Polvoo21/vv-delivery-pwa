export const apiMode = import.meta.env.VITE_API_MODE === "vps" ? "vps" : "netlify";
const API_BASE = String(import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const PATHS = {
  netlify: {
    sendOrder: "/.netlify/functions/send-order",
    adminOrders: "/.netlify/functions/admin-orders",
    adminPush: "/.netlify/functions/admin-push",
    pushConfig: "/.netlify/functions/push-config",
    promoCodes: "/api/promo-codes",
    adminPartners: "/api/admin/partners",
    partnerLogin: "/api/partners/login",
    partnerMe: "/api/partners/me"
  },
  vps: {
    sendOrder: "/api/send-order",
    adminOrders: "/api/admin/orders",
    adminPush: "/api/admin/push",
    pushConfig: "/api/push-config",
    promoCodes: "/api/promo-codes",
    adminPartners: "/api/admin/partners",
    partnerLogin: "/api/partners/login",
    partnerMe: "/api/partners/me"
  }
};

export function apiPath(name) {
  const path = PATHS[apiMode][name];
  if (!path) {
    throw new Error(`Unknown API path: ${name}`);
  }

  return `${API_BASE}${path}`;
}
