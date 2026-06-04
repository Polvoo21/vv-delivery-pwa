import webpush from "web-push";
import { ORDER_STATUSES } from "./orders-store.js";

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

export async function sendStatusPush(order) {
  const config = getVapidConfig();
  const subscription = order?.pushSubscription;

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

  const statusLabel = ORDER_STATUSES[order.status] || "обновлён";
  const payload = JSON.stringify({
    title: "Вместе Вкуснее",
    body: `Статус заказа #${order.id}: ${statusLabel}`,
    url: "/",
    orderId: order.id,
    status: order.status,
    statusLabel
  });

  try {
    await webpush.sendNotification(subscription, payload, {
      TTL: 60 * 60,
      urgency: "high"
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
