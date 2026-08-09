import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb, initDb, pool } from "./db.js";
import {
  attachOrderPayment,
  cancelOrder,
  cancelCustomerOrder,
  closeOrder,
  getCustomerOrderById,
  getOrderById,
  getOrderByPaymentId,
  getManagerDashboard,
  listCustomerOrders,
  listOrders,
  listPublicRecentDeliveredOrders,
  markOrderPaymentCreateFailed,
  ORDER_STATUSES,
  prepareOrderPaymentRetry,
  recordOrderRefund,
  deleteAdminPushSubscriptionByEndpoint,
  saveAdminPushSubscription,
  saveCustomerPushSubscription,
  saveOrder,
  syncOrderPayment,
  syncOrderRefund,
  requestCustomerOrderChange,
  updateOrderDetails,
  updateOrderStatus
} from "./orders.js";
import { validateOrder } from "./order-utils.js";
import { assertCheckoutTotalMatches, assertDeliveryMinimum, priceCheckoutOrder } from "./checkout-pricing.js";
import {
  buildOAuthStartUrl,
  clearOAuthStateCookie,
  clearCustomerSessionCookie,
  completeOAuthLogin,
  destroyCustomerSession,
  getCustomerEmailVerificationConfig,
  getCustomerByRequest,
  getIdentityLinkChallenge,
  setCustomerChildren,
  setCustomerContactPhone,
  setCustomerOnboardingEmail,
  setCustomerPreferences,
  startCustomerEmailVerification,
  verifyCustomerEmail,
  setCustomerSessionCookie
} from "./customer-auth.js";
import {
  clearAdminSessionCookie,
  createAdminPasskeyAuthenticationOptions,
  createAdminPasskeyRegistrationOptions,
  createAdminSession,
  deleteAdminPasskey,
  destroyAdminSession,
  finishAdminPasskeyAuthentication,
  finishAdminPasskeyRegistration,
  getAdminSessionByRequest,
  listAdminPasskeys,
  setAdminSessionCookie
} from "./admin-auth.js";
import {
  getPublicVapidKey,
  sendAdminNewOrderPush,
  sendAdminTestPush,
  sendStatusPush
} from "./push.js";
import {
  createCommissionForOrder,
  createPartner,
  DEV_PARTNER_TOKEN,
  getAdminPartnerDetails,
  getDevPartner,
  getDevPartnerDashboard,
  getPartnerByToken,
  getPartnerDashboard,
  listPartners,
  loginPartner,
  recordPartnerPayout,
  resolvePromoCode,
  syncCommissionStatus,
  updatePartnerAccess
} from "./partners.js";
import {
  applyManagedPromoToOrder,
  confirmManagedPromoUse,
  createManagedPromoCode,
  getManagedPromoCodeByCode,
  listManagedPromoCodes,
  releaseManagedPromoUse,
  reserveManagedPromoUse,
  resolveManagedPromoCode,
  updateManagedPromoCode
} from "./promo-codes.js";
import {
  createProductReview,
  getProductReviewSummary,
  isDemoReviewSubmissionEnabled,
  listAdminReviews,
  listProductReviews,
  MAX_REVIEW_PHOTOS,
  moderateReview
} from "./reviews.js";
import {
  archiveLostItem,
  createLostItem,
  listAdminLostItems,
  listPublicLostItems,
  MAX_LOST_ITEM_PHOTOS,
  MAX_LOST_ITEM_UPLOAD_BYTES
} from "./lost-items.js";
import {
  createBloggerReviewReward,
  listBloggerReviewRewards,
  MAX_BLOGGER_REWARD_FILES,
  MAX_BLOGGER_REWARD_UPLOAD_BYTES,
  updateBloggerReviewRewardStatus
} from "./blogger-review-rewards.js";
import {
  archiveGalleryItem,
  createGalleryItem,
  listAdminGalleryItems,
  listPublicGalleryItems,
  MAX_GALLERY_MEDIA_FILES,
  MAX_GALLERY_UPLOAD_BYTES,
  updateGalleryItem
} from "./gallery.js";
import {
  archiveCatalogProduct,
  createCatalogCategory,
  createCatalogProduct,
  listAdminCatalog,
  listPublicCatalog,
  MAX_CATALOG_MEDIA_FILES,
  MAX_CATALOG_UPLOAD_BYTES,
  MAX_CATALOG_VIDEO_UPLOAD_BYTES,
  removeCatalogProductVideo,
  saveCatalogProductVideo,
  updateCatalogCategory,
  updateCatalogProduct
} from "./catalog.js";
import { getDeliverySettings, saveDeliverySettings } from "./settings.js";
import {
  assertYooKassaPaymentMatchesOrder,
  createYooKassaPayment,
  createYooKassaRefund,
  getYooKassaPayment,
  getYooKassaRefund,
  getYooKassaPublicConfig,
  isYooKassaConfigured
} from "./yookassa.js";
import {
  assertMasterclassPaymentOpen,
  attachMasterclassPayment,
  createMasterclassRegistration,
  getMasterclassPaymentRegistration,
  getMasterclassState,
  markMasterclassPaymentCreateFailed,
  prepareMasterclassPaymentRetry,
  syncMasterclassPayment
} from "./masterclass.js";
import {
  getMasterclassEventByPath,
  INDIVIDUAL_MASTERCLASS_PATH,
  MASTERCLASSES_PATH,
  MASTERCLASS_EVENTS,
  SITE_ORIGIN
} from "../shared/masterclass-events.js";
import {
  getSiteSeoPage,
  STATIC_SITE_SEO_PAGES
} from "../shared/site-seo.js";
import {
  notifyMaxAudit,
  notifyMaxMasterclassRegistration,
  notifyMaxNewPaidOrder,
  notifyMaxNewReview,
  notifyMaxOrderChangeRequest,
  notifyMaxOrderStatus,
  notifyMaxPaymentProblem,
  notifyMaxRefund,
  notifyMaxSecurityAlert,
  notifyMaxTechnicalAlert,
  startMaxNotificationService,
  stopMaxNotificationService
} from "./max-notifications.js";
import {
  canonicalRedirectMiddleware,
  createSpaFallbackHandler
} from "./site-routing.js";
import { buildDefaultPageSchema, renderSeoDocument } from "./site-seo.js";
import { setStaticCacheHeaders } from "./cache-headers.js";
import { renderHomeApp } from "./home-renderer.js";
import { inlineHomeStyles } from "./home-styles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const app = express();
const port = Number(process.env.PORT || 3000);
const reviewUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_REVIEW_PHOTOS,
    fileSize: 8 * 1024 * 1024
  }
});
const lostItemUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_LOST_ITEM_PHOTOS,
    fileSize: MAX_LOST_ITEM_UPLOAD_BYTES
  }
});
const bloggerRewardUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_BLOGGER_REWARD_FILES,
    fileSize: MAX_BLOGGER_REWARD_UPLOAD_BYTES
  }
});
const galleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_GALLERY_MEDIA_FILES,
    fileSize: MAX_GALLERY_UPLOAD_BYTES
  }
});
const catalogUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_CATALOG_MEDIA_FILES,
    fileSize: MAX_CATALOG_UPLOAD_BYTES
  }
});
const catalogVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: MAX_CATALOG_VIDEO_UPLOAD_BYTES
  }
});

const ADMIN_ROLE_LABELS = {
  manager: "Руководитель",
  admin: "Администратор"
};

app.disable("x-powered-by");
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((value) => value.trim()) : true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../public/uploads"), {
    maxAge: "30d",
    index: false
  })
);

function jsonError(response, status, error, extra = {}) {
  if (Number(status) >= 500) {
    void notifyMaxTechnicalAlert({
      method: response.req?.method || "API",
      route: response.req?.originalUrl || response.req?.url || "unknown",
      status,
      message: error,
      details: extra?.details
    });
  }

  return response.status(status).json({
    ok: false,
    error,
    ...extra
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isDevLoginEnabled(request) {
  const host = request.hostname || "";
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  return (
    process.env.VV_DEV_LOGIN === "1" ||
    process.env.NODE_ENV === "development" ||
    localHosts.has(host)
  );
}

function cleanLogin(value) {
  return String(value || "").trim().toLowerCase();
}

function decodeHeaderCredential(value) {
  const text = String(value || "");
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function makeAdminAccount(role, login, password) {
  if (!password) return null;

  return {
    role,
    login: cleanLogin(login),
    password,
    label: ADMIN_ROLE_LABELS[role] || "Сотрудник"
  };
}

function getAdminAccounts(request) {
  const managerPassword = process.env.ADMIN_MANAGER_PASSWORD || process.env.ADMIN_PASSWORD || "рук";
  const staffPassword = process.env.ADMIN_STAFF_PASSWORD || "админ";
  const accounts = [
    makeAdminAccount("manager", process.env.ADMIN_MANAGER_LOGIN || process.env.ADMIN_LOGIN || "рук", managerPassword),
    makeAdminAccount("manager", "ruk", process.env.ADMIN_MANAGER_PASSWORD || process.env.ADMIN_PASSWORD || "ruk"),
    makeAdminAccount("manager", "рук", "рук"),
    makeAdminAccount("admin", process.env.ADMIN_STAFF_LOGIN || "админ", staffPassword),
    makeAdminAccount("admin", "admin", process.env.ADMIN_STAFF_PASSWORD || "admin"),
    makeAdminAccount("admin", "админ", "админ")
  ].filter(Boolean);

  if (isDevLoginEnabled(request)) {
    accounts.push(makeAdminAccount("manager", "manager", "dev"));
    accounts.push(makeAdminAccount("admin", "admin", "dev"));
  }

  return accounts;
}

function getAdminAccountByLogin(request, login) {
  const normalizedLogin = cleanLogin(login);
  return getAdminAccounts(request).find((account) => account.login === normalizedLogin) || null;
}

function publicAdminAccount(account) {
  return {
    login: account.login,
    role: account.role,
    label: account.label
  };
}

function findAdminAccount(request) {
  const requestedLogin = cleanLogin(decodeHeaderCredential(request.get("x-admin-login")));
  const requestedPassword = decodeHeaderCredential(request.get("x-admin-password"));
  const accounts = getAdminAccounts(request);

  if (!requestedPassword) return null;

  if (requestedLogin) {
    return accounts.find((account) => account.login === requestedLogin && account.password === requestedPassword) || null;
  }

  return accounts.find((account) => account.role === "manager" && account.password === requestedPassword) || null;
}

async function requireAdmin(request, response, next) {
  try {
    const session = await getAdminSessionByRequest(request);
    if (session) {
      const sessionAccount = getAdminAccountByLogin(request, session.login);
      if (sessionAccount && sessionAccount.role === session.role) {
        request.adminAccount = publicAdminAccount(sessionAccount);
        return next();
      }
    }

    const account = findAdminAccount(request);
    if (account) {
      request.adminAccount = publicAdminAccount(account);
      return next();
    }

    return jsonError(response, 401, "Неверный логин или пароль");
  } catch (error) {
    return jsonError(response, 500, "Не удалось проверить сессию сотрудника", {
      details: error.message || String(error)
    });
  }
}

function requireAdminRole(...roles) {
  return (request, response, next) => {
    if (!request.adminAccount || roles.includes(request.adminAccount.role)) {
      return next();
    }

    return jsonError(response, 403, "Недостаточно прав для этого раздела");
  };
}

async function requirePartner(request, response, next) {
  const header = request.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (token === DEV_PARTNER_TOKEN && isDevLoginEnabled(request)) {
    request.partner = getDevPartner();
    return next();
  }

  const partner = await getPartnerByToken(token);

  if (!partner) {
    return jsonError(response, 401, "Нужно войти в кабинет партнёра");
  }

  request.partner = partner;
  return next();
}

async function withPartnerAttribution(order, promo) {
  if (!promo) return order;
  if (promo.type === "managed") {
    const catalog = await listPublicCatalog();
    const productById = new Map((catalog.products || []).map((product) => [product.id, product]));
    const trustedItems = (order.items || []).map((item) => {
      const productId = String(item?.productId || item?.id || "").trim();
      const product = productById.get(productId);
      if (!product) {
        const error = new Error(`Блюдо «${item?.name || productId}» больше недоступно. Обновите корзину.`);
        error.statusCode = 409;
        throw error;
      }
      return {
        ...item,
        id: product.id,
        productId: product.id,
        category: product.categoryId || product.category || "",
        categoryId: product.categoryId || product.category || ""
      };
    });
    return applyManagedPromoToOrder({ ...order, items: trustedItems }, promo);
  }

  const attributedOrder = {
    ...order,
    promoCode: promo.code,
    discount: true,
    discountLabel: promo.label,
    subtotal: Number(order.subtotal || order.total || 0),
    discountAmount: Math.max(
      0,
      Math.round((Number(order.subtotal || order.total || 0) * Number(promo.percent || 0)) / 100)
    )
  };

  attributedOrder.total = Math.max(0, attributedOrder.subtotal - attributedOrder.discountAmount);

  if (!promo.partner?.id) return attributedOrder;

  const commissionPercent = Number(promo.partner.commissionPercent || 0);
  const commissionAmount = Math.max(0, Math.round((Number(order.total || 0) * commissionPercent) / 100));

  return {
    ...attributedOrder,
    partner: promo.partner,
    partnerCommission: {
      commissionPercent,
      commissionAmount
    }
  };
}

async function resolveCheckoutPromoCode(code) {
  const partnerPromo = await resolvePromoCode(code);
  if (partnerPromo) return partnerPromo;
  return resolveManagedPromoCode(code);
}

async function finalizePaidOrder(syncResult) {
  const order = syncResult?.order;
  if (!order || !syncResult.becamePaid) {
    return {
      partnerCommission: null,
      promoRedemption: null,
      adminPush: null,
      maxNotification: null
    };
  }

  let partnerCommission = null;
  let promoRedemption = null;
  let adminPush = null;
  let maxNotification = null;

  try {
    promoRedemption = await confirmManagedPromoUse(order);
  } catch (error) {
    console.error("Paid order was confirmed but promo use was not recorded", error);
    await notifyMaxTechnicalAlert({
      method: "ORDER",
      route: `order/${order.id}/promo`,
      status: 500,
      message: "Оплаченный заказ создан, но применение промокода не зафиксировано",
      details: error.message || String(error)
    });
  }

  try {
    partnerCommission = await createCommissionForOrder(order);
  } catch (error) {
    console.error("Paid order was confirmed but partner commission was not created", error);
    await notifyMaxTechnicalAlert({
      method: "ORDER",
      route: `order/${order.id}/partner-commission`,
      status: 500,
      message: "Оплаченный заказ создан, но комиссия партнёра не начислена",
      details: error.message || String(error)
    });
  }

  try {
    adminPush = await sendAdminNewOrderPush(order);
  } catch (error) {
    adminPush = {
      ok: false,
      reason: "admin-push-failed",
      message: error.message || String(error)
    };
    console.error("Paid order was confirmed but admin push was not sent", error);
  }

  maxNotification = await notifyMaxNewPaidOrder(order);

  if (!adminPush?.ok) {
    await notifyMaxTechnicalAlert({
      method: "PUSH",
      route: `order/${order.id}/admin-push`,
      status: 503,
      message: "PWA-push о новом заказе не доставлен администраторам",
      details: adminPush?.reason || adminPush?.message || ""
    });
  }

  return {
    partnerCommission,
    promoRedemption,
    adminPush,
    maxNotification
  };
}

async function syncYooKassaOrder(order, eventType) {
  if (!order?.paymentId) {
    const error = new Error("Платеж ЮKassa для заказа еще не создан");
    error.statusCode = 409;
    throw error;
  }

  const payment = await getYooKassaPayment(order.paymentId);
  assertYooKassaPaymentMatchesOrder(payment, order);
  const syncResult = await syncOrderPayment(order.id, payment, eventType);
  const sideEffects = await finalizePaidOrder(syncResult);
  if (syncResult.order?.paymentStatus === "canceled") {
    await releaseManagedPromoUse(syncResult.order.id);
    await notifyMaxPaymentProblem(
      syncResult.order,
      "Платёж отменён платёжным провайдером"
    );
  }
  return {
    ...syncResult,
    ...sideEffects,
    providerPayment: payment
  };
}

async function syncYooKassaMasterclass(registration, eventType = "payment.checked") {
  if (!registration?.paymentId) {
    const error = new Error("Платеж ЮKassa для записи еще не создан");
    error.statusCode = 409;
    throw error;
  }

  const payment = await getYooKassaPayment(registration.paymentId);
  assertYooKassaPaymentMatchesOrder(payment, registration);
  const syncResult = await syncMasterclassPayment(
    registration.eventId,
    registration.id,
    payment,
    eventType
  );
  if (syncResult.becamePaid) {
    await notifyMaxMasterclassRegistration(syncResult.registration, syncResult.event);
  }
  return { ...syncResult, providerPayment: payment };
}

function publicMasterclassPaymentState(registration = {}) {
  return {
    id: registration.id,
    eventId: registration.eventId,
    participantCount: Number(registration.participantCount || 0),
    amount: Number(registration.amount || 0),
    status: registration.status,
    paymentStatus: registration.paymentStatus,
    paymentProvider: registration.paymentProvider,
    paymentId: registration.paymentId || "",
    paymentUrl: registration.paymentUrl || "",
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt
  };
}

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("select 1");
    response.json({
      ok: true,
      service: "vv-delivery-api",
      storage: "postgres"
    });
  } catch (error) {
    jsonError(response, 500, "PostgreSQL недоступен", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/stats", async (_request, response) => {
  try {
    const result = await pool.query(
      `
        select count(*)::int as delivered_orders_total
        from orders
        where status = 'delivered'
          and coalesce(payment_provider, '') <> 'demo'
      `
    );

    return response.json({
      ok: true,
      deliveredOrdersTotal: Number(result.rows[0]?.delivered_orders_total || 0)
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить статистику сайта", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/recent-orders", async (_request, response) => {
  try {
    const orders = await listPublicRecentDeliveredOrders(10);

    return response.json({
      ok: true,
      orders
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить последние заказы", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/delivery-settings", async (_request, response) => {
  try {
    const settings = await getDeliverySettings(pool);
    return response.json({
      ok: true,
      settings
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить настройки доставки", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/lost-items", async (_request, response) => {
  try {
    const items = await listPublicLostItems();
    return response.json({
      ok: true,
      items
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить потеряшки", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/gallery", async (_request, response) => {
  try {
    const items = await listPublicGalleryItems();
    return response.json({
      ok: true,
      items
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить галерею", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/site/catalog", async (_request, response) => {
  try {
    const catalog = await listPublicCatalog();
    return response.json({
      ok: true,
      catalog
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось получить каталог", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/masterclasses/:eventId", async (request, response) => {
  try {
    const event = await getMasterclassState(request.params.eventId);
    return response.json({
      ok: true,
      event
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить мастер-класс", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/masterclasses/:eventId/registrations", async (request, response) => {
  try {
    const registration = await createMasterclassRegistration(
      request.params.eventId,
      request.body || {},
      {
        ip: request.ip || "",
        userAgent: request.get("user-agent") || ""
      }
    );
    return response.status(201).json({
      ok: true,
      registration
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось сохранить запись", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/masterclasses/:eventId/registrations/:registrationId/payment",
  async (request, response) => {
    if (!isYooKassaConfigured()) {
      return jsonError(response, 503, "ЮKassa еще не подключена. Попробуйте немного позже.");
    }

    const { eventId, registrationId } = request.params;
    let registration;
    let creatingPayment = false;
    try {
      registration = await getMasterclassPaymentRegistration(eventId, registrationId);
      if (registration.paymentStatus === "paid") {
        return response.json({ ok: true, paid: true, registration: publicMasterclassPaymentState(registration) });
      }

      assertMasterclassPaymentOpen(eventId);

      if (registration.paymentId) {
        const synced = await syncYooKassaMasterclass(registration, "payment.customer_retried");
        if (synced.registration.paymentStatus !== "canceled") {
          return response.json({
            ok: true,
            paid: synced.registration.paymentStatus === "paid",
            registration: publicMasterclassPaymentState(synced.registration),
            paymentId: synced.registration.paymentId,
            paymentStatus: synced.registration.paymentStatus,
            paymentUrl: synced.providerPayment?.confirmation?.confirmation_url || synced.registration.paymentUrl || "",
            mode: getYooKassaPublicConfig().mode,
            test: Boolean(synced.providerPayment?.test)
          });
        }
        await prepareMasterclassPaymentRetry(eventId, registrationId);
        registration = await getMasterclassPaymentRegistration(eventId, registrationId);
      }

      creatingPayment = true;
      const payment = await createYooKassaPayment(registration, { request });
      let savedRegistration = await attachMasterclassPayment(eventId, registrationId, payment);
      if (payment.paid || payment.status === "succeeded") {
        const syncResult = await syncMasterclassPayment(eventId, registrationId, payment, "payment.created_succeeded");
        savedRegistration = syncResult.registration;
        if (syncResult.becamePaid) {
          await notifyMaxMasterclassRegistration(syncResult.registration, syncResult.event);
        }
      }
      return response.json({
        ok: true,
        paid: payment.paid,
        registration: publicMasterclassPaymentState(savedRegistration),
        paymentId: payment.id,
        paymentStatus: payment.status,
        paymentUrl: payment.confirmationUrl,
        mode: getYooKassaPublicConfig().mode,
        test: payment.test
      });
    } catch (error) {
      if (creatingPayment && registration?.id) {
        await markMasterclassPaymentCreateFailed(eventId, registrationId, error.message).catch(() => {});
      }
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось создать оплату мастер-класса", {
        details: error.details || undefined
      });
    }
  }
);

app.get(
  "/api/masterclasses/:eventId/registrations/:registrationId/payment/status",
  async (request, response) => {
    try {
      const registration = await getMasterclassPaymentRegistration(
        request.params.eventId,
        request.params.registrationId
      );
      const synced = await syncYooKassaMasterclass(registration, "payment.customer_checked");
      return response.json({
        ok: true,
        paid: synced.registration.paymentStatus === "paid",
        paymentStatus: synced.registration.paymentStatus,
        registration: publicMasterclassPaymentState(synced.registration),
        event: synced.event
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось проверить оплату мастер-класса", {
        details: error.details || undefined
      });
    }
  }
);

app.get("/api/push-config", (_request, response) => {
  const publicKey = getPublicVapidKey();
  if (!publicKey) {
    return jsonError(response, 500, "VAPID_PUBLIC_KEY не задан на сервере");
  }

  return response.json({
    ok: true,
    publicKey
  });
});

app.get("/api/promo-codes/:code", async (request, response) => {
  try {
    const partnerPromo = await resolvePromoCode(request.params.code);
    const managedPromo = partnerPromo ? null : await getManagedPromoCodeByCode(request.params.code);
    const promo = partnerPromo || (managedPromo?.availability?.active ? managedPromo : null);

    if (managedPromo && !managedPromo.availability?.active) {
      return jsonError(response, 409, managedPromo.availability?.message || "Промокод сейчас не действует", {
        state: managedPromo.availability?.state
      });
    }

    if (!promo) {
      return jsonError(response, 404, "Промокод не найден");
    }

    return response.json({
      ok: true,
      promo: {
        code: promo.code,
        percent: promo.percent,
        label: promo.label,
        partnerName: promo.partner?.name || "",
        type: promo.partner?.id ? "partner" : "managed",
        weekdays: promo.weekdays || [],
        scopeType: promo.scopeType || "all",
        categoryIds: promo.categoryIds || [],
        productIds: promo.productIds || [],
        usageLimit: promo.usageLimit ?? null,
        usageCount: promo.usageCount || 0,
        reservedCount: promo.reservedCount || 0,
        countedUses: promo.countedUses || 0,
        perCustomerLimit: promo.perCustomerLimit ?? null,
        minimumOrderAmount: promo.minimumOrderAmount ?? null,
        maximumDiscountAmount: promo.maximumDiscountAmount ?? null
      }
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось проверить промокод", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/auth/me", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    return response.json({
      ok: true,
      customer
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось проверить авторизацию", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/customer/push", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const subscription = await saveCustomerPushSubscription(customer.id, request.body?.subscription);
    return response.json({
      ok: true,
      subscription
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось включить уведомления");
  }
});

app.get("/api/customer/orders", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const orders = await listCustomerOrders(customer.id);
    return response.json({
      ok: true,
      orders
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить заказы", {
      details: error.details || undefined
    });
  }
});

app.get("/api/customer/orders/:id", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const order = await getCustomerOrderById(request.params.id, customer.id);
    if (!order) return jsonError(response, 404, "Заказ не найден");
    return response.json({
      ok: true,
      order
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить заказ", {
      details: error.details || undefined
    });
  }
});

app.post("/api/customer/orders/:id/cancel", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const cancelledOrder = await cancelCustomerOrder(
      request.params.id,
      customer.id,
      request.body?.reason
    );
    await Promise.allSettled([
      syncCommissionStatus(cancelledOrder),
      releaseManagedPromoUse(cancelledOrder.id),
      sendStatusPush(cancelledOrder),
      notifyMaxOrderStatus(cancelledOrder)
    ]);
    const order = await getCustomerOrderById(cancelledOrder.id, customer.id);

    return response.json({
      ok: true,
      order
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось отменить заказ", {
      details: error.details || undefined
    });
  }
});

app.post("/api/customer/orders/:id/change-request", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const updatedOrder = await requestCustomerOrderChange(
      request.params.id,
      customer.id,
      request.body?.text
    );
    const maxNotification = await notifyMaxOrderChangeRequest(updatedOrder);
    const order = await getCustomerOrderById(updatedOrder.id, customer.id);
    return response.json({
      ok: true,
      order,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось отправить изменения", {
      details: error.details || undefined
    });
  }
});

app.post("/api/auth/contact-phone", async (request, response) => {
  try {
    const customer = await setCustomerContactPhone(request, request.body || {});
    return response.json({ ok: true, customer });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось сохранить контактный номер");
  }
});

app.post("/api/auth/onboarding/children", async (request, response) => {
  try {
    const customer = await setCustomerChildren(request, request.body || {});
    return response.json({ ok: true, customer });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось сохранить данные");
  }
});

app.post("/api/auth/onboarding/email", async (request, response) => {
  try {
    const customer = await setCustomerOnboardingEmail(request, request.body || {});
    return response.json({ ok: true, customer });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось сохранить email");
  }
});

app.get("/api/auth/email-verification/config", (_request, response) => {
  return response.json({
    ok: true,
    ...getCustomerEmailVerificationConfig()
  });
});

app.post("/api/auth/email-verification/start", async (request, response) => {
  try {
    const challenge = await startCustomerEmailVerification(request, request.body || {});
    return response.json({ ok: true, ...challenge });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось отправить код", {
      details: error.details || undefined
    });
  }
});

app.post("/api/auth/email-verification/verify", async (request, response) => {
  try {
    const customer = await verifyCustomerEmail(request, request.body || {});
    return response.json({ ok: true, customer });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось подтвердить email", {
      details: error.details || undefined
    });
  }
});

app.post("/api/auth/preferences", async (request, response) => {
  try {
    const customer = await setCustomerPreferences(request, request.body || {});
    return response.json({ ok: true, customer });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось сохранить настройки");
  }
});

app.post("/api/auth/oauth/start", (request, response) => {
  try {
    const url = buildOAuthStartUrl(request.body?.provider, request, response, {
      marketingConsent: Boolean(request.body?.marketingConsent),
      returnTo: request.body?.returnTo,
      linkChallengeId: request.body?.linkChallengeId
    });
    return response.json({
      ok: true,
      url
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось начать авторизацию");
  }
});

app.get("/api/auth/link/:challengeId", async (request, response) => {
  try {
    const challenge = await getIdentityLinkChallenge(request.params.challengeId);
    return response.json({ ok: true, challenge });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить запрос привязки");
  }
});

app.get("/api/auth/:provider/callback", async (request, response) => {
  try {
    const result = await completeOAuthLogin(request.params.provider, request);
    clearOAuthStateCookie(response, request);
    if (result.linkRequired) {
      return response.redirect(303, result.returnTo);
    }
    setCustomerSessionCookie(response, request, result.token);
    return response.redirect(303, result.returnTo);
  } catch (error) {
    clearOAuthStateCookie(response, request);
    const message = escapeHtml(error.message || "Не удалось войти");
    return response
      .status(error.statusCode || 500)
      .type("html")
      .send(
        `<meta charset="utf-8"><title>Вход не выполнен</title><main style="font-family: system-ui, sans-serif; max-width: 520px; margin: 80px auto; padding: 24px"><h1>Вход не выполнен</h1><p>${message}</p><a href="/" style="color:#ca7767">Вернуться на сайт</a></main>`
      );
  }
});

app.post("/api/auth/logout", async (request, response) => {
  try {
    await destroyCustomerSession(request);
    clearCustomerSessionCookie(response, request);
    return response.json({
      ok: true
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось выйти", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/reviews/summary", async (request, response) => {
  try {
    const productIds = String(request.query.products || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const summaries = await getProductReviewSummary(productIds);
    return response.json({
      ok: true,
      summaries
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить рейтинги", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/reviews/products/:productId", async (request, response) => {
  try {
    const data = await listProductReviews(request.params.productId);
    return response.json({
      ok: true,
      demoSubmissionEnabled: isDemoReviewSubmissionEnabled(),
      ...data
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить отзывы", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/reviews/products/:productId",
  reviewUpload.array("photos", MAX_REVIEW_PHOTOS),
  async (request, response) => {
    try {
      const customer = await getCustomerByRequest(request);
      const review = await createProductReview({
        customer,
        productId: request.params.productId,
        orderId: request.body?.orderId,
        rating: request.body?.rating,
        text: request.body?.text,
        guestName: request.body?.guestName,
        files: request.files,
        demoMode: isDemoReviewSubmissionEnabled()
      });
      const maxNotification = await notifyMaxNewReview(review);

      return response.status(201).json({
        ok: true,
        review,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось отправить отзыв", {
        details: error.message || String(error)
      });
    }
  }
);

app.post("/api/send-order", (_request, response) => {
  return jsonError(
    response,
    410,
    "Оплата при получении отключена. Заказ создаётся только после подтверждённой онлайн-оплаты."
  );
});

app.get("/api/payments/yookassa/config", (_request, response) => {
  const providerConfig = getYooKassaPublicConfig();

  return response.json({
    ok: true,
    ...providerConfig
  });
});

app.post("/api/payments/yookassa/create", async (request, response) => {
  if (!isYooKassaConfigured()) {
    return jsonError(response, 503, "ЮKassa еще не подключена. Нужны shopId и секретный ключ магазина.");
  }

  const customer = await getCustomerByRequest(request);
  if (!customer?.id) {
    return jsonError(response, 401, "Перед оплатой нужно войти в аккаунт");
  }

  const claimedTotal = Number(request.body?.order?.total || 0);
  let order = {
    ...(request.body?.order || {}),
    customerId: customer.id,
    customerEmail: customer.email || request.body?.order?.customerEmail || "",
    payment: "Онлайн через ЮKassa",
    paymentProvider: "yookassa",
    paymentStatus: "pending",
    status: "payment_pending",
    paymentDemo: false,
    adminNote: request.body?.order?.adminNote || ""
  };
  const errors = validateOrder(order);

  if (errors.length) {
    return jsonError(response, 400, "Заказ не прошёл проверку перед оплатой", {
      details: errors
    });
  }

  try {
    if (order.id) {
      const existing = await getOrderById(order.id);
      if (existing) {
        if (existing.customerId !== customer.id) {
          return jsonError(response, 409, "Этот идентификатор заказа уже используется");
        }
        if (Number(existing.total) !== Number(order.total)) {
          return jsonError(response, 409, "Сумма сохраненного заказа изменилась. Начните оформление заново.");
        }
        if (
          !existing.paymentId &&
          !["payment_pending", "payment_failed"].includes(existing.status)
        ) {
          return jsonError(response, 409, "Этот номер уже относится к оформленному заказу. Начните оформление заново.");
        }
        order = {
          ...existing,
          ...order,
          id: existing.id,
          createdAt: existing.createdAt
        };
      }
    }

    order = await priceCheckoutOrder(order);

    if (order.promoCode) {
      const promo = await resolveCheckoutPromoCode(order.promoCode);
      if (!promo) {
        const error = new Error("Промокод больше не действует. Проверьте корзину и попробуйте снова.");
        error.statusCode = 409;
        throw error;
      }
      order = await withPartnerAttribution(order, promo);
    }
    assertDeliveryMinimum(order);
    assertCheckoutTotalMatches(claimedTotal, order);

    let savedOrder = order.paymentId ? order : await saveOrder(order);
    order = savedOrder;
    await reserveManagedPromoUse(savedOrder, savedOrder.managedPromoId);
    if (savedOrder.paymentId) {
      const synced = await syncYooKassaOrder(savedOrder, "payment.retry_checked");
      const confirmationUrl = synced.providerPayment?.confirmation?.confirmation_url || savedOrder.paymentUrl || "";
      if (synced.order.paymentStatus !== "canceled") {
        return response.json({
          ok: true,
          order: synced.order,
          orderId: synced.order.id,
          paymentId: synced.order.paymentId,
          paymentStatus: synced.order.paymentStatus,
          paymentUrl: confirmationUrl,
          paid: synced.order.paymentStatus === "paid",
          mode: getYooKassaPublicConfig().mode,
          test: Boolean(synced.providerPayment?.test)
        });
      }
      savedOrder = await prepareOrderPaymentRetry(savedOrder.id);
    }

    const payment = await createYooKassaPayment(savedOrder, { request });
    savedOrder = await attachOrderPayment(savedOrder.id, payment);
    if (payment.paid || payment.status === "succeeded") {
      const syncResult = await syncOrderPayment(savedOrder.id, payment, "payment.created_succeeded");
      await finalizePaidOrder(syncResult);
      savedOrder = syncResult.order;
    }

    return response.json({
      ok: true,
      order: savedOrder,
      orderId: savedOrder.id,
      paymentId: payment.id,
      paymentStatus: payment.status,
      paymentUrl: payment.confirmationUrl,
      paid: payment.paid,
      mode: getYooKassaPublicConfig().mode,
      test: payment.test
    });
  } catch (error) {
    if (order.id) {
      try {
        const failedOrder = await markOrderPaymentCreateFailed(order.id, error.message);
        await releaseManagedPromoUse(order.id);
        if (failedOrder) {
          await notifyMaxPaymentProblem(failedOrder, error.message);
        }
      } catch (markError) {
        console.error("Could not mark YooKassa payment creation failure", markError);
      }
    }
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось создать оплату ЮKassa", {
      details: error.details || undefined,
      orderId: order.id || undefined
    });
  }
});

app.get("/api/payments/yookassa/:orderId/status", async (request, response) => {
  try {
    const customer = await getCustomerByRequest(request);
    if (!customer?.id) return jsonError(response, 401, "Нужно войти в аккаунт");

    const order = await getOrderById(request.params.orderId);
    if (!order) return jsonError(response, 404, "Заказ не найден");
    if (order.customerId !== customer.id) return jsonError(response, 403, "Этот заказ принадлежит другому аккаунту");

    const synced = await syncYooKassaOrder(order, "payment.customer_checked");
    return response.json({
      ok: true,
      order: synced.order,
      orderId: synced.order.id,
      paymentStatus: synced.order.paymentStatus,
      status: synced.order.status,
      paid: synced.order.paymentStatus === "paid"
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось проверить оплату ЮKassa", {
      details: error.details || undefined
    });
  }
});

app.post("/api/payments/yookassa/webhook", async (request, response) => {
  try {
    const event = String(request.body?.event || "");
    const notificationObject = request.body?.object || {};
    if (event === "refund.succeeded") {
      const refundId = String(notificationObject.id || "");
      if (!refundId) return jsonError(response, 400, "ЮKassa не передала идентификатор возврата");
      const refund = await getYooKassaRefund(refundId);
      const order = await getOrderByPaymentId(String(refund.payment_id || ""));
      if (!order) return jsonError(response, 404, "Заказ из уведомления о возврате не найден");
      await syncOrderRefund(order.id, refund);
      return response.status(200).json({ ok: true });
    }

    const paymentId = String(notificationObject.id || "");
    if (!paymentId) return jsonError(response, 400, "ЮKassa не передала идентификатор платежа");

    const payment = await getYooKassaPayment(paymentId);
    if (payment.metadata?.entityType === "masterclass_registration") {
      const eventId = String(payment.metadata?.eventId || "");
      const registrationId = String(payment.metadata?.registrationId || "");
      if (!eventId || !registrationId) {
        return jsonError(response, 400, "В платеже мастер-класса нет eventId или registrationId");
      }
      const registration = await getMasterclassPaymentRegistration(eventId, registrationId);
      assertYooKassaPaymentMatchesOrder(payment, registration);
      const syncResult = await syncMasterclassPayment(eventId, registrationId, payment, event || "payment.webhook");
      if (syncResult.becamePaid) {
        await notifyMaxMasterclassRegistration(syncResult.registration, syncResult.event);
      }
      return response.status(200).json({ ok: true });
    }

    const orderId = String(payment.metadata?.orderId || "");
    if (!orderId) return jsonError(response, 400, "В платеже ЮKassa нет orderId");

    const order = await getOrderById(orderId);
    if (!order) return jsonError(response, 404, "Заказ из уведомления ЮKassa не найден");
    assertYooKassaPaymentMatchesOrder(payment, order);

    const syncResult = await syncOrderPayment(order.id, payment, event || "payment.webhook");
    await finalizePaidOrder(syncResult);
    if (syncResult.order?.paymentStatus === "canceled") {
      await releaseManagedPromoUse(syncResult.order.id);
      await notifyMaxPaymentProblem(
        syncResult.order,
        "Платёж отменён платёжным провайдером"
      );
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("YooKassa webhook failed", error);
    if (Number(error.statusCode || 500) < 500) {
      await notifyMaxTechnicalAlert({
        method: "POST",
        route: "/api/payments/yookassa/webhook",
        status: error.statusCode,
        message: "Некорректный webhook ЮKассы",
        details: error.message || String(error)
      });
    }
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось обработать webhook ЮKassa", {
      details: error.details || undefined
    });
  }
});

app.post("/api/admin/session/login", async (request, response) => {
  const login = cleanLogin(request.body?.login);
  const password = String(request.body?.password || "");
  const account = getAdminAccounts(request).find(
    (candidate) => candidate.login === login && candidate.password === password
  );

  if (!account) {
    await notifyMaxSecurityAlert({
      login,
      ip: request.ip || "",
      method: "password"
    });
    return jsonError(response, 401, "Неверный логин или пароль");
  }

  try {
    const token = await createAdminSession(account, request);
    setAdminSessionCookie(response, request, token);
    return response.json({ ok: true, account: publicAdminAccount(account) });
  } catch (error) {
    return jsonError(response, 500, "Не удалось создать защищённую сессию", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/session/me", requireAdmin, async (request, response) => {
  return response.json({ ok: true, account: request.adminAccount });
});

app.post("/api/admin/session/logout", async (request, response) => {
  try {
    await destroyAdminSession(request);
    clearAdminSessionCookie(response, request);
    return response.json({ ok: true });
  } catch (error) {
    return jsonError(response, 500, "Не удалось завершить сессию", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/passkeys", requireAdmin, async (request, response) => {
  try {
    const passkeys = await listAdminPasskeys(request.adminAccount.login);
    return response.json({ ok: true, passkeys });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить ключи входа");
  }
});

app.post("/api/admin/passkeys/register/options", requireAdmin, async (request, response) => {
  try {
    const options = await createAdminPasskeyRegistrationOptions(request.adminAccount, request);
    return response.json({ ok: true, options });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось начать подключение");
  }
});

app.post("/api/admin/passkeys/register/verify", requireAdmin, async (request, response) => {
  try {
    const passkey = await finishAdminPasskeyRegistration(request.adminAccount, request, request.body || {});
    const maxNotification = await notifyMaxAudit({
      eventKey: `security:passkey:${request.adminAccount.login}:${passkey.id}:created`,
      title: "Подключён новый ключ быстрого входа",
      actor: request.adminAccount,
      notify: true,
      priority: 70
    });
    return response.status(201).json({ ok: true, passkey, maxNotification });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось подключить быстрый вход");
  }
});

app.post("/api/admin/passkeys/auth/options", async (request, response) => {
  const account = getAdminAccountByLogin(request, request.body?.login);
  if (!account) return jsonError(response, 404, "Аккаунт не найден");

  try {
    const options = await createAdminPasskeyAuthenticationOptions(account.login, request);
    return response.json({ ok: true, options });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Быстрый вход пока недоступен");
  }
});

app.post("/api/admin/passkeys/auth/verify", async (request, response) => {
  try {
    const authentication = await finishAdminPasskeyAuthentication(
      request.body?.login,
      request,
      request.body || {}
    );
    const account = getAdminAccountByLogin(request, authentication.login);
    if (!account) return jsonError(response, 401, "Доступ для этого аккаунта закрыт");

    const token = await createAdminSession(account, request);
    setAdminSessionCookie(response, request, token);
    return response.json({
      ok: true,
      verified: true,
      account: publicAdminAccount(account)
    });
  } catch (error) {
    await notifyMaxSecurityAlert({
      login: request.body?.login,
      ip: request.ip || "",
      method: "passkey"
    });
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось выполнить быстрый вход");
  }
});

app.delete("/api/admin/passkeys/:id", requireAdmin, async (request, response) => {
  try {
    await deleteAdminPasskey(request.adminAccount.login, request.params.id);
    const maxNotification = await notifyMaxAudit({
      eventKey: `security:passkey:${request.adminAccount.login}:${request.params.id}:deleted`,
      title: "Удалён ключ быстрого входа",
      actor: request.adminAccount,
      notify: true,
      priority: 70
    });
    return response.json({ ok: true, maxNotification });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось удалить ключ входа");
  }
});

app.get("/api/admin/orders", requireAdmin, async (_request, response) => {
  try {
    const orders = await listOrders();
    response.json({
      ok: true,
      account: _request.adminAccount,
      statuses: ORDER_STATUSES,
      orders
    });
  } catch (error) {
    console.error("Admin orders list failed", error);
    jsonError(response, 500, "Не удалось загрузить заказы", {
      details: error.message || String(error),
      name: error.name || "Error"
    });
  }
});

app.post(
  "/api/admin/orders/:id/refund",
  requireAdmin,
  requireAdminRole("manager"),
  async (request, response) => {
    try {
      const order = await getOrderById(request.params.id);
      if (!order) return jsonError(response, 404, "Заказ не найден");
      if (order.paymentProvider !== "yookassa" || order.paymentStatus !== "paid") {
        return jsonError(response, 409, "Возврат доступен только для оплаченного заказа ЮKassa");
      }

      const refund = await createYooKassaRefund(order, {
        amount: request.body?.amount,
        reason: request.body?.reason || `Возврат по заказу ${order.id}`
      });
      const updatedOrder = await recordOrderRefund(order.id, refund, request.adminAccount);
      const maxNotification = await notifyMaxRefund(
        updatedOrder,
        refund,
        request.adminAccount
      );

      return response.json({
        ok: true,
        order: updatedOrder,
        refund,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось создать возврат ЮKassa", {
        details: error.details || undefined
      });
    }
  }
);

app.get("/api/admin/dashboard", requireAdmin, requireAdminRole("manager"), async (_request, response) => {
  try {
    const dashboard = await getManagerDashboard();
    return response.json({
      ok: true,
      dashboard
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить дашборд руководителя", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/partners", requireAdmin, requireAdminRole("manager"), async (_request, response) => {
  try {
    const partners = await listPartners();
    return response.json({
      ok: true,
      partners
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить партнёров", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/partners/:id", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const details = await getAdminPartnerDetails(request.params.id);
    return response.json({
      ok: true,
      ...details
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить партнёра", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/promo-codes", requireAdmin, requireAdminRole("manager"), async (_request, response) => {
  try {
    const promoCodes = await listManagedPromoCodes();
    return response.json({
      ok: true,
      promoCodes
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить промокоды", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/reviews", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const reviews = await listAdminReviews(request.query.status || "pending");
    return response.json({
      ok: true,
      reviews
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось загрузить отзывы", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/delivery-settings", requireAdmin, requireAdminRole("manager"), async (_request, response) => {
  try {
    const settings = await getDeliverySettings(pool);
    return response.json({
      ok: true,
      settings
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить настройки доставки", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/lost-items", requireAdmin, async (_request, response) => {
  try {
    const items = await listAdminLostItems();
    return response.json({
      ok: true,
      items
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить потеряшки", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/blogger-review-rewards", requireAdmin, async (_request, response) => {
  try {
    const rewards = await listBloggerReviewRewards();
    return response.json({
      ok: true,
      rewards
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить учёт десертов", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/gallery", requireAdmin, requireAdminRole("manager"), async (_request, response) => {
  try {
    const items = await listAdminGalleryItems();
    return response.json({
      ok: true,
      items
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить галерею", {
      details: error.message || String(error)
    });
  }
});

app.get("/api/admin/catalog", requireAdmin, async (_request, response) => {
  try {
    const catalog = await listAdminCatalog();
    return response.json({
      ok: true,
      catalog
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить каталог", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/admin/catalog/categories", requireAdmin, async (request, response) => {
  try {
    const category = await createCatalogCategory(request.body || {}, {
      createdBy: request.adminAccount?.label || "Админка"
    });
    const maxNotification = await notifyMaxAudit({
      eventKey: `catalog:category:${category.id}:created`,
      title: `Создана категория «${category.title || category.name || category.id}»`,
      actor: request.adminAccount
    });
    return response.status(201).json({
      ok: true,
      category,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось создать категорию", {
      details: error.message || String(error)
    });
  }
});

app.patch("/api/admin/catalog/categories/:id", requireAdmin, async (request, response) => {
  try {
    const category = await updateCatalogCategory(request.params.id, request.body || {}, {
      createdBy: request.adminAccount?.label || "Админка"
    });
    const maxNotification = await notifyMaxAudit({
      eventKey: `catalog:category:${category.id}:updated:${category.updatedAt || Date.now()}`,
      title: `Изменена категория «${category.title || category.name || category.id}»`,
      actor: request.adminAccount
    });
    return response.json({
      ok: true,
      category,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось обновить категорию", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/admin/lost-items",
  requireAdmin,
  lostItemUpload.single("photo"),
  async (request, response) => {
    try {
      const item = await createLostItem({
        file: request.file,
        addedAt: request.body?.addedAt,
        createdBy: request.body?.createdBy || "Админка"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `lost-item:${item.id}:created`,
        title: `Добавлена потеряшка #${item.itemNumber || item.number || item.id}`,
        actor: request.adminAccount
      });

      return response.status(201).json({
        ok: true,
        item,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось добавить потеряшку", {
        details: error.message || String(error)
      });
    }
  }
);

app.delete("/api/admin/lost-items/:id", requireAdmin, async (request, response) => {
  try {
    const item = await archiveLostItem(request.params.id);
    const maxNotification = await notifyMaxAudit({
      eventKey: `lost-item:${item.id}:archived:${item.archivedAt || Date.now()}`,
      title: `Потеряшка #${item.itemNumber || item.number || item.id} убрана`,
      actor: request.adminAccount
    });
    return response.json({
      ok: true,
      item,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось убрать потеряшку", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/admin/blogger-review-rewards",
  requireAdmin,
  bloggerRewardUpload.fields([
    { name: "reviewScreenshot", maxCount: 1 },
    { name: "profileScreenshot", maxCount: 1 }
  ]),
  async (request, response) => {
    try {
      const reward = await createBloggerReviewReward({
        body: request.body || {},
        files: request.files || {},
        actor: request.adminAccount
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `blogger-reward:${reward.id}:created`,
        title: "Добавлена заявка блогера на десерт",
        details: [reward.instagramUrl || reward.profileUrl || ""].filter(Boolean),
        actor: request.adminAccount,
        notify: true,
        priority: 60
      });

      return response.status(201).json({
        ok: true,
        reward,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось добавить блогера", {
        details: error.message || String(error)
      });
    }
  }
);

app.patch("/api/admin/blogger-review-rewards/:id", requireAdmin, async (request, response) => {
  try {
    const reward = await updateBloggerReviewRewardStatus(
      request.params.id,
      request.body?.status,
      request.adminAccount
    );
    const maxNotification = await notifyMaxAudit({
      eventKey: `blogger-reward:${reward.id}:status:${reward.status}:${reward.updatedAt || Date.now()}`,
      title: `Статус заявки блогера → ${reward.status}`,
      actor: request.adminAccount
    });

    return response.json({
      ok: true,
      reward,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось изменить статус выдачи", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/admin/catalog/products",
  requireAdmin,
  catalogUpload.single("media"),
  async (request, response) => {
    try {
      const product = await createCatalogProduct({
        file: request.file,
        body: request.body || {},
        createdBy: request.adminAccount?.label || "Админка"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `catalog:product:${product.id}:created`,
        title: `Создан товар «${product.title || product.name || product.id}»`,
        actor: request.adminAccount
      });

      return response.status(201).json({
        ok: true,
        product,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось создать товар", {
        details: error.message || String(error)
      });
    }
  }
);

app.patch(
  "/api/admin/catalog/products/:id",
  requireAdmin,
  catalogUpload.single("media"),
  async (request, response) => {
    try {
      const product = await updateCatalogProduct(request.params.id, {
        file: request.file,
        body: request.body || {},
        createdBy: request.adminAccount?.label || "Админка"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `catalog:product:${product.id}:updated:${product.updatedAt || Date.now()}`,
        title: `Изменён товар «${product.title || product.name || product.id}»`,
        details: [
          product.status ? `Статус: ${product.status}` : "",
          product.price !== undefined ? `Цена: ${product.price} ₽` : ""
        ].filter(Boolean),
        actor: request.adminAccount
      });

      return response.json({
        ok: true,
        product,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось обновить товар", {
        details: error.message || String(error)
      });
    }
  }
);

app.post(
  "/api/admin/catalog/products/:id/video",
  requireAdmin,
  requireAdminRole("manager"),
  catalogVideoUpload.single("video"),
  async (request, response) => {
    try {
      const result = await saveCatalogProductVideo(request.params.id, {
        file: request.file,
        createdBy: request.adminAccount?.label || "Админка"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `catalog:product:${result.product.id}:video:${result.product.updatedAt || Date.now()}`,
        title: `Добавлено видео товара «${result.product.title || result.product.name || result.product.id}»`,
        actor: request.adminAccount
      });

      return response.json({
        ok: true,
        product: result.product,
        warning: result.warning,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось прикрепить видео товара", {
        details: error.message || String(error)
      });
    }
  }
);

app.delete(
  "/api/admin/catalog/products/:id/video",
  requireAdmin,
  requireAdminRole("manager"),
  async (request, response) => {
    try {
      const product = await removeCatalogProductVideo(request.params.id, {
        createdBy: request.adminAccount?.label || "Админка"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `catalog:product:${product.id}:video-removed:${product.updatedAt || Date.now()}`,
        title: `Удалено видео товара «${product.title || product.name || product.id}»`,
        actor: request.adminAccount
      });

      return response.json({
        ok: true,
        product,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось удалить видео товара", {
        details: error.message || String(error)
      });
    }
  }
);

app.delete("/api/admin/catalog/products/:id", requireAdmin, async (request, response) => {
  try {
    const product = await archiveCatalogProduct(request.params.id);
    const maxNotification = await notifyMaxAudit({
      eventKey: `catalog:product:${product.id}:archived:${product.updatedAt || Date.now()}`,
      title: `Товар «${product.title || product.name || product.id}» убран`,
      actor: request.adminAccount,
      notify: true,
      priority: 60
    });
    return response.json({
      ok: true,
      product,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось убрать товар", {
      details: error.message || String(error)
    });
  }
});

app.post(
  "/api/admin/gallery",
  requireAdmin,
  requireAdminRole("manager"),
  galleryUpload.single("media"),
  async (request, response) => {
    try {
      const item = await createGalleryItem({
        file: request.file,
        body: request.body || {},
        createdBy: request.adminAccount?.label || "Руководитель"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `gallery:${item.id}:created`,
        title: "Добавлен материал в галерею",
        actor: request.adminAccount
      });

      return response.status(201).json({
        ok: true,
        item,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось добавить материал", {
        details: error.message || String(error)
      });
    }
  }
);

app.patch(
  "/api/admin/gallery/:id",
  requireAdmin,
  requireAdminRole("manager"),
  galleryUpload.single("media"),
  async (request, response) => {
    try {
      const item = await updateGalleryItem(request.params.id, {
        file: request.file,
        body: request.body || {},
        createdBy: request.adminAccount?.label || "Руководитель"
      });
      const maxNotification = await notifyMaxAudit({
        eventKey: `gallery:${item.id}:updated:${item.updatedAt || Date.now()}`,
        title: "Изменён материал галереи",
        actor: request.adminAccount
      });

      return response.json({
        ok: true,
        item,
        maxNotification
      });
    } catch (error) {
      return jsonError(response, error.statusCode || 500, error.message || "Не удалось обновить материал", {
        details: error.message || String(error)
      });
    }
  }
);

app.delete("/api/admin/gallery/:id", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const item = await archiveGalleryItem(request.params.id);
    const maxNotification = await notifyMaxAudit({
      eventKey: `gallery:${item.id}:archived:${item.updatedAt || Date.now()}`,
      title: "Материал галереи убран",
      actor: request.adminAccount
    });
    return response.json({
      ok: true,
      item,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось убрать материал", {
      details: error.message || String(error)
    });
  }
});

app.patch("/api/admin/delivery-settings", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const settings = await saveDeliverySettings(pool, request.body || {});
    const maxNotification = await notifyMaxAudit({
      eventKey: `delivery-settings:${Date.now()}`,
      title: "Изменены настройки доставки",
      details: [
        settings.enabled === false ? "Доставка отключена" : "",
        settings.loadLabel ? `Загрузка: ${settings.loadLabel}` : ""
      ].filter(Boolean),
      actor: request.adminAccount,
      notify: true,
      priority: 70
    });
    return response.json({
      ok: true,
      settings,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось сохранить настройки доставки", {
      details: error.message || String(error)
    });
  }
});

app.patch("/api/admin/reviews/:id", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const review = await moderateReview(request.params.id, request.body || {});
    const maxNotification = await notifyMaxAudit({
      eventKey: `review:${review.id}:status:${review.status}:${review.updatedAt || Date.now()}`,
      title: `Отзыв → ${review.status}`,
      details: [`Оценка: ${review.rating}/5`],
      actor: request.adminAccount
    });
    return response.json({
      ok: true,
      review,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось обновить отзыв", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/admin/partners", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const partner = await createPartner(request.body || {}, {
      allowWeakDevPassword: isDevLoginEnabled(request)
    });
    const maxNotification = await notifyMaxAudit({
      eventKey: `partner:${partner.id}:created`,
      title: `Создан партнёр «${partner.name || partner.login || partner.id}»`,
      actor: request.adminAccount
    });
    return response.status(201).json({
      ok: true,
      partner,
      maxNotification
    });
  } catch (error) {
    const isDuplicate = error.code === "23505";
    return jsonError(
      response,
      error.statusCode || (isDuplicate ? 409 : 500),
      isDuplicate ? "Логин или промокод уже занят" : error.message || "Не удалось создать партнёра",
      {
        details: error.message || String(error)
      }
    );
  }
});

app.patch("/api/admin/partners/:id/access", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const details = await updatePartnerAccess(request.params.id, request.body || {}, {
      allowWeakDevPassword: isDevLoginEnabled(request)
    });
    const maxNotification = await notifyMaxAudit({
      eventKey: `partner:${request.params.id}:access:${Date.now()}`,
      title: `Изменён доступ партнёра «${details.partner?.name || request.params.id}»`,
      details: details.partner?.status ? [`Статус: ${details.partner.status}`] : [],
      actor: request.adminAccount,
      notify: true,
      priority: 60
    });
    return response.json({
      ok: true,
      ...details,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось изменить доступ", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/admin/partners/:id/payouts", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const details = await recordPartnerPayout(request.params.id, request.body || {}, {
      createdBy: `${request.adminAccount?.label || "Руководитель"} · ${request.adminAccount?.login || ""}`.trim()
    });
    const maxNotification = await notifyMaxAudit({
      eventKey: `partner:${request.params.id}:payout:${details.payout?.id || Date.now()}`,
      title: `Проведена выплата партнёру «${details.partner?.name || request.params.id}»`,
      details: [
        details.payout?.amount !== undefined ? `Сумма: ${details.payout.amount} ₽` : ""
      ].filter(Boolean),
      actor: request.adminAccount,
      notify: true,
      priority: 80
    });
    return response.status(201).json({
      ok: true,
      ...details,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось провести выплату", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/admin/promo-codes", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const promoCode = await createManagedPromoCode(request.body || {});
    const maxNotification = await notifyMaxAudit({
      eventKey: `promo:${promoCode.id}:created`,
      title: `Создан промокод ${promoCode.code}`,
      actor: request.adminAccount
    });
    return response.status(201).json({
      ok: true,
      promoCode,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || (error.code === "23505" ? 409 : 500), error.message || "Не удалось создать промокод", {
      details: error.message || String(error)
    });
  }
});

app.patch("/api/admin/promo-codes/:id", requireAdmin, requireAdminRole("manager"), async (request, response) => {
  try {
    const promoCode = await updateManagedPromoCode(request.params.id, request.body || {});
    const maxNotification = await notifyMaxAudit({
      eventKey: `promo:${promoCode.id}:updated:${promoCode.updatedAt || Date.now()}`,
      title: `Изменён промокод ${promoCode.code}`,
      details: promoCode.status ? [`Статус: ${promoCode.status}`] : [],
      actor: request.adminAccount
    });
    return response.json({
      ok: true,
      promoCode,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || (error.code === "23505" ? 409 : 500), error.message || "Не удалось обновить промокод", {
      details: error.message || String(error)
    });
  }
});

app.patch("/api/admin/orders", requireAdmin, async (request, response) => {
  const { action, id, status, patch, reason } = request.body || {};
  if (!id || (!status && !["close", "update", "cancel"].includes(action))) {
    return jsonError(response, 400, "Нужны id и действие заказа");
  }

  try {
    if (action === "close") {
      const order = await closeOrder(id);
      const maxNotification = await notifyMaxAudit({
        eventKey: `order:${order.id}:closed:${order.archivedAt || Date.now()}`,
        title: `Заказ #${order.id} закрыт в архив`,
        actor: request.adminAccount,
        notify: false
      });
      return response.json({
        ok: true,
        order,
        push: null,
        maxNotification
      });
    }

    if (action === "update") {
      const order = await updateOrderDetails(id, patch || {});
      const maxNotification = await notifyMaxAudit({
        eventKey: `order:${order.id}:details:${order.updatedAt || Date.now()}`,
        title: `Изменены данные заказа #${order.id}`,
        actor: request.adminAccount,
        notify: false
      });
      return response.json({
        ok: true,
        order,
        push: null,
        maxNotification
      });
    }

    if (action === "cancel") {
      const order = await cancelOrder(id, reason, request.adminAccount);
      const partnerCommission = await syncCommissionStatus(order);
      await releaseManagedPromoUse(order.id);
      const push = await sendStatusPush(order);
      const maxNotification = await notifyMaxOrderStatus(order);
      return response.json({
        ok: true,
        order,
        partnerCommission,
        push,
        maxNotification
      });
    }

    const order = await updateOrderStatus(id, status, request.adminAccount);
    const partnerCommission = await syncCommissionStatus(order);
    const push = await sendStatusPush(order);
    const maxNotification = await notifyMaxOrderStatus(order);
    return response.json({
      ok: true,
      order,
      partnerCommission,
      push,
      maxNotification
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось обновить заказ", {
      details: error.message || String(error),
      name: error.name || "Error"
    });
  }
});

app.post("/api/admin/push", requireAdmin, async (request, response) => {
  const { action = "register", subscription, label = "Админка" } = request.body || {};
  if (!subscription?.endpoint) {
    return jsonError(response, 400, "Нужна push subscription");
  }

  try {
    const saved = await saveAdminPushSubscription(subscription, label, request.adminAccount);
    const push = action === "test" ? await sendAdminTestPush(subscription) : null;
    return response.json({
      ok: true,
      subscription: saved,
      push
    });
  } catch (error) {
    console.error("Admin push setup failed", error);
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось настроить push администратора", {
      details: error.message || String(error),
      name: error.name || "Error"
    });
  }
});

app.delete("/api/admin/push", requireAdmin, async (request, response) => {
  try {
    await deleteAdminPushSubscriptionByEndpoint(request.body?.endpoint);
    return response.json({ ok: true });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось отключить push");
  }
});

app.post("/api/partners/login", async (request, response) => {
  try {
    const { login, password } = request.body || {};
    const session = await loginPartner(login, password, {
      allowDevLogin: isDevLoginEnabled(request)
    });
    return response.json({
      ok: true,
      ...session
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 500, error.message || "Не удалось войти");
  }
});

app.get("/api/partners/me", requirePartner, async (request, response) => {
  try {
    if (request.partner?.id === getDevPartner().id && isDevLoginEnabled(request)) {
      return response.json({
        ok: true,
        ...getDevPartnerDashboard()
      });
    }

    const dashboard = await getPartnerDashboard(request.partner.id);
    return response.json({
      ok: true,
      ...dashboard
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось загрузить кабинет", {
      details: error.message || String(error)
    });
  }
});

app.use(canonicalRedirectMiddleware);
app.use(express.static(distDir, {
  index: false,
  setHeaders: setStaticCacheHeaders
}));

app.get(/^\/admin(?:\/.*)?$/, (_request, response) => {
  response.set("Cache-Control", "no-cache");
  response.sendFile(path.join(distDir, "admin.html"));
});

async function sendSeoPage(
  response,
  next,
  page,
  schema = buildDefaultPageSchema(page),
  renderOptions = {}
) {
  try {
    const indexPath = path.join(distDir, page.path === "/" ? "home.html" : "index.html");
    const source = await readFile(indexPath, "utf8");
    const documentSource = page.path === "/" ? await inlineHomeStyles(source, distDir) : source;
    const appHtml = page.path === "/" ? await renderHomeApp() : "";
    response.set("Cache-Control", "no-cache");
    return response.type("html").send(
      renderSeoDocument(documentSource, page, schema, { ...renderOptions, appHtml })
    );
  } catch (error) {
    return next(error);
  }
}

app.get(
  STATIC_SITE_SEO_PAGES.map((page) => page.path),
  async (request, response, next) => {
    const page = getSiteSeoPage(request.path);
    let catalog = null;

    if (page.path === "/") {
      try {
        catalog = await listPublicCatalog();
      } catch {
        // Страница остаётся доступной, даже если каталог временно не отвечает.
      }
    }

    return sendSeoPage(response, next, page, buildDefaultPageSchema(page), { catalog });
  }
);

app.get(
  [MASTERCLASSES_PATH, `/dev${MASTERCLASSES_PATH}`],
  async (request, response, next) => {
    const page = getSiteSeoPage(request.path);
    const { title, description, canonicalUrl, imageUrl } = page;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: title,
          description,
          url: canonicalUrl,
          isPartOf: {
            "@type": "WebSite",
            name: "Вместе Вкуснее",
            url: SITE_ORIGIN
          }
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Вместе Вкуснее",
              item: SITE_ORIGIN
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Мастер-классы",
              item: canonicalUrl
            }
          ]
        }
      ]
    };

    return sendSeoPage(response, next, page, schema);
  }
);

app.get(
  [INDIVIDUAL_MASTERCLASS_PATH, `/dev${INDIVIDUAL_MASTERCLASS_PATH}`],
  async (request, response, next) => {
    const page = getSiteSeoPage(request.path);
    const { title, description, canonicalUrl, imageUrl } = page;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: "Индивидуальный мастер-класс по пицце",
          serviceType: "Кулинарный мастер-класс на день рождения и семейный праздник",
          description,
          url: canonicalUrl,
          areaServed: {
            "@type": "City",
            name: "Чебоксары"
          },
          audience: {
            "@type": "Audience",
            audienceType: "Дети, взрослые и семейные компании"
          },
          provider: {
            "@type": "Restaurant",
            name: "Вместе Вкуснее",
            url: SITE_ORIGIN,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Чебоксары",
              streetAddress: "улица Пирогова, 1Т",
              addressCountry: "RU"
            }
          }
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Вместе Вкуснее",
              item: SITE_ORIGIN
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Мастер-классы",
              item: `${SITE_ORIGIN}${MASTERCLASSES_PATH}`
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Индивидуальный мастер-класс",
              item: canonicalUrl
            }
          ]
        }
      ]
    };

    return sendSeoPage(response, next, page, schema);
  }
);

const masterclassEventPaths = MASTERCLASS_EVENTS.flatMap((event) => [
  event.path,
  `/dev${event.path}`,
  ...event.legacyPaths,
  ...event.legacyPaths.map((eventPath) => `/dev${eventPath}`)
]);

app.get(masterclassEventPaths, async (request, response, next) => {
  const masterclassEvent = getMasterclassEventByPath(request.path);
  if (!masterclassEvent) return next();

  const page = getSiteSeoPage(request.path);
  const { title, description, canonicalUrl, imageUrl } = page;
  const eventSchema = {
    "@type": "Event",
    name: masterclassEvent.title,
    description,
    startDate: masterclassEvent.startsAt,
    eventStatus:
      masterclassEvent.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Семейная пиццерия «Вместе Вкуснее»",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Чебоксары",
        streetAddress: "улица Пирогова, 1Т",
        addressCountry: "RU"
      }
    },
    image: [imageUrl],
    organizer: {
      "@type": "Restaurant",
      name: "Вместе Вкуснее",
      url: SITE_ORIGIN
    }
  };

  if (masterclassEvent.pageMode === "registration") {
    eventSchema.offers = {
      "@type": "Offer",
      price: String(masterclassEvent.pricePerParticipant),
      priceCurrency: "RUB",
      url: canonicalUrl,
      availability: "https://schema.org/InStock"
    };
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      eventSchema,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Вместе Вкуснее",
            item: SITE_ORIGIN
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Мастер-классы",
            item: `${SITE_ORIGIN}${MASTERCLASSES_PATH}`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: masterclassEvent.cardTitle,
            item: canonicalUrl
          }
        ]
      }
    ]
  };

  return sendSeoPage(response, next, page, schema);
});

app.get(/^(?!\/api\/).*/, createSpaFallbackHandler({ distDir }));

async function start() {
  await initDb();
  await startMaxNotificationService();
  app.listen(port, () => {
    console.log(`vv-delivery-api listening on ${port}`);
  });
}

process.on("SIGINT", async () => {
  stopMaxNotificationService();
  await closeDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  stopMaxNotificationService();
  await closeDb();
  process.exit(0);
});

start().catch((error) => {
  console.error("Failed to start vv-delivery-api", error);
  process.exit(1);
});
