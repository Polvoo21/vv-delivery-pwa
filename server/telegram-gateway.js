import crypto from "node:crypto";

const DEFAULT_TELEGRAM_GATEWAY_API_BASE = "https://gatewayapi.telegram.org";

function makeProviderError(message, statusCode = 502, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function canUseMock(options = {}) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return options.allowMock || process.env.TELEGRAM_GATEWAY_MOCK_ENABLED === "true" || process.env.NODE_ENV === "development";
}

function gatewayToken() {
  return process.env.TELEGRAM_GATEWAY_TOKEN || process.env.TELEGRAM_GATEWAY_API_TOKEN || "";
}

function gatewayHeaders() {
  const token = gatewayToken();

  if (!token) {
    throw makeProviderError("Для входа по Telegram нужно задать TELEGRAM_GATEWAY_TOKEN", 501);
  }

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function postTelegramGateway(method, payload) {
  const apiBase = (process.env.TELEGRAM_GATEWAY_API_BASE || DEFAULT_TELEGRAM_GATEWAY_API_BASE).replace(/\/$/, "");
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: gatewayHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok !== true) {
    throw makeProviderError(data.error || "Telegram Gateway вернул ошибку", response.ok ? 400 : response.status, {
      provider: "telegram_gateway",
      method
    });
  }

  return data.result || {};
}

export function makeTelegramCode(length = 4) {
  const normalizedLength = Math.min(8, Math.max(4, Number(length) || 4));
  const min = 10 ** (normalizedLength - 1);
  const max = 10 ** normalizedLength;
  return String(crypto.randomInt(min, max));
}

export async function sendTelegramVerificationMessage(phone, code, options = {}) {
  if (canUseMock(options) && (options.forceMock || process.env.TELEGRAM_GATEWAY_MOCK_ENABLED === "true" || !gatewayToken())) {
    const requestId = `mock_tg_${crypto.randomUUID().replace(/-/g, "")}`;
    console.info(`[Telegram Gateway mock] ${phone}: код ${code}`);
    return {
      requestId,
      mock: true
    };
  }

  const payload = {
    phone_number: phone,
    code,
    ttl: Math.min(3600, Math.max(30, Number(options.ttlSeconds) || 300)),
    payload: options.payload || undefined,
    callback_url: options.callbackUrl || process.env.TELEGRAM_GATEWAY_CALLBACK_URL || undefined
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === "") {
      delete payload[key];
    }
  });

  const result = await postTelegramGateway("sendVerificationMessage", payload);

  if (!result.request_id) {
    throw makeProviderError("Telegram Gateway не вернул request_id", 502);
  }

  return {
    requestId: result.request_id,
    deliveryStatus: result.delivery_status?.status || "",
    remainingBalance: result.remaining_balance
  };
}

export async function checkTelegramVerificationStatus(requestId, code) {
  if (!requestId || !gatewayToken()) {
    return null;
  }

  return postTelegramGateway("checkVerificationStatus", {
    request_id: requestId,
    code
  });
}
