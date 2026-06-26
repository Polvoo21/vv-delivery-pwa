import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb, initDb, pool } from "./db.js";
import {
  closeOrder,
  listOrders,
  ORDER_STATUSES,
  saveAdminPushSubscription,
  saveOrder,
  updateOrderStatus
} from "./orders.js";
import { buildTelegramMessage, validateOrder } from "./order-utils.js";
import {
  getPublicVapidKey,
  sendAdminNewOrderPush,
  sendAdminTestPush,
  sendStatusPush
} from "./push.js";
import {
  createCommissionForOrder,
  createPartner,
  getPartnerByToken,
  getPartnerDashboard,
  listPartners,
  loginPartner,
  resolvePromoCode,
  syncCommissionStatus
} from "./partners.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((value) => value.trim()) : true
  })
);
app.use(express.json({ limit: "1mb" }));

function jsonError(response, status, error, extra = {}) {
  return response.status(status).json({
    ok: false,
    error,
    ...extra
  });
}

function requireAdmin(request, response, next) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return jsonError(response, 500, "На сервере не задан ADMIN_PASSWORD");
  }

  const actual = request.get("x-admin-password") || "";
  if (actual !== expected) {
    return jsonError(response, 401, "Неверный пароль администратора");
  }

  return next();
}

async function requirePartner(request, response, next) {
  const header = request.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const partner = await getPartnerByToken(token);

  if (!partner) {
    return jsonError(response, 401, "Нужно войти в кабинет партнёра");
  }

  request.partner = partner;
  return next();
}

function withPartnerAttribution(order, promo) {
  if (!promo?.partner?.id) return order;

  const commissionPercent = Number(promo.partner.commissionPercent || 0);
  const commissionAmount = Math.max(0, Math.round((Number(order.total || 0) * commissionPercent) / 100));

  return {
    ...order,
    promoCode: promo.code,
    discount: true,
    discountLabel: promo.label,
    partner: promo.partner,
    partnerCommission: {
      commissionPercent,
      commissionAmount
    }
  };
}

async function sendTelegramOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    const error = new Error("На сервере не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID");
    error.statusCode = 500;
    throw error;
  }

  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramMessage(order),
      disable_web_page_preview: true
    })
  });
  const telegramData = await telegramResponse.json().catch(() => ({}));

  if (!telegramResponse.ok || telegramData.ok === false) {
    const error = new Error(telegramData.description || "Telegram API error");
    error.statusCode = 502;
    throw error;
  }

  return telegramData.result?.message_id || null;
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
    const promo = await resolvePromoCode(request.params.code);
    if (!promo) {
      return jsonError(response, 404, "Промокод не найден");
    }

    return response.json({
      ok: true,
      promo: {
        code: promo.code,
        percent: promo.percent,
        label: promo.label,
        partnerName: promo.partner.name
      }
    });
  } catch (error) {
    return jsonError(response, 500, "Не удалось проверить промокод", {
      details: error.message || String(error)
    });
  }
});

app.post("/api/send-order", async (request, response) => {
  let order = request.body || {};
  const errors = validateOrder(order);
  if (errors.length) {
    return jsonError(response, 400, "Заказ не прошёл проверку", {
      details: errors
    });
  }

  try {
    if (order.promoCode) {
      const partnerPromo = await resolvePromoCode(order.promoCode);
      order = withPartnerAttribution(order, partnerPromo);
    }

    const telegramMessageId = await sendTelegramOrder(order);
    let savedOrder = null;
    let storageError = null;
    let partnerCommission = null;
    let adminPush = null;

    try {
      savedOrder = await saveOrder(order, telegramMessageId);
      partnerCommission = await createCommissionForOrder(savedOrder);
    } catch (error) {
      storageError = error;
      console.error("Order was sent to Telegram but was not saved to PostgreSQL", error);
    }

    if (savedOrder) {
      try {
        adminPush = await sendAdminNewOrderPush(savedOrder);
      } catch (error) {
        adminPush = {
          ok: false,
          reason: "admin-push-failed",
          message: error.message || String(error)
        };
        console.error("Order was saved but admin push was not sent", error);
      }
    }

    return response.json({
      ok: true,
      orderId: savedOrder?.id || null,
      storage: savedOrder ? "saved" : "failed",
      storageError: storageError ? storageError.message : null,
      partnerCommission,
      adminPush
    });
  } catch (error) {
    return jsonError(response, error.statusCode || 502, error.message || "Не удалось отправить заказ");
  }
});

app.get("/api/admin/orders", requireAdmin, async (_request, response) => {
  try {
    const orders = await listOrders();
    response.json({
      ok: true,
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

app.get("/api/admin/partners", requireAdmin, async (_request, response) => {
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

app.post("/api/admin/partners", requireAdmin, async (request, response) => {
  try {
    const partner = await createPartner(request.body || {});
    return response.status(201).json({
      ok: true,
      partner
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

app.patch("/api/admin/orders", requireAdmin, async (request, response) => {
  const { action, id, status } = request.body || {};
  if (!id || (!status && action !== "close")) {
    return jsonError(response, 400, "Нужны id и status");
  }

  try {
    if (action === "close") {
      const order = await closeOrder(id);
      return response.json({
        ok: true,
        order,
        push: null
      });
    }

    const order = await updateOrderStatus(id, status);
    const partnerCommission = await syncCommissionStatus(order);
    const push = await sendStatusPush(order);
    return response.json({
      ok: true,
      order,
      partnerCommission,
      push
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
    const saved = await saveAdminPushSubscription(subscription, label);
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

app.post("/api/partners/login", async (request, response) => {
  try {
    const { login, password } = request.body || {};
    const session = await loginPartner(login, password);
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

app.use(express.static(distDir, { index: false }));

app.get(/^\/admin(?:\/.*)?$/, (_request, response) => {
  response.sendFile(path.join(distDir, "admin.html"));
});

app.get(/^(?!\/api\/).*/, (_request, response) => {
  response.sendFile(path.join(distDir, "index.html"));
});

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`vv-delivery-api listening on ${port}`);
  });
}

process.on("SIGINT", async () => {
  await closeDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});

start().catch((error) => {
  console.error("Failed to start vv-delivery-api", error);
  process.exit(1);
});
