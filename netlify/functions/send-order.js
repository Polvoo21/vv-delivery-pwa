import { initOrdersStore, saveOrder } from "./lib/orders-store.js";
import { sendAdminNewOrderPush } from "./lib/push.js";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

const dash = (value) => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text ? text.slice(0, 900) : "-";
};

const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(Number(value) || 0)));

const normalizeMode = (mode) => (mode === "pickup" ? "самовывоз" : "доставка");

function parseBody(body) {
  try {
    return {
      ok: true,
      value: JSON.parse(body || "{}")
    };
  } catch {
    return {
      ok: false,
      error: "Некорректный JSON"
    };
  }
}

function validateOrder(order) {
  const errors = [];

  if (!order.customerName || !String(order.customerName).trim()) {
    errors.push("customerName обязателен");
  }

  if (!order.customerPhone || !String(order.customerPhone).trim()) {
    errors.push("customerPhone обязателен");
  }

  if (!Array.isArray(order.items)) {
    errors.push("items должен быть массивом");
  } else {
    if (order.items.length === 0) errors.push("items не должен быть пустым");
    if (order.items.length > 30) errors.push("items не должен содержать больше 30 позиций");

    order.items.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`items[${index}] должен быть объектом`);
        return;
      }

      if (!item.name || !String(item.name).trim()) {
        errors.push(`items[${index}].name обязателен`);
      }

      if (!Number(item.qty) || Number(item.qty) <= 0) {
        errors.push(`items[${index}].qty должен быть больше 0`);
      }

      if (Number(item.qty) > 99) {
        errors.push(`items[${index}].qty слишком большой`);
      }
    });
  }

  if (!Number(order.total) || Number(order.total) <= 0) {
    errors.push("total должен быть больше 0");
  }

  return errors;
}

function formatItem(item, index) {
  const qty = Number(item.qty) || 0;
  const unitPrice = Number(item.price || item.unitPrice || 0);
  const lineTotal = Number(item.lineTotal || unitPrice * qty || 0);
  const params = [item.size ? `${item.size} см` : "", item.dough || ""].filter(Boolean).join(", ");
  const addons = Array.isArray(item.addons)
    ? item.addons
        .map((addon) => (typeof addon === "string" ? addon : addon?.name))
        .filter(Boolean)
        .join(", ")
    : "";
  const removed = Array.isArray(item.removed) ? item.removed.filter(Boolean).join(", ") : "";

  return [
    `${index + 1}. ${dash(item.name)} × ${qty} — ${money(lineTotal)} ₽`,
    params ? `   ${params}` : "",
    addons ? `   Добавки: ${addons}` : "",
    removed ? `   Убрать: ${removed}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTelegramMessage(order) {
  const itemsText = order.items.map(formatItem).join("\n\n");
  const discountText = order.discount ? "да" : "нет";
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })
    : new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

  return `🍕 Новый заказ «Вместе Вкуснее»

Тип: ${normalizeMode(order.mode)}
Адрес: ${dash(order.address)}
Подъезд: ${dash(order.entrance)}
Квартира: ${dash(order.flat)}
Комментарий к адресу: ${dash(order.addressComment || order.comment)}

Клиент: ${dash(order.customerName)}
Телефон: ${dash(order.customerPhone)}
Комментарий к заказу: ${dash(order.orderComment)}

Скидка: ${discountText}
Промокод: ${dash(order.promoCode)}
Оплата: ${dash(order.payment)}
Сумма: ${money(order.total)} ₽

Состав:
${itemsText}

Время: ${createdAt}`;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      error: "Method not allowed"
    });
  }

  const parsed = parseBody(event.body);
  if (!parsed.ok) {
    return json(400, {
      ok: false,
      error: parsed.error
    });
  }

  const order = parsed.value;
  const errors = validateOrder(order);
  if (errors.length) {
    return json(400, {
      ok: false,
      error: "Заказ не прошёл проверку",
      details: errors
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return json(500, {
      ok: false,
      error: "В Netlify не настроены TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID"
    });
  }

  const text = buildTelegramMessage(order);

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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

    const telegramData = await telegramResponse.json().catch(() => ({}));

    if (!telegramResponse.ok || telegramData.ok === false) {
      return json(502, {
        ok: false,
        error: telegramData.description || "Telegram API error"
      });
    }

    let savedOrder = null;
    let storageError = null;
    let adminPush = null;
    try {
      initOrdersStore(event);
      savedOrder = await saveOrder({
        ...order,
        telegramMessageId: telegramData.result?.message_id || null
      });
    } catch (error) {
      storageError = error;
      console.error("Order was sent to Telegram but was not saved to admin storage", error);
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

    return json(200, {
      ok: true,
      orderId: savedOrder?.id || null,
      storage: savedOrder ? "saved" : "failed",
      storageError: storageError ? storageError.message : null,
      adminPush
    });
  } catch {
    return json(502, {
      ok: false,
      error: "Не удалось отправить заказ в Telegram"
    });
  }
};
