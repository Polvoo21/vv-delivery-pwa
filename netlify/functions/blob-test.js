import { getStore } from "@netlify/blobs";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload, null, 2)
});

const getErrorPayload = (error) => ({
  message: error?.message || String(error),
  name: error?.name || null,
  stack: error?.stack || null
});

export const handler = async (event) => {
  try {
    const store = getStore({
      name: "vv-orders",
      consistency: "strong"
    });

    if (event.httpMethod === "POST") {
      const id = `test:${Date.now()}`;
      const payload = {
        id,
        type: "blob-test",
        message: "Тестовая запись в Netlify Blobs",
        createdAt: new Date().toISOString()
      };

      await store.setJSON(id, payload);

      const index = (await store.get("orders-index", { type: "json" }).catch(() => [])) || [];
      const nextIndex = [id, ...index.filter((item) => item !== id)].slice(0, 50);
      await store.setJSON("orders-index", nextIndex);

      return json(200, {
        ok: true,
        message: "Тестовая запись сохранена",
        id,
        payload,
        index: nextIndex
      });
    }

    if (event.httpMethod === "GET") {
      const index = (await store.get("orders-index", { type: "json" }).catch(() => [])) || [];
      const items = await Promise.all(
        index.map((id) =>
          store.get(id, { type: "json" }).catch((error) => ({
            id,
            error: getErrorPayload(error)
          }))
        )
      );

      return json(200, {
        ok: true,
        store: "vv-orders",
        index,
        items
      });
    }

    return json(405, {
      ok: false,
      error: "Method not allowed"
    });
  } catch (error) {
    console.error("blob-test failed", error);

    return json(500, {
      ok: false,
      error: "Netlify Blobs test failed",
      details: getErrorPayload(error)
    });
  }
};
