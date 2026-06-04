const STORAGE_KEY = "vv_delivery_mvp_state";
const OPENED_KEY = "vv_delivery_has_opened";

export const initialAppData = {
  fulfillment: {
    mode: "delivery",
    address: "",
    coords: null,
    entrance: "",
    flat: "",
    floor: "",
    addressComment: ""
  },
  customer: {
    name: "",
    phone: ""
  },
  cart: [],
  promo: null,
  offer: {
    active: false,
    percent: 25,
    label: "-25% на первые 3 доставки"
  },
  orders: []
};

export function loadAppData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...initialAppData,
      ...parsed,
      fulfillment: {
        ...initialAppData.fulfillment,
        ...(parsed.fulfillment || {})
      },
      customer: {
        ...initialAppData.customer,
        ...(parsed.customer || {})
      },
      offer: {
        ...initialAppData.offer,
        ...(parsed.offer || {})
      },
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : []
    };
  } catch {
    return initialAppData;
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAppData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OPENED_KEY);
}

export function hasOpenedBefore() {
  return localStorage.getItem(OPENED_KEY) === "1";
}

export function markOpened() {
  localStorage.setItem(OPENED_KEY, "1");
}
