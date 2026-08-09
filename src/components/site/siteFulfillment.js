import { DELIVERY_STORAGE_KEY } from "./siteCoreData";

const emptyFulfillment = {
  mode: "delivery",
  address: "",
  coords: null,
  entrance: "",
  code: "",
  flat: "",
  floor: "",
  addressComment: ""
};

function normalizeFulfillment(fulfillment = {}) {
  return {
    ...emptyFulfillment,
    ...fulfillment,
    mode: fulfillment.mode === "pickup" ? "pickup" : "delivery"
  };
}

export function readSiteFulfillment() {
  if (typeof window === "undefined") return normalizeFulfillment();

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    return normalizeFulfillment(parsedState.fulfillment);
  } catch {
    return normalizeFulfillment();
  }
}

export function saveSiteFulfillment(fulfillment) {
  if (typeof window === "undefined") return normalizeFulfillment(fulfillment);

  const nextFulfillment = normalizeFulfillment(fulfillment);

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({ ...parsedState, fulfillment: nextFulfillment })
    );
  } catch {
    window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify({ fulfillment: nextFulfillment }));
  }

  return nextFulfillment;
}
