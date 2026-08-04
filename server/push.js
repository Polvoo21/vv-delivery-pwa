import { createHash } from "node:crypto";
import webpush from "web-push";
import {
  deleteAdminPushSubscription,
  deleteCustomerPushSubscription,
  listAdminPushSubscriptions,
  listCustomerPushSubscriptions,
  ORDER_STATUSES
} from "./orders.js";

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@vmeste-vkusnee.local";

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    subject
  };
}

export function getPublicVapidKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export function buildPushTopic(value) {
  const safeValue = String(value || "vv-push")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_");

  if (safeValue && safeValue.length <= 32) {
    return safeValue;
  }

  const prefix = (safeValue || "vv-push").slice(0, 11);
  const digest = createHash("sha256")
    .update(String(value || "vv-push"))
    .digest("base64url")
    .slice(0, 20);

  return `${prefix}-${digest}`.slice(0, 32);
}

async function sendPush(subscription, payload, tag) {
  const config = getVapidConfig();

  if (!config) {
    return {
      ok: false,
      reason: "vapid-missing"
    };
  }

  if (!subscription?.endpoint) {
    return {
      ok: false,
      reason: "subscription-missing"
    };
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60,
      urgency: "high",
      topic: buildPushTopic(tag)
    });

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.statusCode === 404 || error.statusCode === 410 ? "subscription-expired" : "send-failed",
      statusCode: error.statusCode || 500,
      message: error.message
    };
  }
}

export async function sendStatusPush(order) {
  const statusLabel = ORDER_STATUSES[order.status] || "обновлён";
  const stored = await listCustomerPushSubscriptions(order?.customerId);
  const records = [
    ...stored,
    ...(order?.pushSubscription?.endpoint
      ? [{ id: null, subscription: order.pushSubscription }]
      : [])
  ].filter(
    (record, index, all) =>
      record.subscription?.endpoint &&
      all.findIndex((candidate) => candidate.subscription?.endpoint === record.subscription.endpoint) === index
  );

  if (!records.length) {
    return {
      ok: false,
      reason: "subscription-missing",
      sent: 0,
      total: 0
    };
  }

  const payload = {
    title: "Вместе Вкуснее",
    body: `Статус заказа #${order.id}: ${statusLabel}`,
    url: order?.id ? `/account/orders/${encodeURIComponent(order.id)}` : "/account/orders",
    orderId: order.id,
    status: order.status,
    statusLabel,
    notificationTag: order.id ? `vv-order-${order.id}` : "vv-order-status"
  };
  const results = await Promise.all(
    records.map((record) =>
      sendPush(record.subscription, payload, order.id ? `order-${order.id}` : "order-status")
    )
  );

  await Promise.all(
    results.map((result, index) =>
      result.reason === "subscription-expired" && records[index].id
        ? deleteCustomerPushSubscription(records[index].id)
        : null
    )
  );

  return {
    ok: results.some((result) => result.ok),
    sent: results.filter((result) => result.ok).length,
    total: results.length,
    results
  };
}

export async function sendAdminTestPush(subscription) {
  return sendPush(
    subscription,
    {
      title: "Админка «Вместе Вкуснее»",
      body: "Push-уведомления администратора работают",
      url: "/admin",
      notificationTag: "vv-admin-test"
    },
    "admin-test"
  );
}

export async function sendAdminNewOrderPush(order) {
  const records = await listAdminPushSubscriptions();
  if (!records.length) {
    return {
      ok: false,
      reason: "admin-subscriptions-missing",
      sent: 0
    };
  }

  const mode = order.mode === "pickup" ? "самовывоз" : "доставка";
  const total = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(order.total || 0));
  const results = await Promise.all(
    records.map((record) =>
      sendPush(
        record.subscription,
        {
          title: "Новый заказ «Вместе Вкуснее»",
          body: `${order.customerName || "Гость"} · ${mode} · ${total} ₽`,
          url: "/admin",
          orderId: order.id,
          notificationTag: order.id ? `vv-admin-order-${order.id}` : "vv-admin-order"
        },
        order.id ? `admin-order-${order.id}` : "admin-order"
      )
    )
  );

  results.forEach((result, index) => {
    if (result.ok) return;
    console.error("Admin push delivery failed", {
      orderId: order.id || null,
      subscriptionId: records[index]?.id || null,
      label: records[index]?.label || null,
      role: records[index]?.admin_role || null,
      reason: result.reason || "unknown",
      statusCode: result.statusCode || null,
      message: result.message || null
    });
  });

  await Promise.all(
    results.map((result, index) =>
      result.reason === "subscription-expired"
        ? deleteAdminPushSubscription(records[index].id)
        : null
    )
  );

  return {
    ok: results.some((result) => result.ok),
    sent: results.filter((result) => result.ok).length,
    total: results.length,
    results
  };
}
