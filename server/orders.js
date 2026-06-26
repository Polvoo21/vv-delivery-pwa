import { createHash } from "node:crypto";
import { pool } from "./db.js";

export const ORDER_STATUSES = {
  accepted: "Принят",
  cooking: "Готовится",
  courier: "У курьера",
  delivered: "Доставлен"
};

function makeOrderId() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${Date.now().toString(36).toUpperCase()}-${random}`;
}

function makeSubscriptionId(endpoint) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function publicOrder(row) {
  const raw = row.raw || {};

  return {
    ...raw,
    id: row.id,
    status: row.status,
    statusLabel: ORDER_STATUSES[row.status] || ORDER_STATUSES.accepted,
    archivedAt: row.archived_at || null,
    createdAt: row.created_at || raw.createdAt,
    updatedAt: row.updated_at || raw.updatedAt,
    customerName: row.customer_name || raw.customerName,
    customerPhone: row.customer_phone || raw.customerPhone,
    mode: row.mode || raw.mode,
    address: row.address || raw.address,
    total: Number(row.total || raw.total || 0),
    payment: row.payment || raw.payment,
    promoCode: row.promo_code || raw.promoCode || "",
    partnerId: row.partner_id || raw.partner?.id || "",
    pushEnabled: Boolean(raw.pushSubscription?.endpoint)
  };
}

export async function saveOrder(rawOrder, telegramMessageId = null) {
  const now = new Date().toISOString();
  const id = rawOrder.id || makeOrderId();
  const order = {
    ...rawOrder,
    id,
    status: rawOrder.status || "accepted",
    createdAt: rawOrder.createdAt || now,
    updatedAt: now,
    telegramMessageId
  };

  const result = await pool.query(
    `
      insert into orders (
        id, status, raw, customer_name, customer_phone, mode, address, total, payment,
        promo_code, partner_id, telegram_message_id, created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      on conflict (id) do update set
        status = excluded.status,
        raw = excluded.raw,
        customer_name = excluded.customer_name,
        customer_phone = excluded.customer_phone,
        mode = excluded.mode,
        address = excluded.address,
        total = excluded.total,
        payment = excluded.payment,
        promo_code = excluded.promo_code,
        partner_id = excluded.partner_id,
        telegram_message_id = excluded.telegram_message_id,
        updated_at = excluded.updated_at
      returning *
    `,
    [
      id,
      order.status,
      order,
      order.customerName || "",
      order.customerPhone || "",
      order.mode || "",
      order.address || "",
      Number(order.total || 0),
      order.payment || "",
      order.promoCode || "",
      order.partner?.id || "",
      telegramMessageId,
      order.createdAt,
      order.updatedAt
    ]
  );

  return publicOrder(result.rows[0]);
}

export async function listOrders() {
  const result = await pool.query("select * from orders order by created_at desc limit 200");
  return result.rows.map(publicOrder);
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES[status]) {
    const error = new Error("Некорректный статус заказа");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
      update orders
      set status = $2,
          raw = jsonb_set(
            jsonb_set(raw, '{status}', to_jsonb($2::text), true),
            '{updatedAt}',
            to_jsonb(now()::text),
            true
          ),
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, status]
  );

  if (!result.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  return publicOrder(result.rows[0]);
}

export async function closeOrder(id) {
  const result = await pool.query(
    `
      update orders
      set archived_at = now(), updated_at = now()
      where id = $1
      returning *
    `,
    [id]
  );

  if (!result.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  return publicOrder(result.rows[0]);
}

export async function saveAdminPushSubscription(subscription, label = "Админка") {
  if (!subscription?.endpoint) {
    const error = new Error("Push subscription не содержит endpoint");
    error.statusCode = 400;
    throw error;
  }

  const id = makeSubscriptionId(subscription.endpoint);
  const result = await pool.query(
    `
      insert into admin_push_subscriptions (id, label, subscription, created_at, updated_at)
      values ($1, $2, $3, now(), now())
      on conflict (id) do update set
        label = excluded.label,
        subscription = excluded.subscription,
        updated_at = now()
      returning id, label, created_at
    `,
    [id, label, subscription]
  );

  return result.rows[0];
}

export async function listAdminPushSubscriptions() {
  const result = await pool.query("select * from admin_push_subscriptions order by updated_at desc limit 20");
  return result.rows.filter((row) => row.subscription?.endpoint);
}
