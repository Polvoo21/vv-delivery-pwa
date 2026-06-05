import {
  assertAdminPassword,
  initOrdersStore,
  listOrders,
  ORDER_STATUSES,
  updateOrderStatus
} from "./lib/orders-store.js";
import { sendStatusPush } from "./lib/push.js";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

const parseBody = (body) => {
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
};

export const handler = async (event) => {
  const auth = assertAdminPassword(event);
  if (!auth.ok) {
    return json(auth.statusCode, {
      ok: false,
      error: auth.error
    });
  }

  if (event.httpMethod === "GET") {
    try {
      initOrdersStore(event);
      const orders = await listOrders();
      return json(200, {
        ok: true,
        statuses: ORDER_STATUSES,
        orders
      });
    } catch (error) {
      console.error("Admin orders list failed", error);
      return json(500, {
        ok: false,
        error: "Не удалось загрузить заказы",
        details: error.message || String(error),
        name: error.name || "Error"
      });
    }
  }

  if (event.httpMethod === "PATCH") {
    const parsed = parseBody(event.body);
    if (!parsed.ok) {
      return json(400, {
        ok: false,
        error: parsed.error
      });
    }

    const { id, status } = parsed.value;
    if (!id || !status) {
      return json(400, {
        ok: false,
        error: "Нужны id и status"
      });
    }

    try {
      initOrdersStore(event);
      const { order, rawOrder } = await updateOrderStatus(id, status);
      const push = await sendStatusPush(rawOrder);
      return json(200, {
        ok: true,
        order,
        push
      });
    } catch (error) {
      return json(error.statusCode || 500, {
        ok: false,
        error: error.message || "Не удалось обновить заказ",
        details: error.message || String(error),
        name: error.name || "Error"
      });
    }
  }

  return json(405, {
    ok: false,
    error: "Method not allowed"
  });
};
