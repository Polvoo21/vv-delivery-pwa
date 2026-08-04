import crypto from "node:crypto";

const DEFAULT_PLUSOFON_API_BASE = "https://restapi.plusofon.ru";
const MOCK_FLASH_CALL_PIN = "8888";
const mockFlashCalls = new Map();

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

  return options.allowMock || process.env.PLUSOFON_MOCK_ENABLED === "true" || process.env.NODE_ENV === "development";
}

function plusofonHeaders() {
  const clientId = process.env.PLUSOFON_CLIENT_ID || "10553";
  const token = process.env.PLUSOFON_ACCESS_TOKEN;

  if (!token) {
    throw makeProviderError("Для Flash Call нужно задать PLUSOFON_ACCESS_TOKEN", 501);
  }

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Client: clientId,
    Authorization: `Bearer ${token}`
  };
}

async function postPlusofon(path, payload) {
  const apiBase = (process.env.PLUSOFON_API_BASE || DEFAULT_PLUSOFON_API_BASE).replace(/\/$/, "");
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: plusofonHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeProviderError(data.message || "Plusofon вернул ошибку", response.status, {
      providerCode: data.code
    });
  }

  return data;
}

function makeMockFlashCall(phone) {
  const key = `mock_${crypto.randomUUID().replace(/-/g, "")}`;
  mockFlashCalls.set(key, {
    phone,
    pin: MOCK_FLASH_CALL_PIN,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  console.info(`[Plusofon mock] Flash Call ${phone}: последние 4 цифры ${MOCK_FLASH_CALL_PIN}`);

  return {
    key,
    operator: "mock"
  };
}

export async function sendFlashCall(phone, options = {}) {
  if (canUseMock(options) && (options.forceMock || process.env.PLUSOFON_MOCK_ENABLED === "true" || !process.env.PLUSOFON_ACCESS_TOKEN)) {
    return makeMockFlashCall(phone);
  }

  const data = await postPlusofon("/api/v1/flash-call/send", { phone });

  if (data.success !== true || !data.data?.key) {
    throw makeProviderError(data.message || "Не удалось отправить Flash Call", 502);
  }

  if (data.data.pin && canUseMock(options)) {
    console.info(`[Plusofon dev] Flash Call ${phone}: последние 4 цифры ${data.data.pin}`);
  }

  return {
    key: data.data.key,
    operator: data.data.operator || ""
  };
}

export async function checkFlashCall(key, pin, options = {}) {
  const mockCall = mockFlashCalls.get(key);
  if (mockCall) {
    if (!canUseMock(options)) {
      throw makeProviderError("Mock Flash Call запрещен в production", 500);
    }

    if (mockCall.expiresAt < Date.now()) {
      mockFlashCalls.delete(key);
      return false;
    }

    return mockCall.pin === pin;
  }

  const data = await postPlusofon("/api/v1/flash-call/check", { key, pin });
  return data.success === true;
}
