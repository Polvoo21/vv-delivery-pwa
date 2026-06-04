import { getPublicVapidKey } from "./lib/push.js";

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, {
      ok: false,
      error: "Method not allowed"
    });
  }

  const publicKey = getPublicVapidKey();

  if (!publicKey) {
    return json(500, {
      ok: false,
      error: "В Netlify не настроен VAPID_PUBLIC_KEY"
    });
  }

  return json(200, {
    ok: true,
    publicKey
  });
};
