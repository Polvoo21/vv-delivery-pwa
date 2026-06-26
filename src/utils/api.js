const API_MODE = import.meta.env.VITE_API_MODE === "vps" ? "vps" : "netlify";
const API_BASE = String(import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const PATHS = {
  netlify: {
    sendOrder: "/.netlify/functions/send-order",
    adminOrders: "/.netlify/functions/admin-orders",
    adminPush: "/.netlify/functions/admin-push",
    pushConfig: "/.netlify/functions/push-config"
  },
  vps: {
    sendOrder: "/api/send-order",
    adminOrders: "/api/admin/orders",
    adminPush: "/api/admin/push",
    pushConfig: "/api/push-config"
  }
};

export function apiPath(name) {
  const path = PATHS[API_MODE][name];
  if (!path) {
    throw new Error(`Unknown API path: ${name}`);
  }

  return `${API_BASE}${path}`;
}
