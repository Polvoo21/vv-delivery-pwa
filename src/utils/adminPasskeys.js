import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration
} from "@simplewebauthn/browser";
import { apiPath } from "./api";

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || "Не удалось выполнить защищённый вход");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function supportsAdminPasskeys() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    browserSupportsWebAuthn()
  );
}

function getDeviceName() {
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const touch = navigator.maxTouchPoints > 1 ? " · сенсорное устройство" : "";
  return `${platform || "Личное устройство"}${touch}`.slice(0, 180);
}

export async function registerAdminPasskey(headers = {}) {
  if (!supportsAdminPasskeys()) {
    throw new Error("На этом устройстве системный быстрый вход не поддерживается.");
  }

  const optionsData = await fetch(apiPath("adminPasskeyRegisterOptions"), {
    method: "POST",
    headers
  }).then(readJson);
  const response = await startRegistration({ optionsJSON: optionsData.options });
  const result = await fetch(apiPath("adminPasskeyRegisterVerify"), {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      challenge: optionsData.options.challenge,
      response,
      deviceName: getDeviceName()
    })
  }).then(readJson);

  return result.passkey;
}

export async function authenticateAdminPasskey(login) {
  if (!supportsAdminPasskeys()) {
    throw new Error("На этом устройстве системный быстрый вход не поддерживается.");
  }

  const normalizedLogin = String(login || "").trim().toLowerCase();
  if (!normalizedLogin) throw new Error("Сначала укажите логин.");

  const optionsData = await fetch(apiPath("adminPasskeyAuthOptions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: normalizedLogin })
  }).then(readJson);
  const response = await startAuthentication({ optionsJSON: optionsData.options });
  return fetch(apiPath("adminPasskeyAuthVerify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: normalizedLogin,
      challenge: optionsData.options.challenge,
      response
    })
  }).then(readJson);
}
