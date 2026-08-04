import { createHash } from "node:crypto";
import { pool } from "./db.js";
import { ORDER_STATUSES } from "./orders.js";

const DEFAULT_API_BASE_URL = "https://platform-api2.max.ru";
const MAX_MESSAGE_LENGTH = 4000;
const MAX_SEND_ATTEMPTS = 12;
const WORKER_INTERVAL_MS = 650;
const MONITOR_INTERVAL_MS = 60_000;
const MONITOR_DEMO_ORDERS = process.env.MAX_MONITOR_DEMO_ORDERS === "1";
const SITE_URL = String(process.env.PUBLIC_SITE_URL || "https://vmestevkusnee.ru").replace(/\/$/, "");

let workerTimer = null;
let monitorTimer = null;
let workerBusy = false;
let monitorBusy = false;

function cleanText(value, maxLength = 800) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function escapeMaxHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(value) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value || 0))} ₽`;
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds || 0)));
  if (seconds < 60) return `${seconds} сек.`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин.`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} ч. ${restMinutes} мин.` : `${hours} ч.`;
}

function normalizeEventKey(value) {
  const raw = cleanText(value, 1000) || `event:${Date.now()}`;
  if (raw.length <= 190) return raw;
  const digest = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `${raw.slice(0, 150)}:${digest}`;
}

function makeAdminButton(label = "Открыть админку") {
  return {
    type: "inline_keyboard",
    payload: {
      buttons: [
        [
          {
            type: "link",
            text: label,
            url: `${SITE_URL}/admin`
          }
        ]
      ]
    }
  };
}

function isConfigured() {
  return (
    process.env.MAX_NOTIFICATIONS_ENABLED !== "0" &&
    Boolean(process.env.MAX_BOT_TOKEN) &&
    Boolean(process.env.MAX_CHAT_ID)
  );
}

export function getMaxNotificationConfigStatus() {
  return {
    enabled: process.env.MAX_NOTIFICATIONS_ENABLED !== "0",
    configured: isConfigured(),
    chatConfigured: Boolean(process.env.MAX_CHAT_ID),
    tokenConfigured: Boolean(process.env.MAX_BOT_TOKEN)
  };
}

async function enqueueMaxNotification({
  eventKey,
  text,
  attachments = [],
  notify = true,
  priority = 50
}) {
  if (!isConfigured()) {
    return { ok: false, queued: false, reason: "max-not-configured" };
  }

  const normalizedText = String(text || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!normalizedText) {
    return { ok: false, queued: false, reason: "empty-message" };
  }

  const result = await pool.query(
    `
      insert into max_notification_outbox (
        event_key, text, attachments, notify, priority, status, next_attempt_at, created_at, updated_at
      )
      values ($1, $2, $3::jsonb, $4, $5, 'pending', now(), now(), now())
      on conflict (event_key) do nothing
      returning id
    `,
    [
      normalizeEventKey(eventKey),
      normalizedText,
      JSON.stringify(Array.isArray(attachments) ? attachments : []),
      Boolean(notify),
      Math.max(0, Math.min(100, Number(priority) || 50))
    ]
  );

  return {
    ok: true,
    queued: Boolean(result.rowCount),
    duplicate: !result.rowCount,
    id: result.rows[0]?.id || null
  };
}

async function safeEnqueue(payload) {
  try {
    return await enqueueMaxNotification(payload);
  } catch (error) {
    console.error("MAX notification could not be queued", {
      eventKey: payload?.eventKey || null,
      message: error.message || String(error)
    });
    return {
      ok: false,
      queued: false,
      reason: "queue-failed",
      message: error.message || String(error)
    };
  }
}

async function sendMaxMessage(row) {
  const apiBaseUrl = String(process.env.MAX_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const url = new URL(`${apiBaseUrl}/messages`);
  url.searchParams.set("chat_id", process.env.MAX_CHAT_ID);
  url.searchParams.set("disable_link_preview", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: process.env.MAX_BOT_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: row.text,
        format: "html",
        notify: row.notify,
        ...(Array.isArray(row.attachments) && row.attachments.length
          ? { attachments: row.attachments }
          : {})
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        cleanText(data.message || data.error || `MAX API returned ${response.status}`, 500)
      );
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function claimNextNotification() {
  const result = await pool.query(`
    with next_notification as (
      select id
      from max_notification_outbox
      where status in ('pending', 'retry')
        and next_attempt_at <= now()
      order by priority desc, created_at asc
      for update skip locked
      limit 1
    )
    update max_notification_outbox as outbox
    set status = 'sending',
        attempts = attempts + 1,
        updated_at = now()
    from next_notification
    where outbox.id = next_notification.id
    returning outbox.*
  `);

  return result.rows[0] || null;
}

async function processNextNotification() {
  if (!isConfigured() || workerBusy) return;
  workerBusy = true;

  try {
    const row = await claimNextNotification();
    if (!row) return;

    try {
      await sendMaxMessage(row);
      await pool.query(
        `
          update max_notification_outbox
          set status = 'sent',
              sent_at = now(),
              last_error = null,
              updated_at = now()
          where id = $1
        `,
        [row.id]
      );
    } catch (error) {
      const attempts = Number(row.attempts || 1);
      const failed = attempts >= MAX_SEND_ATTEMPTS;
      const retrySeconds =
        error.statusCode === 429
          ? 10
          : Math.min(30 * 60, Math.max(15, 15 * 2 ** Math.min(attempts - 1, 7)));

      await pool.query(
        `
          update max_notification_outbox
          set status = $2,
              next_attempt_at = now() + make_interval(secs => $3),
              last_error = $4,
              updated_at = now()
          where id = $1
        `,
        [
          row.id,
          failed ? "failed" : "retry",
          retrySeconds,
          cleanText(`${error.statusCode || ""} ${error.message || error}`, 1000)
        ]
      );

      console.error("MAX notification delivery failed", {
        outboxId: row.id,
        eventKey: row.event_key,
        attempt: attempts,
        retrySeconds: failed ? null : retrySeconds,
        message: error.message || String(error)
      });
    }
  } catch (error) {
    console.error("MAX notification worker failed", error);
  } finally {
    workerBusy = false;
  }
}

function getOrderHistory(order) {
  return Array.isArray(order?.statusHistory) ? order.statusHistory : [];
}

function getLatestStatusEvents(order) {
  const history = getOrderHistory(order);
  return {
    current: history[history.length - 1] || null,
    previous: history[history.length - 2] || null
  };
}

function getOrderModeLabel(order) {
  return order?.mode === "pickup" ? "Самовывоз" : "Доставка";
}

function getItemDetails(item) {
  return [
    item?.size,
    item?.dough,
    ...(Array.isArray(item?.customizations) ? item.customizations : []),
    ...(Array.isArray(item?.addons) ? item.addons.map((addon) => addon?.name || addon) : [])
  ]
    .map((value) => cleanText(value, 80))
    .filter(Boolean)
    .join(", ");
}

export function buildMaxNewPaidOrderMessage(order) {
  const lines = [
    `🆕 <b>Новый оплаченный заказ #${escapeMaxHtml(order?.id || "")}</b>`,
    `${escapeMaxHtml(getOrderModeLabel(order))} · ${escapeMaxHtml(order?.requestedTime || "Побыстрее")}`,
    `<b>${escapeMaxHtml(formatMoney(order?.total))}</b> · оплата подтверждена`,
    "",
    `Гость: ${escapeMaxHtml(order?.customerName || "Не указано")}`,
    `Телефон: ${escapeMaxHtml(order?.customerPhone || "Не указан")}`
  ];

  if (order?.mode !== "pickup") {
    lines.push(`Адрес: ${escapeMaxHtml(order?.address || "Не указан")}`);
    const addressParts = [
      order?.entrance ? `подъезд ${order.entrance}` : "",
      order?.floor ? `этаж ${order.floor}` : "",
      order?.flat ? `кв. ${order.flat}` : "",
      order?.code ? `код ${order.code}` : ""
    ].filter(Boolean);
    if (addressParts.length) lines.push(escapeMaxHtml(addressParts.join(" · ")));
    if (order?.addressComment) {
      lines.push(`Адресный комментарий: ${escapeMaxHtml(order.addressComment)}`);
    }
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length) {
    lines.push("", "<b>Состав:</b>");
    items.slice(0, 30).forEach((item) => {
      const details = getItemDetails(item);
      const lineTotal = Number(item?.lineTotal || 0) || Number(item?.price || 0) * Number(item?.qty || 0);
      lines.push(
        `• ${escapeMaxHtml(item?.qty || 1)}× ${escapeMaxHtml(item?.name || "Позиция")}` +
          `${details ? ` (${escapeMaxHtml(details)})` : ""}` +
          `${lineTotal ? ` — ${escapeMaxHtml(formatMoney(lineTotal))}` : ""}`
      );
    });
  }

  if (order?.orderComment) {
    lines.push("", `Комментарий: ${escapeMaxHtml(order.orderComment)}`);
  }
  if (order?.promoCode) {
    lines.push(`Промокод: ${escapeMaxHtml(order.promoCode)}`);
  }
  lines.push(`Создан: ${escapeMaxHtml(formatDateTime(order?.createdAt))}`);

  return lines.join("\n").slice(0, MAX_MESSAGE_LENGTH);
}

export function buildMaxOrderStatusMessage(order) {
  const { current, previous } = getLatestStatusEvents(order);
  if (previous?.status === order?.status) return "";

  const statusLabel = ORDER_STATUSES[order?.status] || order?.status || "обновлён";
  const createdAt = new Date(order?.createdAt || Date.now());
  const changedAt = new Date(current?.changedAt || order?.updatedAt || Date.now());
  const elapsedSeconds = Math.max(0, (changedAt.getTime() - createdAt.getTime()) / 1000);

  return [
    `🔄 Заказ <b>#${escapeMaxHtml(order?.id || "")}</b> → <b>${escapeMaxHtml(statusLabel)}</b>`,
    `Через ${escapeMaxHtml(formatDuration(elapsedSeconds))} после оформления` +
      `${current?.changedBy ? ` · ${escapeMaxHtml(current.changedBy)}` : ""}`
  ].join("\n");
}

export async function notifyMaxNewPaidOrder(order) {
  return safeEnqueue({
    eventKey: `order:${order?.id}:paid:new`,
    text: buildMaxNewPaidOrderMessage(order),
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority: 100
  });
}

export async function notifyMaxOrderStatus(order) {
  const text = buildMaxOrderStatusMessage(order);
  if (!text) return { ok: true, queued: false, reason: "status-not-changed" };

  const { current } = getLatestStatusEvents(order);
  return safeEnqueue({
    eventKey: `order:${order?.id}:status:${order?.status}:${current?.changedAt || order?.updatedAt || Date.now()}`,
    text,
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority: order?.status === "cancelled" ? 100 : 90
  });
}

export async function notifyMaxOrderChangeRequest(order) {
  const request = order?.customerChangeRequest || {};
  return safeEnqueue({
    eventKey: `order:${order?.id}:change-request:${request.createdAt || order?.updatedAt || Date.now()}`,
    text: [
      `✏️ <b>Клиент просит изменить заказ #${escapeMaxHtml(order?.id || "")}</b>`,
      escapeMaxHtml(request.text || "Текст обращения не указан"),
      `Получено: ${escapeMaxHtml(formatDateTime(request.createdAt || order?.updatedAt))}`
    ].join("\n"),
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority: 100
  });
}

export async function notifyMaxPaymentProblem(order, reason = "") {
  const paymentId = order?.paymentId || "unknown";
  const paymentStatus = order?.paymentStatus || order?.status || "failed";
  return safeEnqueue({
    eventKey: `order:${order?.id}:payment:${paymentId}:${paymentStatus}`,
    text: [
      `⚠️ <b>Проблема с оплатой заказа #${escapeMaxHtml(order?.id || "")}</b>`,
      `Статус: ${escapeMaxHtml(paymentStatus)}`,
      reason ? `Причина: ${escapeMaxHtml(reason)}` : "",
      `Сумма: ${escapeMaxHtml(formatMoney(order?.total))}`
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority: 100
  });
}

export async function notifyMaxRefund(order, refund, actor) {
  return safeEnqueue({
    eventKey: `order:${order?.id}:refund:${refund?.id || order?.updatedAt || Date.now()}`,
    text: [
      `↩️ <b>Возврат по заказу #${escapeMaxHtml(order?.id || "")}</b>`,
      `Сумма: ${escapeMaxHtml(formatMoney(refund?.amount?.value || refund?.amount || order?.refundAmount))}`,
      `Статус: ${escapeMaxHtml(refund?.status || order?.refundStatus || "создан")}`,
      actor?.login ? `Оформил: ${escapeMaxHtml(actor.login)}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority: 100
  });
}

export async function notifyMaxMasterclassRegistration(registration, event) {
  const confirmed = registration?.status === "confirmed";
  return safeEnqueue({
    eventKey: `masterclass:${registration?.eventId || event?.id}:${registration?.id}:${registration?.status}`,
    text: [
      confirmed ? "✅ <b>Запись на мастер-класс подтверждена</b>" : "🎨 <b>Новая запись на мастер-класс</b>",
      event?.cardTitle || event?.title ? escapeMaxHtml(event.cardTitle || event.title) : "",
      `Гость: ${escapeMaxHtml(registration?.name || "Не указано")}`,
      registration?.phone ? `Телефон: ${escapeMaxHtml(registration.phone)}` : "",
      `Участников: ${escapeMaxHtml(registration?.participantCount || 0)} · взрослых ${escapeMaxHtml(registration?.adultsCount || 0)} · детей ${escapeMaxHtml(registration?.childrenCount || 0)}`,
      registration?.childrenAges?.length
        ? `Возраст детей: ${escapeMaxHtml(registration.childrenAges.join(", "))}`
        : "",
      `Сумма: ${escapeMaxHtml(formatMoney(registration?.amount))}`,
      `Статус оплаты: ${escapeMaxHtml(registration?.paymentStatus || "ожидается")}`
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: [makeAdminButton()],
    notify: true,
    priority: confirmed ? 90 : 80
  });
}

export async function notifyMaxNewReview(review) {
  const rating = Number(review?.rating || 0);
  return safeEnqueue({
    eventKey: `review:${review?.id}:pending`,
    text: [
      `${rating <= 3 ? "🚨" : "⭐"} <b>Новый отзыв на модерации</b>`,
      `Оценка: ${escapeMaxHtml(rating)}/5`,
      review?.productId ? `Товар: ${escapeMaxHtml(review.productId)}` : "",
      review?.orderId ? `Заказ: #${escapeMaxHtml(review.orderId)}` : "",
      review?.customerName ? `Гость: ${escapeMaxHtml(review.customerName)}` : "",
      review?.text ? `«${escapeMaxHtml(review.text)}»` : "",
      review?.photos?.length ? `Фотографий: ${escapeMaxHtml(review.photos.length)}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: [makeAdminButton("Открыть отзывы")],
    notify: true,
    priority: rating <= 3 ? 100 : 70
  });
}

export async function notifyMaxAudit({
  eventKey,
  title,
  details = [],
  actor,
  notify = false,
  priority = 30
}) {
  return safeEnqueue({
    eventKey,
    text: [
      `⚙️ <b>${escapeMaxHtml(title || "Изменение на сайте")}</b>`,
      ...details.map((detail) => escapeMaxHtml(detail)).filter(Boolean),
      actor?.login || actor?.label
        ? `Изменил: ${escapeMaxHtml(actor.login || actor.label)}`
        : ""
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: [makeAdminButton()],
    notify,
    priority
  });
}

export async function notifyMaxSecurityAlert({ login, ip, method = "password" }) {
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  return safeEnqueue({
    eventKey: `security:admin-login-failed:${cleanText(login, 80)}:${cleanText(ip, 80)}:${bucket}`,
    text: [
      "🔐 <b>Неудачная попытка входа в админку</b>",
      `Логин: ${escapeMaxHtml(login || "не указан")}`,
      `IP: ${escapeMaxHtml(ip || "не определён")}`,
      `Способ: ${escapeMaxHtml(method)}`
    ].join("\n"),
    notify: true,
    priority: 85
  });
}

export async function notifyMaxTechnicalAlert({
  method,
  route,
  status = 500,
  message,
  details
}) {
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
  const safeRoute = cleanText(route, 180) || "unknown";
  const safeMessage = cleanText(message, 500) || "Неизвестная ошибка";

  return safeEnqueue({
    eventKey: `technical:${method || "API"}:${safeRoute}:${status}:${safeMessage}:${bucket}`,
    text: [
      "🛠 <b>Техническая ошибка сайта</b>",
      `${escapeMaxHtml(method || "API")} ${escapeMaxHtml(safeRoute)} · HTTP ${escapeMaxHtml(status)}`,
      escapeMaxHtml(safeMessage),
      details ? escapeMaxHtml(cleanText(details, 700)) : ""
    ]
      .filter(Boolean)
      .join("\n"),
    notify: true,
    priority: 100
  });
}

async function enqueueOperationalAlert(order, key, title, details, priority = 95) {
  return safeEnqueue({
    eventKey: `order:${order.id}:operational:${key}`,
    text: [
      `${priority >= 100 ? "🔴" : "⏱"} <b>${escapeMaxHtml(title)}</b>`,
      `Заказ #${escapeMaxHtml(order.id)}`,
      ...details.map((detail) => escapeMaxHtml(detail))
    ].join("\n"),
    attachments: [makeAdminButton("Открыть заказ")],
    notify: true,
    priority
  });
}

async function runOperationalMonitor() {
  if (!isConfigured() || monitorBusy) return;
  monitorBusy = true;

  try {
    const result = await pool.query(
      `
      select id, status, raw, created_at, updated_at
      from orders
      where archived_at is null
        and payment_status = 'paid'
        and ($1::boolean or coalesce(payment_provider, '') <> 'demo')
        and status not in ('delivered', 'cancelled', 'payment_failed')
      order by created_at desc
      limit 300
    `,
      [MONITOR_DEMO_ORDERS]
    );
    const now = Date.now();

    for (const row of result.rows) {
      const raw = row.raw || {};
      const order = {
        ...raw,
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      const history = Array.isArray(raw.statusHistory) ? raw.statusHistory : [];
      const latestStatusEvent = [...history].reverse().find((event) => event?.status === row.status);
      const statusSince = new Date(
        latestStatusEvent?.changedAt || row.updated_at || row.created_at
      ).getTime();
      const statusMinutes = Math.max(0, (now - statusSince) / 60_000);
      const requestedAt = raw.requestedAt ? new Date(raw.requestedAt).getTime() : NaN;

      if (Number.isFinite(requestedAt)) {
        const minutesUntil = (requestedAt - now) / 60_000;

        if (minutesUntil <= -30) {
          await enqueueOperationalAlert(
            order,
            "scheduled-overdue-30",
            "Отложенный заказ просрочен более чем на 30 минут",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Был назначен на ${raw.requestedTime || formatDateTime(requestedAt)}`],
            100
          );
        } else if (minutesUntil <= -15) {
          await enqueueOperationalAlert(
            order,
            "scheduled-overdue-15",
            "Отложенный заказ просрочен на 15 минут",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Был назначен на ${raw.requestedTime || formatDateTime(requestedAt)}`],
            100
          );
        } else if (minutesUntil <= 0) {
          await enqueueOperationalAlert(
            order,
            "scheduled-due",
            "Наступило время отложенного заказа",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Время: ${raw.requestedTime || formatDateTime(requestedAt)}`],
            row.status === "courier" ? 85 : 100
          );
        } else if (minutesUntil <= 15) {
          await enqueueOperationalAlert(
            order,
            "scheduled-15",
            "До отложенного заказа осталось 15 минут",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Время: ${raw.requestedTime || formatDateTime(requestedAt)}`],
            ["cooking", "courier"].includes(row.status) ? 85 : 100
          );
        } else if (minutesUntil <= 30) {
          await enqueueOperationalAlert(
            order,
            "scheduled-30",
            "До отложенного заказа осталось 30 минут",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Время: ${raw.requestedTime || formatDateTime(requestedAt)}`],
            row.status === "new" ? 100 : 85
          );
        } else if (minutesUntil <= 60) {
          await enqueueOperationalAlert(
            order,
            "scheduled-60",
            "Отложенный заказ через 1 час",
            [`Статус: ${ORDER_STATUSES[row.status] || row.status}`, `Время: ${raw.requestedTime || formatDateTime(requestedAt)}`],
            80
          );
        }
        continue;
      }

      if (row.status === "new") {
        if (statusMinutes >= 10) {
          await enqueueOperationalAlert(order, "new-10", "Заказ не принят 10 минут", [], 100);
        } else if (statusMinutes >= 5) {
          await enqueueOperationalAlert(order, "new-5", "Заказ не принят 5 минут", [], 100);
        } else if (statusMinutes >= 2) {
          await enqueueOperationalAlert(order, "new-2", "Заказ не принят 2 минуты", [], 90);
        }
      } else if (row.status === "accepted" && statusMinutes >= 15) {
        await enqueueOperationalAlert(
          order,
          "accepted-15",
          "Принятый заказ не начали готовить 15 минут",
          [],
          95
        );
      } else if (row.status === "cooking" && statusMinutes >= 30) {
        await enqueueOperationalAlert(
          order,
          "cooking-30",
          "Заказ готовится более 30 минут",
          [],
          95
        );
      } else if (row.status === "courier" && statusMinutes >= 45) {
        await enqueueOperationalAlert(
          order,
          "courier-45",
          "Заказ у курьера более 45 минут",
          [],
          100
        );
      }
    }
  } catch (error) {
    console.error("MAX operational monitor failed", error);
  } finally {
    monitorBusy = false;
  }
}

export async function startMaxNotificationService() {
  if (!isConfigured()) {
    console.log("MAX notifications are disabled or not configured");
    return getMaxNotificationConfigStatus();
  }

  await pool.query(`
    update max_notification_outbox
    set status = 'retry',
        next_attempt_at = now(),
        updated_at = now()
    where status = 'sending'
  `);

  if (!workerTimer) {
    workerTimer = setInterval(() => {
      void processNextNotification();
    }, WORKER_INTERVAL_MS);
    workerTimer.unref?.();
  }

  if (!monitorTimer) {
    monitorTimer = setInterval(() => {
      void runOperationalMonitor();
    }, MONITOR_INTERVAL_MS);
    monitorTimer.unref?.();
  }

  setTimeout(() => void processNextNotification(), 100).unref?.();
  setTimeout(() => void runOperationalMonitor(), 5_000).unref?.();

  console.log("MAX notification service started");
  return getMaxNotificationConfigStatus();
}

export function stopMaxNotificationService() {
  if (workerTimer) clearInterval(workerTimer);
  if (monitorTimer) clearInterval(monitorTimer);
  workerTimer = null;
  monitorTimer = null;
}
