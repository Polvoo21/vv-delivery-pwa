import {
  assertAdminPassword,
  initOrdersStore,
  saveAdminPushSubscription
} from "./lib/orders-store.js";
import { sendAdminTestPush } from "./lib/push.js";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

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

export const handler = async (event) => {
  const auth = assertAdminPassword(event);
  if (!auth.ok) {
    return json(auth.statusCode, {
      ok: false,
      error: auth.error
    });
  }

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

  const { action = "register", subscription, label = "Админка" } = parsed.value;
  if (!subscription?.endpoint) {
    return json(400, {
      ok: false,
      error: "Нужна push subscription"
    });
  }

  try {
    initOrdersStore(event);
    const saved = await saveAdminPushSubscription(subscription, label);
    const push = action === "test" ? await sendAdminTestPush(subscription) : null;

    return json(200, {
      ok: true,
      subscription: saved,
      push
    });
  } catch (error) {
    console.error("Admin push setup failed", error);
    return json(error.statusCode || 500, {
      ok: false,
      error: error.message || "Не удалось настроить push администратора",
      details: error.message || String(error),
      name: error.name || "Error"
    });
  }
};
