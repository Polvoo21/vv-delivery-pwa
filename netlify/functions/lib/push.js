import webpush from "web-push";
import { listAdminPushSubscriptions, ORDER_STATUSES } from "./orders-store.js";

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
      topic: tag
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

  return sendPush(
    order?.pushSubscription,
    {
      title: "Вместе Вкуснее",
      body: `Статус заказа #${order.id}: ${statusLabel}`,
      url: "/",
      orderId: order.id,
      status: order.status,
      statusLabel,
      notificationTag: order.id ? `vv-order-${order.id}` : "vv-order-status"
    },
    order.id ? `order-${order.id}` : "order-status"
  );
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

  return {
    ok: results.some((result) => result.ok),
    sent: results.filter((result) => result.ok).length,
    total: results.length,
    results
  };
}
