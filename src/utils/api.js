const API_BASE = String(import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const PATHS = {
  sendOrder: "/api/send-order",
  yooKassaConfig: "/api/payments/yookassa/config",
  yooKassaCreatePayment: "/api/payments/yookassa/create",
  yooKassaPaymentStatus: "/api/payments/yookassa",
  customerOrders: "/api/customer/orders",
  customerPush: "/api/customer/push",
  adminOrders: "/api/admin/orders",
  adminDashboard: "/api/admin/dashboard",
  adminPush: "/api/admin/push",
  adminSessionLogin: "/api/admin/session/login",
  adminSessionMe: "/api/admin/session/me",
  adminSessionLogout: "/api/admin/session/logout",
  adminPasskeys: "/api/admin/passkeys",
  adminPasskeyRegisterOptions: "/api/admin/passkeys/register/options",
  adminPasskeyRegisterVerify: "/api/admin/passkeys/register/verify",
  adminPasskeyAuthOptions: "/api/admin/passkeys/auth/options",
  adminPasskeyAuthVerify: "/api/admin/passkeys/auth/verify",
  pushConfig: "/api/push-config",
  siteStats: "/api/site/stats",
  siteRecentOrders: "/api/site/recent-orders",
  siteDeliverySettings: "/api/site/delivery-settings",
  siteLostItems: "/api/site/lost-items",
  siteGallery: "/api/site/gallery",
  siteCatalog: "/api/site/catalog",
  masterclassEvent: "/api/masterclasses",
  promoCodes: "/api/promo-codes",
  reviewSummary: "/api/reviews/summary",
  productReviews: "/api/reviews/products",
  adminPartners: "/api/admin/partners",
  adminPromoCodes: "/api/admin/promo-codes",
  adminReviews: "/api/admin/reviews",
  adminDeliverySettings: "/api/admin/delivery-settings",
  adminLostItems: "/api/admin/lost-items",
  adminBloggerReviewRewards: "/api/admin/blogger-review-rewards",
  adminGallery: "/api/admin/gallery",
  adminCatalog: "/api/admin/catalog",
  adminCatalogCategories: "/api/admin/catalog/categories",
  adminCatalogProducts: "/api/admin/catalog/products",
  partnerLogin: "/api/partners/login",
  partnerMe: "/api/partners/me",
  customerAuthMe: "/api/auth/me",
  customerAuthOAuthStart: "/api/auth/oauth/start",
  customerAuthLink: "/api/auth/link",
  customerAuthContactPhone: "/api/auth/contact-phone",
  customerAuthPreferences: "/api/auth/preferences",
  customerAuthOnboardingChildren: "/api/auth/onboarding/children",
  customerAuthOnboardingEmail: "/api/auth/onboarding/email",
  customerAuthEmailVerificationConfig: "/api/auth/email-verification/config",
  customerAuthEmailVerificationStart: "/api/auth/email-verification/start",
  customerAuthEmailVerificationVerify: "/api/auth/email-verification/verify",
  customerAuthLogout: "/api/auth/logout"
};

export function apiPath(name) {
  const path = PATHS[name];
  if (!path) {
    throw new Error(`Unknown API path: ${name}`);
  }

  return `${API_BASE}${path}`;
}
