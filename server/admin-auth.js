import crypto from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import { pool } from "./db.js";

const ADMIN_SESSION_COOKIE = "vv_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSKEY_CHALLENGE_TTL_MINUTES = 5;
const RP_NAME = "Вместе Вкуснее · Пульт заказов";

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function cleanLogin(value) {
  return String(value || "").trim().toLowerCase().slice(0, 120);
}

function readCookie(request, name) {
  const cookie = request.get("cookie") || "";
  const parts = cookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1));
}

function appendSetCookie(response, cookie) {
  const current = response.getHeader("Set-Cookie");
  if (!current) {
    response.setHeader("Set-Cookie", cookie);
    return;
  }

  response.setHeader("Set-Cookie", Array.isArray(current) ? [...current, cookie] : [current, cookie]);
}

function isSecureRequest(request) {
  return request.secure || request.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
}

function buildSessionCookie(value, request, maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS) {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (isSecureRequest(request)) parts.push("Secure");
  return parts.join("; ");
}

export function setAdminSessionCookie(response, request, token) {
  appendSetCookie(response, buildSessionCookie(token, request));
}

export function clearAdminSessionCookie(response, request) {
  appendSetCookie(response, buildSessionCookie("", request, 0));
}

function getRequestHost(request) {
  const forwardedHost = (request.get("x-forwarded-host") || "").split(",")[0]?.trim();
  return (forwardedHost || request.get("host") || "localhost").split(":")[0].toLowerCase();
}

function getRequestOrigin(request) {
  const explicitOrigin = String(request.get("origin") || "").trim();
  if (explicitOrigin) return explicitOrigin.replace(/\/$/, "");

  const forwardedProto = (request.get("x-forwarded-proto") || "").split(",")[0]?.trim();
  const forwardedHost = (request.get("x-forwarded-host") || "").split(",")[0]?.trim();
  const protocol = forwardedProto || request.protocol || "http";
  const host = forwardedHost || request.get("host") || "localhost";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

export function getAdminWebAuthnContext(request) {
  const hostname = getRequestHost(request);
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const rpID = isLocal ? hostname : "vmestevkusnee.ru";
  const origin = isLocal ? getRequestOrigin(request) : "https://vmestevkusnee.ru";

  return { rpID, origin };
}

async function saveChallenge(login, kind, challenge) {
  await pool.query("delete from admin_webauthn_challenges where expires_at <= now() or admin_login = $1", [login]);
  await pool.query(
    `
      insert into admin_webauthn_challenges (id, admin_login, kind, challenge, expires_at)
      values ($1, $2, $3, $4, now() + ($5::int * interval '1 minute'))
    `,
    [
      `admin_challenge_${crypto.randomUUID().replace(/-/g, "")}`,
      cleanLogin(login),
      kind,
      challenge,
      PASSKEY_CHALLENGE_TTL_MINUTES
    ]
  );
}

async function consumeChallenge(login, kind, challenge) {
  const result = await pool.query(
    `
      delete from admin_webauthn_challenges
      where admin_login = $1
        and kind = $2
        and challenge = $3
        and expires_at > now()
      returning challenge
    `,
    [cleanLogin(login), kind, String(challenge || "")]
  );

  if (!result.rowCount) {
    throw makeError("Проверка входа устарела. Запустите Face ID или отпечаток ещё раз.", 400);
  }

  return result.rows[0].challenge;
}

export async function listAdminPasskeys(login) {
  const result = await pool.query(
    `
      select id, admin_login, name, transports, device_type, backed_up, created_at, last_used_at
      from admin_passkeys
      where admin_login = $1
      order by created_at desc
    `,
    [cleanLogin(login)]
  );
  return result.rows;
}

export async function createAdminPasskeyRegistrationOptions(account, request) {
  const login = cleanLogin(account?.login);
  if (!login) throw makeError("Не удалось определить аккаунт", 400);

  const passkeys = await listAdminPasskeys(login);
  const { rpID } = getAdminWebAuthnContext(request);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: Buffer.from(`admin:${login}`, "utf8"),
    userName: login,
    userDisplayName: account?.label ? `${account.label} · ${login}` : login,
    attestationType: "none",
    excludeCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: Array.isArray(passkey.transports) ? passkey.transports : undefined
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required"
    },
    preferredAuthenticatorType: "localDevice",
    supportedAlgorithmIDs: [-7, -257],
    timeout: 60_000
  });

  await saveChallenge(login, "registration", options.challenge);
  return options;
}

export async function finishAdminPasskeyRegistration(account, request, input = {}) {
  const login = cleanLogin(account?.login);
  const expectedChallenge = await consumeChallenge(login, "registration", input.challenge);
  const { rpID, origin } = getAdminWebAuthnContext(request);
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    supportedAlgorithmIDs: [-7, -257]
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw makeError("Не удалось подтвердить системную биометрию", 400);
  }

  const info = verification.registrationInfo;
  const credential = info.credential;
  const deviceName = String(input.deviceName || request.get("user-agent") || "Личное устройство").slice(0, 180);
  const result = await pool.query(
    `
      insert into admin_passkeys (
        id, admin_login, name, public_key, counter, transports,
        device_type, backed_up, created_at, updated_at, last_used_at
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, now(), now(), now())
      on conflict (id) do update set
        admin_login = excluded.admin_login,
        name = excluded.name,
        public_key = excluded.public_key,
        counter = excluded.counter,
        transports = excluded.transports,
        device_type = excluded.device_type,
        backed_up = excluded.backed_up,
        updated_at = now(),
        last_used_at = now()
      returning id, admin_login, name, transports, device_type, backed_up, created_at, last_used_at
    `,
    [
      credential.id,
      login,
      deviceName,
      Buffer.from(credential.publicKey),
      Number(credential.counter || 0),
      JSON.stringify(credential.transports || input.response?.response?.transports || []),
      info.credentialDeviceType,
      Boolean(info.credentialBackedUp)
    ]
  );

  return result.rows[0];
}

export async function createAdminPasskeyAuthenticationOptions(loginInput, request) {
  const login = cleanLogin(loginInput);
  if (!login) throw makeError("Введите логин", 400);

  const passkeys = await listAdminPasskeys(login);
  if (!passkeys.length) {
    throw makeError("Для этого аккаунта быстрый вход ещё не подключён. Сначала войдите паролем.", 404);
  }

  const { rpID } = getAdminWebAuthnContext(request);
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: Array.isArray(passkey.transports) ? passkey.transports : undefined
    })),
    userVerification: "required",
    timeout: 60_000
  });

  await saveChallenge(login, "authentication", options.challenge);
  return options;
}

export async function finishAdminPasskeyAuthentication(loginInput, request, input = {}) {
  const login = cleanLogin(loginInput);
  const expectedChallenge = await consumeChallenge(login, "authentication", input.challenge);
  const credentialId = String(input.response?.id || "");
  const result = await pool.query(
    `
      select id, admin_login, public_key, counter, transports
      from admin_passkeys
      where id = $1 and admin_login = $2
      limit 1
    `,
    [credentialId, login]
  );
  const passkey = result.rows[0];
  if (!passkey) throw makeError("Этот ключ входа больше не зарегистрирован", 404);

  const { rpID, origin } = getAdminWebAuthnContext(request);
  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.id,
      publicKey: new Uint8Array(passkey.public_key),
      counter: Number(passkey.counter || 0),
      transports: Array.isArray(passkey.transports) ? passkey.transports : undefined
    },
    requireUserVerification: true
  });

  if (!verification.verified) {
    throw makeError("Face ID или отпечаток не подтверждены", 401);
  }

  await pool.query(
    `
      update admin_passkeys
      set counter = $2, updated_at = now(), last_used_at = now()
      where id = $1
    `,
    [passkey.id, Number(verification.authenticationInfo.newCounter || 0)]
  );

  return { login, credentialId: passkey.id };
}

export async function deleteAdminPasskey(login, credentialId) {
  const result = await pool.query(
    "delete from admin_passkeys where id = $1 and admin_login = $2 returning id",
    [String(credentialId || ""), cleanLogin(login)]
  );
  if (!result.rowCount) throw makeError("Ключ входа не найден", 404);
  return result.rows[0];
}

export async function createAdminSession(account, request) {
  const token = crypto.randomBytes(32).toString("base64url");
  await pool.query(
    `
      insert into admin_sessions (token_hash, admin_login, admin_role, expires_at, user_agent, ip)
      values ($1, $2, $3, now() + ($4::int * interval '1 second'), $5, $6)
    `,
    [
      hashValue(token),
      cleanLogin(account.login),
      account.role,
      ADMIN_SESSION_MAX_AGE_SECONDS,
      request.get("user-agent") || "",
      request.ip || ""
    ]
  );
  return token;
}

export async function getAdminSessionByRequest(request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return null;

  const result = await pool.query(
    `
      select admin_login as login, admin_role as role
      from admin_sessions
      where token_hash = $1 and expires_at > now()
      limit 1
    `,
    [hashValue(token)]
  );
  return result.rows[0] || null;
}

export async function destroyAdminSession(request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return;
  await pool.query("delete from admin_sessions where token_hash = $1", [hashValue(token)]);
}
