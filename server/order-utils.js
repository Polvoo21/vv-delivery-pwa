const dash = (value) => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text ? text.slice(0, 900) : "-";
};

const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(Number(value) || 0)));

const normalizeMode = (mode) => (mode === "pickup" ? "самовывоз" : "доставка");

export function validateOrder(order) {
  const errors = [];
  const phoneDigits = String(order.customerPhone || "").replace(/\D/g, "");

  if (!order.customerName || !String(order.customerName).trim()) {
    errors.push("customerName обязателен");
  }

  if (!order.customerPhone || !String(order.customerPhone).trim()) {
    errors.push("customerPhone обязателен");
  } else if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    errors.push("customerPhone должен быть в формате +7 (999) 999-99-99");
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

export function buildTelegramMessage(order) {
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
