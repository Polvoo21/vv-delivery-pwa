import { initOrdersStore, listOrders, saveOrder } from "./lib/orders-store.js";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

function makeTestOrder() {
  const now = new Date().toISOString();

  return {
    mode: "pickup",
    address: "Чебоксары, ул. Пирогова, 1Т",
    customerName: "Blob Test",
    customerPhone: "+7 000 000-00-00",
    payment: "test",
    total: 1,
    createdAt: now,
    orderComment: "Тестовая запись из /.netlify/functions/blob-test",
    items: [
      {
        name: "Тестовая пицца",
        qty: 1,
        lineTotal: 1
      }
    ]
  };
}

export const handler = async (event) => {
  try {
    initOrdersStore(event);

    if (event.httpMethod === "GET") {
      const orders = await listOrders();
      return json(200, {
        ok: true,
        store: "vv-orders",
        count: orders.length,
        message: "Netlify Blobs доступны"
      });
    }

    if (event.httpMethod === "POST") {
      const order = await saveOrder(makeTestOrder());
      return json(200, {
        ok: true,
        store: "vv-orders",
        key: `order:${order.id}`,
        orderId: order.id,
        message: "Тестовая запись сохранена"
      });
    }

    return json(405, {
      ok: false,
      error: "Method not allowed"
    });
  } catch (error) {
    console.error("Blob test failed", error);
    return json(500, {
      ok: false,
      error: "Netlify Blobs недоступны",
      details: error.message || String(error),
      name: error.name || "Error"
    });
  }
};
