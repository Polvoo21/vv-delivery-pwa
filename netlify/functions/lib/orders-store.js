import { connectLambda, getStore } from "@netlify/blobs";

export const ORDER_STATUSES = {
  accepted: "Принят",
  cooking: "Готовится",
  courier: "У курьера",
  delivered: "Доставлен"
};

const INDEX_KEY = "orders-index";
const MAX_ORDERS = 200;
const STORE_NAME = "vv-orders";

export function initOrdersStore(event) {
  if (!event?.blobs) return;

  try {
    connectLambda(event);
  } catch (error) {
    console.warn("Netlify Blobs lambda context was not initialized", error);
  }
}

function manualBlobOptions() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || "";
  const token = process.env.NETLIFY_BLOBS_TOKEN || "";

  if (!siteID || !token) return null;

  return {
    name: STORE_NAME,
    siteID,
    token
  };
}

function getOrdersStore() {
  const manualOptions = manualBlobOptions();
  return manualOptions ? getStore(manualOptions) : getStore(STORE_NAME);
}

function makeOrderId() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${Date.now().toString(36).toUpperCase()}-${random}`;
}

function publicOrder(order) {
  return {
    id: order.id,
    status: order.status,
    statusLabel: ORDER_STATUSES[order.status] || ORDER_STATUSES.accepted,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    mode: order.mode,
    address: order.address,
    entrance: order.entrance,
    flat: order.flat,
    floor: order.floor,
    addressComment: order.addressComment,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderComment: order.orderComment,
    payment: order.payment,
    promoCode: order.promoCode,
    discount: order.discount,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    total: order.total,
    items: order.items || [],
    pushEnabled: Boolean(order.pushSubscription?.endpoint)
  };
}

export function assertAdminPassword(event) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      statusCode: 500,
      error: "В Netlify не настроен ADMIN_PASSWORD"
    };
  }

  const provided =
    event.headers?.["x-admin-password"] ||
    event.headers?.["X-Admin-Password"] ||
    event.headers?.["x-admin-token"] ||
    "";

  if (provided !== expected) {
    return {
      ok: false,
      statusCode: 401,
      error: "Неверный пароль администратора"
    };
  }

  return {
    ok: true
  };
}

export async function saveOrder(rawOrder) {
  const store = getOrdersStore();
  const now = new Date().toISOString();
  const id = rawOrder.id || makeOrderId();
  const order = {
    ...rawOrder,
    id,
    status: rawOrder.status || "accepted",
    createdAt: rawOrder.createdAt || now,
    updatedAt: now
  };

  await store.setJSON(`order:${id}`, order);

  const currentIndex = (await store.get(INDEX_KEY, { type: "json" }).catch(() => [])) || [];
  const nextIndex = [id, ...currentIndex.filter((item) => item !== id)].slice(0, MAX_ORDERS);
  await store.setJSON(INDEX_KEY, nextIndex);

  return publicOrder(order);
}

export async function listOrders() {
  const store = getOrdersStore();
  const index = (await store.get(INDEX_KEY, { type: "json" }).catch(() => [])) || [];
  const orders = await Promise.all(
    index.map((id) => store.get(`order:${id}`, { type: "json" }).catch(() => null))
  );

  return orders.filter(Boolean).map(publicOrder);
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES[status]) {
    const error = new Error("Некорректный статус заказа");
    error.statusCode = 400;
    throw error;
  }

  const store = getOrdersStore();
  const order = await store.get(`order:${id}`, { type: "json" }).catch(() => null);

  if (!order) {
    const error = new Error("Заказ не найден");
    error.statusCode = 404;
    throw error;
  }

  const nextOrder = {
    ...order,
    status,
    updatedAt: new Date().toISOString()
  };

  await store.setJSON(`order:${id}`, nextOrder);
  return {
    order: publicOrder(nextOrder),
    rawOrder: nextOrder
  };
}
