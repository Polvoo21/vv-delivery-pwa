export const YANDEX_METRIKA_COUNTER_ID = 111415863;

export const METRIKA_GOALS = Object.freeze({
  ADD_TO_CART: "add_to_cart",
  CHECKOUT_START: "checkout_start",
  ORDER_CREATED: "order_created",
  PAYMENT_START: "payment_start",
  PAYMENT_SUCCESS: "payment_success",
  PHONE_CLICK: "phone_click",
  MASTERCLASS_OPEN: "masterclass_open",
  MASTERCLASS_SIGNUP: "masterclass_signup",
  MASTERCLASS_PAYMENT: "masterclass_payment",
  MASTERCLASS_PAID: "masterclass_paid"
});

export function reachMetrikaGoal(goal, params = {}) {
  if (typeof window === "undefined" || typeof window.ym !== "function" || !goal) {
    return;
  }

  window.ym(YANDEX_METRIKA_COUNTER_ID, "reachGoal", goal, params);
}

export function initMetrikaTracking() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  if (window.__vvMetrikaTrackingReady) {
    return;
  }

  window.__vvMetrikaTrackingReady = true;
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;

    const explicitGoal = link.dataset.metrikaGoal;
    if (explicitGoal) {
      reachMetrikaGoal(explicitGoal, {
        path: window.location.pathname,
        link_url: link.href
      });
    }

    if (link.protocol === "tel:") {
      reachMetrikaGoal(METRIKA_GOALS.PHONE_CLICK, {
        path: window.location.pathname
      });
    }
  });
}
