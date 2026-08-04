import { createHash } from "node:crypto";
import { pool } from "./db.js";

export const ORDER_STATUSES = {
  payment_pending: "Ожидает оплату",
  payment_failed: "Оплата не прошла",
  new: "Получен",
  accepted: "Принят",
  cooking: "Готовится",
  courier: "У курьера",
  delivered: "Доставлен",
  cancelled: "Отменён"
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
  const paymentUrl = raw.paymentUrl || raw.paymentLink || "";
  const paymentProvider = row.payment_provider || raw.paymentProvider || "";
  const paymentId = row.payment_id || raw.paymentId || "";
  const paymentStatus = row.payment_status || raw.paymentStatus || "";

  return {
    ...raw,
    id: row.id,
    status: row.status,
    statusLabel: ORDER_STATUSES[row.status] || ORDER_STATUSES.new,
    archivedAt: row.archived_at || null,
    createdAt: row.created_at || raw.createdAt,
    updatedAt: row.updated_at || raw.updatedAt,
    customerName: row.customer_name || raw.customerName,
    customerPhone: row.customer_phone || raw.customerPhone,
    mode: row.mode || raw.mode,
    address: row.address || raw.address,
    total: Number(row.total || raw.total || 0),
    payment: row.payment || raw.payment,
    paymentUrl,
    paymentId,
    paymentStatus,
    paymentProvider,
    paidAt: row.paid_at || raw.paidAt || null,
    adminNote: raw.adminNote || "",
    acceptedAt: raw.acceptedAt || null,
    responseSeconds: Number(raw.responseSeconds || 0),
    cancelReason: raw.cancelReason || "",
    cancelledAt: raw.cancelledAt || null,
    promoCode: row.promo_code || raw.promoCode || "",
    partnerId: row.partner_id || raw.partner?.id || "",
    customerId: row.customer_id || raw.customerId || "",
    pushEnabled: Boolean(raw.pushSubscription?.endpoint),
    statusHistory: normalizeStatusHistory(raw.statusHistory, row)
  };
}

function normalizeStatusHistory(value, row = {}) {
  const raw = row.raw || {};
  const events = Array.isArray(value) ? value : [];
  const normalized = events
    .map((event) => {
      const status = String(event?.status || "").trim();
      const changedAt = event?.changedAt || event?.updatedAt || event?.createdAt || "";
      if (!ORDER_STATUSES[status] || !changedAt) return null;

      return {
        status,
        statusLabel: ORDER_STATUSES[status],
        changedAt,
        changedBy: String(event?.changedBy || "").trim(),
        role: String(event?.role || "").trim(),
        note: String(event?.note || "").trim()
      };
    })
    .filter(Boolean);

  if (normalized.length) {
    return normalized;
  }

  return [
    {
      status: row.status || raw.status || "new",
      statusLabel: ORDER_STATUSES[row.status || raw.status] || ORDER_STATUSES.new,
      changedAt: row.created_at || raw.createdAt || new Date().toISOString(),
      changedBy: "сайт",
      role: "system",
      note: "Заказ создан"
    }
  ];
}

function cleanPatchText(value, maxLength = 400) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function makeOrderPatch(patch = {}) {
  return {
    customerName: cleanPatchText(patch.customerName, 120),
    customerPhone: cleanPatchText(patch.customerPhone, 80),
    address: cleanPatchText(patch.address, 500),
    payment: cleanPatchText(patch.payment, 180),
    adminNote: cleanPatchText(patch.adminNote, 600)
  };
}

function normalizePublicNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePublicAddon(addon) {
  if (!addon || typeof addon !== "object") {
    return null;
  }

  const name = String(addon.name || "").trim();
  if (!name) {
    return null;
  }

  return {
    id: addon.id || "",
    name,
    price: normalizePublicNumber(addon.price),
    qty: Math.max(1, normalizePublicNumber(addon.qty, 1))
  };
}

function normalizePublicRemovedIngredient(value) {
  const name = typeof value === "string" ? value : value?.name;
  const cleanName = String(name || "").trim();
  return cleanName ? cleanName : null;
}

function normalizePublicOrderItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const qty = Math.max(1, normalizePublicNumber(item.qty || item.quantity, 1));
  const lineTotal = normalizePublicNumber(item.lineTotal);
  const unitPrice = normalizePublicNumber(
    item.unitPrice ?? item.price,
    qty > 0 && lineTotal > 0 ? Math.round(lineTotal / qty) : 0
  );
  const name = String(item.name || "").trim();

  if (!name) {
    return null;
  }

  return {
    productId: item.productId || item.id || "",
    category: item.category || "",
    name,
    description: item.description || "",
    image: item.image || item.visual || "",
    visual: item.visual || item.image || "",
    qty,
    unitPrice,
    weight: item.weight || item.size || "",
    addons: Array.isArray(item.addons) ? item.addons.map(normalizePublicAddon).filter(Boolean) : [],
    removed: Array.isArray(item.removed) ? item.removed.map(normalizePublicRemovedIngredient).filter(Boolean) : [],
    comboItems: Array.isArray(item.comboItems)
      ? item.comboItems.map(normalizePublicOrderItem).filter(Boolean)
      : []
  };
}

function publicRecentOrder(row) {
  const raw = row.raw || {};
  const items = (Array.isArray(raw.items) ? raw.items : []).map(normalizePublicOrderItem).filter(Boolean);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const calculatedTotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  return {
    id: row.id,
    publicId: String(row.id || "").replace(/[^a-z0-9]/gi, "").slice(-6),
    createdAt: row.created_at || raw.createdAt,
    mode: row.mode || raw.mode || "",
    total: normalizePublicNumber(row.total || raw.total, calculatedTotal),
    count,
    items
  };
}

const CUSTOMER_ACTION_WINDOW_MS = 150 * 1000;
const CUSTOMER_EDITABLE_STATUSES = new Set(["new", "accepted"]);

function getCustomerActionStartedAt(order = {}) {
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const receivedEvent = history.find((event) => event?.status === "new" && event?.changedAt);
  return order.paidAt || receivedEvent?.changedAt || order.createdAt || "";
}

function getCustomerActionAvailability(order = {}) {
  const startedAt = getCustomerActionStartedAt(order);
  const startedAtMs = new Date(startedAt).getTime();
  const expiresAtMs = Number.isFinite(startedAtMs) ? startedAtMs + CUSTOMER_ACTION_WINDOW_MS : 0;
  const remainingSeconds = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)) : 0;
  const statusAllowsChanges = CUSTOMER_EDITABLE_STATUSES.has(order.status);
  const available = statusAllowsChanges && remainingSeconds > 0;

  return {
    available,
    remainingSeconds,
    expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
    reason: available
      ? ""
      : statusAllowsChanges
        ? "Время для самостоятельных изменений закончилось"
        : "Ресторан уже начал выполнять заказ"
  };
}

function customerOrder(row) {
  const order = publicOrder(row);
  const items = (Array.isArray(order.items) ? order.items : []).map(normalizePublicOrderItem).filter(Boolean);
  const actionAvailability = getCustomerActionAvailability(order);
  const changeRequest = order.customerChangeRequest && typeof order.customerChangeRequest === "object"
    ? {
        text: cleanPatchText(order.customerChangeRequest.text, 600),
        status: cleanPatchText(order.customerChangeRequest.status || "pending", 40),
        createdAt: order.customerChangeRequest.createdAt || null
      }
    : null;

  return {
    id: order.id,
    publicId: String(order.id || "").replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase(),
    status: order.status,
    statusLabel: order.statusLabel,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    acceptedAt: order.acceptedAt,
    paidAt: order.paidAt,
    mode: order.mode || "delivery",
    address: order.address || "",
    entrance: cleanPatchText(order.entrance, 40),
    code: cleanPatchText(order.code, 40),
    flat: cleanPatchText(order.flat, 40),
    floor: cleanPatchText(order.floor, 40),
    addressComment: cleanPatchText(order.addressComment, 240),
    requestedTime: cleanPatchText(order.requestedTime, 120),
    orderComment: cleanPatchText(order.orderComment, 500),
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || order.total || 0),
    discountAmount: Number(order.discountAmount || 0),
    promoCode: cleanPatchText(order.promoCode, 80),
    payment: cleanPatchText(order.payment, 180),
    paymentStatus: cleanPatchText(order.paymentStatus, 80),
    paymentProvider: cleanPatchText(order.paymentProvider, 80),
    paymentDemo: Boolean(order.paymentDemo),
    items,
    statusHistory: order.statusHistory.map((event) => ({
      status: event.status,
      statusLabel: event.statusLabel,
      changedAt: event.changedAt,
      note: event.note
    })),
    customerChangeRequest: changeRequest,
    cancelReason: cleanPatchText(order.cancelReason, 500),
    cancelledAt: order.cancelledAt,
    refundStatus: cleanPatchText(order.refundStatus, 80),
    refundRequestedAt: order.refundRequestedAt || null,
    actions: {
      cancel: actionAvailability,
      change: actionAvailability
    }
  };
}

export async function saveOrder(rawOrder) {
  const now = new Date().toISOString();
  const id = rawOrder.id || makeOrderId();
  const order = {
    ...rawOrder,
    id,
    status: rawOrder.status || "new",
    createdAt: rawOrder.createdAt || now,
    updatedAt: now,
    statusHistory: Array.isArray(rawOrder.statusHistory) && rawOrder.statusHistory.length
      ? rawOrder.statusHistory
      : [
          {
            status: rawOrder.status || "new",
            statusLabel: ORDER_STATUSES[rawOrder.status || "new"] || ORDER_STATUSES.new,
            changedAt: rawOrder.createdAt || now,
            changedBy: "сайт",
            role: "system",
            note: "Заказ создан"
          }
        ]
  };

  const result = await pool.query(
    `
      insert into orders (
        id, status, raw, customer_name, customer_phone, mode, address, total, payment,
        promo_code, partner_id, customer_id, payment_provider, payment_id, payment_status, paid_at,
        created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        customer_id = excluded.customer_id,
        payment_provider = excluded.payment_provider,
        payment_id = coalesce(excluded.payment_id, orders.payment_id),
        payment_status = excluded.payment_status,
        paid_at = coalesce(excluded.paid_at, orders.paid_at),
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
      order.customerId || "",
      order.paymentProvider || "",
      order.paymentId || null,
      order.paymentStatus || "",
      order.paidAt || null,
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

export async function getOrderById(id) {
  const result = await pool.query("select * from orders where id = $1 limit 1", [id]);
  return result.rows[0] ? publicOrder(result.rows[0]) : null;
}

export async function getOrderByPaymentId(paymentId) {
  const result = await pool.query("select * from orders where payment_id = $1 limit 1", [paymentId]);
  return result.rows[0] ? publicOrder(result.rows[0]) : null;
}

export async function listCustomerOrders(customerId, limit = 20) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const result = await pool.query(
    "select * from orders where customer_id = $1 order by created_at desc limit $2",
    [customerId, safeLimit]
  );
  return result.rows.map(customerOrder);
}

export async function getCustomerOrderById(id, customerId) {
  const result = await pool.query(
    "select * from orders where id = $1 and customer_id = $2 limit 1",
    [id, customerId]
  );
  return result.rows[0] ? customerOrder(result.rows[0]) : null;
}

function assertCustomerOrderActionAllowed(row) {
  const order = publicOrder(row);
  const availability = getCustomerActionAvailability(order);
  if (!availability.available) {
    const error = new Error(availability.reason || "Заказ уже нельзя изменить самостоятельно");
    error.statusCode = 409;
    error.details = {
      remainingSeconds: availability.remainingSeconds,
      status: order.status
    };
    throw error;
  }
  return order;
}

export async function cancelCustomerOrder(id, customerId, reason = "") {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query(
      "select * from orders where id = $1 and customer_id = $2 for update",
      [id, customerId]
    );
    if (!currentResult.rowCount) {
      const error = new Error("Заказ не найден");
      error.statusCode = 404;
      throw error;
    }

    const current = currentResult.rows[0];
    const order = assertCustomerOrderActionAllowed(current);
    const raw = current.raw || {};
    const cleanReason = cleanPatchText(reason, 500) || "Отменён гостем в первые 2,5 минуты";
    const now = new Date().toISOString();
    const refundStatus = order.paymentStatus === "paid"
      ? order.paymentProvider === "demo"
        ? "not_required_demo"
        : "requested"
      : "not_required";
    const patch = {
      ...raw,
      status: "cancelled",
      cancelReason: cleanReason,
      cancelledBy: "customer",
      cancelledAt: now,
      refundStatus,
      refundRequestedAt: refundStatus === "requested" ? now : raw.refundRequestedAt || null,
      updatedAt: now,
      statusHistory: [
        ...normalizeStatusHistory(raw.statusHistory, current),
        makeStatusHistoryEvent(
          "cancelled",
          { login: "гость", role: "customer" },
          cleanReason
        )
      ]
    };

    const result = await client.query(
      `
        update orders
        set status = 'cancelled',
            raw = $3::jsonb,
            updated_at = now()
        where id = $1 and customer_id = $2
        returning *
      `,
      [id, customerId, patch]
    );

    await client.query("commit");
    return publicOrder(result.rows[0]);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function requestCustomerOrderChange(id, customerId, text = "") {
  const cleanText = cleanPatchText(text, 600);
  if (cleanText.length < 4) {
    const error = new Error("Опишите, что нужно изменить в заказе");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query(
      "select * from orders where id = $1 and customer_id = $2 for update",
      [id, customerId]
    );
    if (!currentResult.rowCount) {
      const error = new Error("Заказ не найден");
      error.statusCode = 404;
      throw error;
    }

    const current = currentResult.rows[0];
    assertCustomerOrderActionAllowed(current);
    const raw = current.raw || {};
    const patch = {
      ...raw,
      customerChangeRequest: {
        text: cleanText,
        status: "pending",
        createdAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };
    const result = await client.query(
      `
        update orders
        set raw = $3::jsonb,
            updated_at = now()
        where id = $1 and customer_id = $2
        returning *
      `,
      [id, customerId, patch]
    );

    await client.query("commit");
    return publicOrder(result.rows[0]);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function attachOrderPayment(id, payment = {}) {
  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const paymentStatus = String(payment.status || "pending");
  const patch = {
    ...raw,
    status: "payment_pending",
    payment: "Онлайн через ЮKassa",
    paymentProvider: "yookassa",
    paymentId: payment.id || raw.paymentId || "",
    paymentStatus,
    paymentUrl: payment.confirmationUrl || raw.paymentUrl || "",
    paymentTest: Boolean(payment.test),
    updatedAt: new Date().toISOString()
  };

  const result = await pool.query(
    `
      update orders
      set status = 'payment_pending',
          raw = $2::jsonb,
          payment = 'Онлайн через ЮKassa',
          payment_provider = 'yookassa',
          payment_id = $3,
          payment_status = $4,
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, patch, payment.id || null, paymentStatus]
  );

  await pool.query(
    `
      insert into order_payment_events (
        order_id, provider, provider_payment_id, event_type, payment_status, payload
      ) values ($1, 'yookassa', $2, 'payment.created', $3, $4::jsonb)
    `,
    [id, payment.id || null, paymentStatus, payment]
  );

  return publicOrder(result.rows[0]);
}

export async function markOrderPaymentCreateFailed(id, message = "") {
  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) return null;

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const patch = {
    ...raw,
    status: "payment_failed",
    paymentProvider: "yookassa",
    paymentStatus: "create_failed",
    paymentError: cleanPatchText(message, 500),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...normalizeStatusHistory(raw.statusHistory, current),
      {
        status: "payment_failed",
        statusLabel: ORDER_STATUSES.payment_failed,
        changedAt: new Date().toISOString(),
        changedBy: "yookassa",
        role: "system",
        note: "Не удалось создать платеж"
      }
    ]
  };

  const result = await pool.query(
    `
      update orders
      set status = 'payment_failed',
          raw = $2::jsonb,
          payment_provider = 'yookassa',
          payment_status = 'create_failed',
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, patch]
  );
  return publicOrder(result.rows[0]);
}

export async function prepareOrderPaymentRetry(id) {
  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const paymentStatus = current.payment_status || raw.paymentStatus || "";
  if (paymentStatus !== "canceled") return publicOrder(current);

  const patch = {
    ...raw,
    status: "payment_pending",
    paymentId: "",
    paymentUrl: "",
    paymentStatus: "pending",
    paymentAttempt: Math.max(1, Number(raw.paymentAttempt || 1)) + 1,
    updatedAt: new Date().toISOString()
  };

  const result = await pool.query(
    `
      update orders
      set status = 'payment_pending',
          raw = $2::jsonb,
          payment_id = null,
          payment_status = 'pending',
          updated_at = now()
      where id = $1
        and payment_status = 'canceled'
      returning *
    `,
    [id, patch]
  );

  return publicOrder(result.rows[0] || current);
}

export async function syncOrderPayment(id, providerPayment, eventType = "payment.checked") {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query("select * from orders where id = $1 for update", [id]);
    if (!currentResult.rowCount) {
      const error = new Error("Заказ не найден");
      error.statusCode = 404;
      throw error;
    }

    const current = currentResult.rows[0];
    const raw = current.raw || {};
    const providerStatus = String(providerPayment?.status || "pending");
    const previousPaymentStatus = current.payment_status || raw.paymentStatus || "";
    const paymentStatus = providerStatus === "succeeded" ? "paid" : providerStatus;
    const becamePaid = previousPaymentStatus !== "paid" && paymentStatus === "paid";
    let nextStatus = current.status;

    if (paymentStatus === "paid" && ["payment_pending", "payment_failed"].includes(current.status)) {
      nextStatus = "new";
    } else if (providerStatus === "canceled" && ["payment_pending", "payment_failed"].includes(current.status)) {
      nextStatus = "payment_failed";
    }

    const statusHistory = normalizeStatusHistory(raw.statusHistory, current);
    if (nextStatus !== current.status) {
      statusHistory.push({
        status: nextStatus,
        statusLabel: ORDER_STATUSES[nextStatus] || nextStatus,
        changedAt: new Date().toISOString(),
        changedBy: "yookassa",
        role: "system",
        note: paymentStatus === "paid" ? "Оплата подтверждена провайдером" : "Платеж отменен провайдером"
      });
    }

    const patch = {
      ...raw,
      status: nextStatus,
      payment: "Онлайн через ЮKassa",
      paymentProvider: "yookassa",
      paymentId: providerPayment.id || current.payment_id || "",
      paymentStatus,
      paidAt: paymentStatus === "paid" ? providerPayment.captured_at || raw.paidAt || new Date().toISOString() : null,
      refundable: Boolean(providerPayment.refundable),
      updatedAt: new Date().toISOString(),
      statusHistory
    };

    const result = await client.query(
      `
        update orders
        set status = $2,
            raw = $3::jsonb,
            payment = 'Онлайн через ЮKassa',
            payment_provider = 'yookassa',
            payment_id = $4,
            payment_status = $5,
            paid_at = case when $5 = 'paid' then coalesce(paid_at, now()) else paid_at end,
            updated_at = now()
        where id = $1
        returning *
      `,
      [id, nextStatus, patch, providerPayment.id || current.payment_id || null, paymentStatus]
    );

    await client.query(
      `
        insert into order_payment_events (
          order_id, provider, provider_payment_id, event_type, payment_status, payload
        ) values ($1, 'yookassa', $2, $3, $4, $5::jsonb)
      `,
      [id, providerPayment.id || current.payment_id || null, cleanPatchText(eventType, 120), paymentStatus, providerPayment]
    );

    await client.query("commit");
    return {
      order: publicOrder(result.rows[0]),
      becamePaid
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function completeDemoOrderPayment(id) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query("select * from orders where id = $1 for update", [id]);
    if (!currentResult.rowCount) {
      const error = new Error("Заказ не найден");
      error.statusCode = 404;
      throw error;
    }

    const current = currentResult.rows[0];
    const raw = current.raw || {};
    const previousPaymentStatus = current.payment_status || raw.paymentStatus || "";
    if (previousPaymentStatus === "paid") {
      await client.query("commit");
      return {
        order: publicOrder(current),
        becamePaid: false
      };
    }

    const becamePaid = previousPaymentStatus !== "paid";
    const paidAt = current.paid_at || raw.paidAt || new Date().toISOString();
    const statusHistory = normalizeStatusHistory(raw.statusHistory, current);

    if (current.status !== "new") {
      statusHistory.push({
        status: "new",
        statusLabel: ORDER_STATUSES.new,
        changedAt: new Date().toISOString(),
        changedBy: "demo-pay",
        role: "system",
        note: "Демонстрационная онлайн-оплата подтверждена"
      });
    }

    const patch = {
      ...raw,
      status: "new",
      payment: "Онлайн, демо-оплата",
      paymentProvider: "demo",
      paymentId: current.payment_id || raw.paymentId || "",
      paymentStatus: "paid",
      paymentDemo: true,
      paidAt,
      updatedAt: new Date().toISOString(),
      statusHistory
    };

    const result = await client.query(
      `
        update orders
        set status = 'new',
            raw = $2::jsonb,
            payment = 'Онлайн, демо-оплата',
            payment_provider = 'demo',
            payment_status = 'paid',
            paid_at = coalesce(paid_at, now()),
            updated_at = now()
        where id = $1
        returning *
      `,
      [id, patch]
    );

    await client.query(
      `
        insert into order_payment_events (
          order_id, provider, provider_payment_id, event_type, payment_status, payload
        ) values ($1, 'demo', $2, 'demo.payment.succeeded', 'paid', $3::jsonb)
      `,
      [
        id,
        current.payment_id || raw.paymentId || null,
        {
          id: current.payment_id || raw.paymentId || "",
          orderId: id,
          status: "succeeded",
          test: true,
          capturedAt: paidAt
        }
      ]
    );

    await client.query("commit");
    return {
      order: publicOrder(result.rows[0]),
      becamePaid
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function recordOrderRefund(id, refund, account = null) {
  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const refunds = Array.isArray(raw.refunds) ? raw.refunds : [];
  const patch = {
    ...raw,
    refunds: [
      ...refunds,
      {
        ...refund,
        createdBy: cleanPatchText(account?.login || account?.role || "admin", 80)
      }
    ],
    updatedAt: new Date().toISOString()
  };

  const result = await pool.query(
    "update orders set raw = $2::jsonb, updated_at = now() where id = $1 returning *",
    [id, patch]
  );

  await pool.query(
    `
      insert into order_payment_events (
        order_id, provider, provider_payment_id, event_type, payment_status, payload
      ) values ($1, 'yookassa', $2, 'refund.created', $3, $4::jsonb)
    `,
    [id, current.payment_id || null, refund.status || "pending", refund]
  );

  return publicOrder(result.rows[0]);
}

export async function syncOrderRefund(id, refund) {
  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const refunds = Array.isArray(raw.refunds) ? raw.refunds : [];
  const refundIndex = refunds.findIndex((item) => item?.id === refund?.id);
  const nextRefund = {
    ...(refundIndex >= 0 ? refunds[refundIndex] : {}),
    id: refund.id,
    status: refund.status || "pending",
    amount: refund.amount,
    createdAt: refund.created_at || refund.createdAt || null,
    updatedAt: new Date().toISOString()
  };
  const nextRefunds = refundIndex >= 0
    ? refunds.map((item, index) => (index === refundIndex ? nextRefund : item))
    : [...refunds, nextRefund];
  const patch = { ...raw, refunds: nextRefunds, updatedAt: new Date().toISOString() };
  const result = await pool.query(
    "update orders set raw = $2::jsonb, updated_at = now() where id = $1 returning *",
    [id, patch]
  );
  await pool.query(
    `
      insert into order_payment_events (
        order_id, provider, provider_payment_id, event_type, payment_status, payload
      ) values ($1, 'yookassa', $2, 'refund.synced', $3, $4::jsonb)
    `,
    [id, current.payment_id || null, nextRefund.status, refund]
  );
  return publicOrder(result.rows[0]);
}

export async function listPublicRecentDeliveredOrders(limit = 10) {
  const safeLimit = Math.min(10, Math.max(1, normalizePublicNumber(limit, 10)));
  const result = await pool.query(
    `
      select id, raw, mode, total, created_at
      from orders
      where status = 'delivered'
      order by created_at desc
      limit $1
    `,
    [safeLimit]
  );

  return result.rows.map(publicRecentOrder).filter((order) => order.items.length > 0);
}

const MANAGER_PERIODS = {
  today: {
    localStart: "date_trunc('day', now() at time zone 'Europe/Moscow')",
    localEnd: "date_trunc('day', now() at time zone 'Europe/Moscow') + interval '1 day'",
    seriesLocalStart: "date_trunc('day', now() at time zone 'Europe/Moscow') + interval '9 hours'",
    step: "3 hours"
  },
  month: {
    localStart: "date_trunc('month', now() at time zone 'Europe/Moscow')",
    localEnd: "date_trunc('month', now() at time zone 'Europe/Moscow') + interval '1 month'",
    step: "7 days"
  },
  year: {
    localStart: "date_trunc('year', now() at time zone 'Europe/Moscow')",
    localEnd: "date_trunc('year', now() at time zone 'Europe/Moscow') + interval '1 year'",
    step: "1 month"
  }
};

function managerChartLabel(period, value, index, totalPoints) {
  const date = new Date(value);

  if (period === "today") {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Moscow"
    }).format(date);
  }

  if (period === "year") {
    const monthIndex =
      Number(
        new Intl.DateTimeFormat("ru-RU", {
          month: "numeric",
          timeZone: "Europe/Moscow"
        }).format(date)
      ) - 1;
    return ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][
      monthIndex
    ];
  }

  const dateParts = new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Europe/Moscow"
  })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const startDay = Number(dateParts.day);
  const monthDays = new Date(
    Date.UTC(
      Number(dateParts.year),
      Number(dateParts.month),
      0
    )
  ).getUTCDate();
  const endDay = index === totalPoints - 1
    ? monthDays
    : Math.min(monthDays, startDay + 6);
  return `${startDay}–${endDay}`;
}

async function getManagerPeriodAnalytics(period) {
  const config = MANAGER_PERIODS[period] || MANAGER_PERIODS.today;
  const validOrder = "o.status not in ('cancelled', 'payment_pending', 'payment_failed')";
  const boundsSql = `
    select
      ${config.localStart} as local_start,
      ${config.localEnd} as local_end,
      ${config.seriesLocalStart || config.localStart} as series_local_start,
      ${config.seriesLocalEnd || config.localEnd} as series_local_end,
      ((${config.localStart}) at time zone 'Europe/Moscow') as start_at,
      ((${config.localEnd}) at time zone 'Europe/Moscow') as end_at,
      '${config.step}'::interval as step
  `;

  const [summaryResult, seriesResult, topItemsResult, partnerRankingResult] = await Promise.all([
    pool.query(
      `
        with bounds as (${boundsSql})
        select
          count(*) filter (where ${validOrder})::int as orders,
          coalesce(sum(o.total) filter (where ${validOrder}), 0)::numeric as revenue,
          coalesce(avg(o.total) filter (where ${validOrder}), 0)::numeric as average_ticket,
          count(*) filter (where o.status = 'cancelled')::int as cancelled_orders,
          count(*) filter (where ${validOrder} and o.mode = 'pickup')::int as pickup_orders,
          count(*) filter (where ${validOrder} and coalesce(o.mode, 'delivery') <> 'pickup')::int as delivery_orders,
          count(*) filter (
            where ${validOrder}
              and (
                nullif(o.payment_provider, '') is not null
                or o.payment_status = 'paid'
                or lower(coalesce(o.payment, '')) ~ '(онлайн|сайт|яндекс|юkassa|yookassa)'
              )
          )::int as online_orders,
          count(*) filter (where ${validOrder} and o.payment_status = 'paid')::int as paid_orders,
          coalesce(
            avg(
              case
                when coalesce(o.raw->>'responseSeconds', '') ~ '^[0-9]+$'
                  then (o.raw->>'responseSeconds')::numeric
                when coalesce(o.raw->>'acceptedAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
                  then greatest(
                    0,
                    extract(epoch from ((o.raw->>'acceptedAt')::timestamptz - o.created_at))
                  )
                else null
              end
            ),
            0
          )::numeric as average_response_seconds
        from bounds b
        left join orders o
          on o.created_at >= b.start_at
         and o.created_at < b.end_at
      `
    ),
    pool.query(
      `
        with bounds as (${boundsSql}),
        buckets as (
          select
            (local_bucket at time zone 'Europe/Moscow') as bucket_start,
            least(
              ((local_bucket + b.step) at time zone 'Europe/Moscow'),
              b.end_at
            ) as bucket_end
          from bounds b
          cross join lateral generate_series(
            b.series_local_start,
            b.series_local_end - interval '1 second',
            b.step
          ) as local_bucket
        )
        select
          buckets.bucket_start,
          count(o.id)::int as orders,
          coalesce(sum(o.total), 0)::numeric as revenue
        from buckets
        left join orders o
          on o.created_at >= buckets.bucket_start
         and o.created_at < buckets.bucket_end
         and ${validOrder}
        group by buckets.bucket_start
        order by buckets.bucket_start
      `
    ),
    pool.query(
      `
        with bounds as (${boundsSql}),
        item_rows as (
          select
            coalesce(
              nullif(trim(item->>'productId'), ''),
              lower(nullif(trim(item->>'name'), ''))
            ) as item_key,
            coalesce(nullif(trim(item->>'name'), ''), 'Без названия') as item_name,
            case
              when coalesce(item->>'qty', item->>'quantity', '') ~ '^[0-9]+([.,][0-9]+)?$'
                then replace(coalesce(item->>'qty', item->>'quantity'), ',', '.')::numeric
              else 1
            end as quantity,
            item
          from bounds b
          join orders o
            on o.created_at >= b.start_at
           and o.created_at < b.end_at
           and ${validOrder}
          cross join lateral jsonb_array_elements(
            case
              when jsonb_typeof(o.raw->'items') = 'array' then o.raw->'items'
              else '[]'::jsonb
            end
          ) as item
        ),
        normalized_items as (
          select
            item_key,
            item_name,
            quantity,
            case
              when coalesce(item->>'lineTotal', '') ~ '^[0-9]+([.,][0-9]+)?$'
                then replace(item->>'lineTotal', ',', '.')::numeric
              when coalesce(item->>'unitPrice', item->>'price', '') ~ '^[0-9]+([.,][0-9]+)?$'
                then replace(coalesce(item->>'unitPrice', item->>'price'), ',', '.')::numeric * quantity
              else 0
            end as item_revenue
          from item_rows
          where item_key is not null
        )
        select
          max(item_name) as name,
          sum(quantity)::numeric as quantity,
          sum(item_revenue)::numeric as revenue
        from normalized_items
        group by item_key
        order by quantity desc, revenue desc, name
        limit 5
      `
    ),
    pool.query(
      `
        with bounds as (${boundsSql}),
        commission_stats as (
          select
            c.partner_id,
            count(c.id) filter (where c.status <> 'cancelled')::int as orders_count,
            coalesce(sum(c.order_total) filter (where c.status <> 'cancelled'), 0)::numeric as revenue,
            coalesce(
              sum(c.commission_amount) filter (where c.status in ('approved', 'paid')),
              0
            )::numeric as commission_amount,
            coalesce(
              sum(c.commission_amount) filter (where c.status = 'approved'),
              0
            )::numeric as approved_amount,
            coalesce(
              sum(c.commission_amount) filter (where c.status = 'paid'),
              0
            )::numeric as legacy_paid_amount
          from bounds b
          join partner_commissions c
            on c.created_at >= b.start_at
           and c.created_at < b.end_at
          group by c.partner_id
        ),
        payout_stats as (
          select
            pay.partner_id,
            coalesce(sum(pay.amount) filter (where pay.status = 'confirmed'), 0)::numeric as paid_amount
          from bounds b
          join partner_payouts pay
            on pay.paid_at >= b.start_at
           and pay.paid_at < b.end_at
          group by pay.partner_id
        )
        select
          p.id,
          p.name,
          p.promo_code,
          c.orders_count,
          c.revenue,
          c.commission_amount,
          greatest(c.approved_amount - coalesce(pay.paid_amount, 0), 0)::numeric as payable_amount,
          (c.legacy_paid_amount + coalesce(pay.paid_amount, 0))::numeric as paid_amount
        from commission_stats c
        join partners p on p.id = c.partner_id
        left join payout_stats pay on pay.partner_id = c.partner_id
        order by revenue desc, orders_count desc, p.name
        limit 10
      `
    )
  ]);

  const summary = summaryResult.rows[0] || {};
  const orders = Number(summary.orders || 0);
  const cancelledOrders = Number(summary.cancelled_orders || 0);
  const onlineOrders = Number(summary.online_orders || 0);
  const deliveryOrders = Number(summary.delivery_orders || 0);
  const pickupOrders = Number(summary.pickup_orders || 0);
  const chartRows = seriesResult.rows || [];

  return {
    orders,
    revenue: Number(summary.revenue || 0),
    averageTicket: Number(summary.average_ticket || 0),
    cancelledOrders,
    cancelRate: orders + cancelledOrders ? Math.round((cancelledOrders / (orders + cancelledOrders)) * 100) : 0,
    averageResponseSeconds: Math.round(Number(summary.average_response_seconds || 0)),
    paidOrders: Number(summary.paid_orders || 0),
    series: chartRows.map((row, index) => ({
      label: managerChartLabel(period, row.bucket_start, index, chartRows.length),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0)
    })),
    fulfillment: [
      { id: "delivery", label: "Доставка", orders: deliveryOrders },
      { id: "pickup", label: "Самовывоз", orders: pickupOrders }
    ],
    payments: [
      { id: "online", label: "Онлайн", orders: onlineOrders },
      { id: "other", label: "При получении", orders: Math.max(0, orders - onlineOrders) }
    ],
    topItems: topItemsResult.rows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity || 0),
      revenue: Number(row.revenue || 0)
    })),
    partnerRanking: partnerRankingResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      promoCode: row.promo_code,
      ordersCount: Number(row.orders_count || 0),
      revenue: Number(row.revenue || 0),
      commissionAmount: Number(row.commission_amount || 0),
      payableAmount: Number(row.payable_amount || 0),
      paidAmount: Number(row.paid_amount || 0)
    }))
  };
}

export async function getManagerDashboard() {
  const [totalsResult, responseResult, periods] = await Promise.all([
    pool.query(
    `
      select
        count(*) filter (where archived_at is null and status not in ('cancelled', 'payment_pending', 'payment_failed'))::int as active_orders,
        count(*) filter (where archived_at is null and status = 'new')::int as new_orders,
        count(*) filter (where archived_at is null and status = 'cancelled')::int as cancelled_active_orders,
        count(*) filter (where archived_at is null and status = 'accepted')::int as accepted_orders,
        count(*) filter (where archived_at is null and status = 'cooking')::int as cooking_orders,
        count(*) filter (where archived_at is null and status = 'courier')::int as courier_orders
      from orders
    `
    ),
    pool.query(
    `
      select
        id,
        customer_name,
        total,
        created_at,
        raw->>'acceptedAt' as accepted_at,
        greatest(
          0,
          floor(extract(epoch from ((raw->>'acceptedAt')::timestamptz - created_at)))::int
        ) as response_seconds
      from orders
      where coalesce(raw->>'acceptedAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
      order by response_seconds desc nulls last
      limit 1
    `
    ),
    Promise.all([
      getManagerPeriodAnalytics("today"),
      getManagerPeriodAnalytics("month"),
      getManagerPeriodAnalytics("year")
    ])
  ]);

  const totals = totalsResult.rows[0] || {};
  const slowest = responseResult.rows[0] || null;
  const [today, month, year] = periods;

  return {
    today,
    month,
    year,
    periods: { today, month, year },
    active: {
      orders: Number(totals.active_orders || 0),
      newOrders: Number(totals.new_orders || 0),
      cancelledOrders: Number(totals.cancelled_active_orders || 0),
      byStatus: {
        accepted: Number(totals.accepted_orders || 0),
        cooking: Number(totals.cooking_orders || 0),
        courier: Number(totals.courier_orders || 0)
      }
    },
    response: {
      slowest: slowest
        ? {
            id: slowest.id,
            customerName: slowest.customer_name || "Гость",
            total: Number(slowest.total || 0),
            createdAt: slowest.created_at,
            acceptedAt: slowest.accepted_at,
            seconds: Number(slowest.response_seconds || 0)
          }
        : null
    }
  };
}

function makeStatusHistoryEvent(status, account = null, note = "") {
  return {
    status,
    statusLabel: ORDER_STATUSES[status] || status,
    changedAt: new Date().toISOString(),
    changedBy: cleanPatchText(account?.login || account?.label || account?.role || "admin", 80),
    role: cleanPatchText(account?.role || "", 40),
    note: cleanPatchText(note, 240)
  };
}

export async function updateOrderStatus(id, status, account = null) {
  if (!ORDER_STATUSES[status]) {
    const error = new Error("Некорректный статус заказа");
    error.statusCode = 400;
    throw error;
  }

  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const statusHistory = normalizeStatusHistory(raw.statusHistory, current);
  const now = new Date();
  const patch = {
    ...raw,
    status,
    updatedAt: now.toISOString(),
    statusHistory: [
      ...statusHistory,
      makeStatusHistoryEvent(status, account, current.status === status ? "Статус подтвержден повторно" : "")
    ]
  };

  if (status === "accepted" && !raw.acceptedAt) {
    patch.acceptedAt = now.toISOString();
    patch.responseSeconds = Math.max(0, Math.floor((now.getTime() - new Date(current.created_at).getTime()) / 1000));
  }

  const result = await pool.query(
    `
      update orders
      set status = $2,
          raw = $3::jsonb,
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, status, patch]
  );

  return publicOrder(result.rows[0]);
}

export async function updateOrderDetails(id, patch) {
  const cleanPatch = makeOrderPatch(patch);

  const result = await pool.query(
    `
      update orders
      set raw = coalesce(raw, '{}'::jsonb)
            || jsonb_build_object(
              'customerName', $2::text,
              'customerPhone', $3::text,
              'address', $4::text,
              'payment', $5::text,
              'adminNote', $6::text,
              'updatedAt', now()::text
            ),
          customer_name = $2,
          customer_phone = $3,
          address = $4,
          payment = $5,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      id,
      cleanPatch.customerName,
      cleanPatch.customerPhone,
      cleanPatch.address,
      cleanPatch.payment,
      cleanPatch.adminNote
    ]
  );

  if (!result.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  return publicOrder(result.rows[0]);
}

export async function cancelOrder(id, reason = "", account = null) {
  const cleanReason = cleanPatchText(reason, 500) || "Отменён сотрудником";
  const cancelledBy = cleanPatchText(account?.login || account?.role || "admin", 80);

  const currentResult = await pool.query("select * from orders where id = $1", [id]);
  if (!currentResult.rowCount) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const current = currentResult.rows[0];
  const raw = current.raw || {};
  const patch = {
    ...raw,
    status: "cancelled",
    cancelReason: cleanReason,
    cancelledBy,
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...normalizeStatusHistory(raw.statusHistory, current),
      makeStatusHistoryEvent("cancelled", account, cleanReason)
    ]
  };

  const result = await pool.query(
    `
      update orders
      set status = 'cancelled',
          raw = $2::jsonb,
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, patch]
  );

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

export async function saveAdminPushSubscription(subscription, label = "Админка", account = {}) {
  if (!subscription?.endpoint) {
    const error = new Error("Push subscription не содержит endpoint");
    error.statusCode = 400;
    throw error;
  }

  const id = makeSubscriptionId(subscription.endpoint);
  const result = await pool.query(
    `
      insert into admin_push_subscriptions (
        id, label, subscription, admin_login, admin_role, created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, now(), now())
      on conflict (id) do update set
        label = excluded.label,
        subscription = excluded.subscription,
        admin_login = excluded.admin_login,
        admin_role = excluded.admin_role,
        updated_at = now()
      returning id, label, admin_login, admin_role, created_at
    `,
    [id, label, subscription, account.login || null, account.role || null]
  );

  return result.rows[0];
}

export async function listAdminPushSubscriptions() {
  const result = await pool.query("select * from admin_push_subscriptions order by updated_at desc limit 20");
  return result.rows.filter((row) => row.subscription?.endpoint);
}

export async function deleteAdminPushSubscription(id) {
  if (!id) return;
  await pool.query("delete from admin_push_subscriptions where id = $1", [id]);
}

export async function deleteAdminPushSubscriptionByEndpoint(endpoint) {
  if (!endpoint) return;
  await pool.query("delete from admin_push_subscriptions where id = $1", [makeSubscriptionId(endpoint)]);
}

export async function saveCustomerPushSubscription(customerId, subscription) {
  if (!customerId) {
    const error = new Error("Не удалось определить клиента");
    error.statusCode = 401;
    throw error;
  }
  if (!subscription?.endpoint) {
    const error = new Error("Push subscription не содержит endpoint");
    error.statusCode = 400;
    throw error;
  }

  const id = makeSubscriptionId(subscription.endpoint);
  const result = await pool.query(
    `
      insert into customer_push_subscriptions (id, customer_id, subscription, created_at, updated_at)
      values ($1, $2, $3, now(), now())
      on conflict (id) do update set
        customer_id = excluded.customer_id,
        subscription = excluded.subscription,
        updated_at = now()
      returning id, customer_id, created_at
    `,
    [id, customerId, subscription]
  );
  return result.rows[0];
}

export async function listCustomerPushSubscriptions(customerId) {
  if (!customerId) return [];
  const result = await pool.query(
    `
      select id, subscription
      from customer_push_subscriptions
      where customer_id = $1
      order by updated_at desc
      limit 10
    `,
    [customerId]
  );
  return result.rows.filter((row) => row.subscription?.endpoint);
}

export async function deleteCustomerPushSubscription(id) {
  if (!id) return;
  await pool.query("delete from customer_push_subscriptions where id = $1", [id]);
}
