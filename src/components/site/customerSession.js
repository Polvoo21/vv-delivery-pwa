import { apiPath } from "../../utils/api";

const SITE_CUSTOMER_STORAGE_KEY = "vv_site_customer";

function isLocalPreview() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function readLocalSiteCustomer() {
  if (typeof window === "undefined" || !isLocalPreview()) return null;

  try {
    return JSON.parse(window.localStorage.getItem(SITE_CUSTOMER_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function rememberSiteCustomer(customer) {
  if (!customer?.id || typeof window === "undefined") return customer || null;

  if (isLocalPreview() || String(customer.id).startsWith("local_")) {
    window.localStorage.setItem(SITE_CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
  }

  return customer;
}

export function forgetSiteCustomer() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SITE_CUSTOMER_STORAGE_KEY);
  }
}

export async function fetchCurrentSiteCustomer() {
  try {
    const response = await fetch(apiPath("customerAuthMe"), { credentials: "include" });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.ok !== false && data.customer) {
      return data.customer;
    }
  } catch {
    // Local preview can run without API.
  }

  return readLocalSiteCustomer();
}
