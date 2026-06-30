import { buildOrderNotificationMessage } from "./order-utils.js";

const MAX_API_BASE = (process.env.MAX_API_BASE || "https://platform-api2.max.ru").replace(/\/$/, "");

function makeError(message, statusCode = 500, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function configuredProvider() {
  const explicit = String(process.env.NOTIFY_PROVIDER || "").trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.MAX_BOT_TOKEN && process.env.MAX_CHAT_ID) return "max";
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) return "telegram";
  return "none";
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 1000) };
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await readResponse(response);

  if (!response.ok || data.ok === false) {
    const message = data.description || data.error || data.message || `Notification API returned ${response.status}`;
    throw makeError(message, response.status >= 500 ? 502 : response.status, data);
  }

  return data;
}

export async function sendMaxText(text, chatId = process.env.MAX_CHAT_ID) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token || !chatId) {
    throw makeError("На сервере не заданы MAX_BOT_TOKEN и MAX_CHAT_ID", 500);
  }

  const url = new URL(`${MAX_API_BASE}/messages`);
  url.searchParams.set("chat_id", chatId);

  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      notify: true
    })
  });

  return {
    ok: true,
    provider: "max",
    messageId: data.message?.id || data.message_id || data.id || null
  };
}

export async function sendTelegramText(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw makeError("На сервере не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID", 500);
  }

  const data = await fetchJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });

  return {
    ok: true,
    provider: "telegram",
    messageId: data.result?.message_id || null
  };
}

export async function sendOrderNotification(order) {
  const provider = configuredProvider();
  const text = buildOrderNotificationMessage(order);

  if (provider === "none" || provider === "off" || provider === "disabled") {
    return {
      ok: false,
      provider,
      skipped: true,
      reason: "notification-provider-not-configured"
    };
  }

  if (provider === "max") {
    return sendMaxText(text);
  }

  if (provider === "telegram") {
    return sendTelegramText(text);
  }

  throw makeError(`Неизвестный NOTIFY_PROVIDER: ${provider}`, 500);
}

export async function sendMaxTestNotification() {
  const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  return sendMaxText(`Тестовое уведомление «Вместе Вкуснее»\n\nMAX-бот работает.\nВремя: ${now}`);
}

export async function getMaxUpdates(limit = 50) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) {
    throw makeError("На сервере не задан MAX_BOT_TOKEN", 500);
  }

  const url = new URL(`${MAX_API_BASE}/updates`);
  url.searchParams.set("limit", String(Math.min(Math.max(Number(limit) || 50, 1), 100)));

  return fetchJson(url, {
    method: "GET",
    headers: {
      Authorization: token
    }
  });
}

export function summarizeMaxUpdate(update) {
  const payload = update?.payload || update;
  const chat = payload?.chat || payload?.message?.recipient || payload?.message?.chat || payload?.recipient || null;
  const user = payload?.user || payload?.message?.sender || payload?.sender || null;

  return {
    updateId: update?.update_id || update?.updateId || update?.id || null,
    type: update?.update_type || update?.type || payload?.type || null,
    chatId: chat?.id || payload?.chat_id || payload?.chatId || null,
    chatTitle: chat?.title || chat?.name || null,
    userId: user?.user_id || user?.id || null,
    userName: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || null,
    text: payload?.message?.body?.text || payload?.message?.text || payload?.text || null
  };
}
