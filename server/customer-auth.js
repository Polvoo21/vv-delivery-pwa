import crypto from "node:crypto";
import { pool } from "./db.js";
import {
  getEmailDeliveryPublicConfig,
  isEmailDeliveryConfigured,
  sendEmailVerificationCode
} from "./email-service.js";

const SESSION_COOKIE = "vv_customer_session";
const OAUTH_STATE_COOKIE = "vv_oauth_state";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const IDENTITY_LINK_TTL_MINUTES = 15;
const EMAIL_CODE_TTL_MINUTES = 10;
const EMAIL_CODE_MIN_INTERVAL_SECONDS = 60;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
const EMAIL_CODE_MAX_SENDS_PER_HOUR = 5;
const TELEGRAM_OIDC_ISSUER = "https://oauth.telegram.org";
const TELEGRAM_OIDC_AUTH_URL = `${TELEGRAM_OIDC_ISSUER}/auth`;
const TELEGRAM_OIDC_TOKEN_URL = `${TELEGRAM_OIDC_ISSUER}/token`;
const TELEGRAM_OIDC_JWKS_URL = `${TELEGRAM_OIDC_ISSUER}/.well-known/jwks.json`;
const YANDEX_OAUTH_SCOPE = ["login:email", "login:info", "login:default_phone"].join(" ");
let telegramJwksCache = { expiresAt: 0, keys: [] };

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hmacValue(value) {
  return crypto.createHmac("sha256", getAuthSecret()).update(String(value)).digest("base64url");
}

function getAuthSecret() {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw makeError("Для OAuth нужно задать CUSTOMER_AUTH_SECRET", 500);
  }

  return "vv-local-customer-auth-secret";
}

function makeError(message, statusCode = 500, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function normalizeCustomerEmail(input) {
  const email = String(input || "").trim().toLowerCase().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function makeNumericCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function safeHashEquals(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function normalizeCustomerPhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  return "";
}

function publicCustomer(row) {
  if (!row) return null;

  const verifiedPhone = row.phone || "";
  const contactPhone = row.contact_phone || verifiedPhone;
  const children = Array.isArray(row.children) ? row.children : [];
  const hasMarketingConsent = Boolean(row.marketing_consent);
  const storedMarketing =
    row.marketing_channels && typeof row.marketing_channels === "object" ? row.marketing_channels : {};
  const onboardingStep = row.onboarding_completed_at
    ? "complete"
    : !row.contact_phone_configured_at
      ? "contact"
      : row.has_children === null || row.has_children === undefined
        ? "children"
        : "email";

  return {
    id: row.id,
    name: row.name || "",
    phone: contactPhone,
    verifiedPhone,
    contactPhone,
    email: row.email || "",
    emailVerified: Boolean(row.email_verified),
    hasChildren: row.has_children,
    children,
    phoneVerified: Boolean(row.phone_verified),
    receiptsConsent: Boolean(row.receipts_consent || row.email),
    marketingConsent: hasMarketingConsent,
    marketing: {
      email: hasMarketingConsent && Boolean(storedMarketing.email ?? row.email),
      push: hasMarketingConsent && Boolean(storedMarketing.push ?? true),
      sms: hasMarketingConsent && Boolean(storedMarketing.sms ?? false)
    },
    requiresContactPhoneSetup: !row.contact_phone_configured_at,
    requiresOnboarding: !row.onboarding_completed_at,
    onboardingStep
  };
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

function buildCookie(name, value, request, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (isSecureRequest(request)) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function buildRequestOrigin(request) {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const forwardedProto = (request.get("x-forwarded-proto") || "").split(",")[0]?.trim();
  const forwardedHost = (request.get("x-forwarded-host") || "").split(",")[0]?.trim();
  const protocol = forwardedProto || request.protocol || "http";
  const host = forwardedHost || request.get("host");

  return `${protocol}://${host}`.replace(/\/$/, "");
}

function normalizeOAuthProvider(provider) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (normalizedProvider === "yandex") return "yandex";
  if (normalizedProvider === "vk" || normalizedProvider === "vkontakte") return "vk";
  if (normalizedProvider === "telegram" || normalizedProvider === "tg") return "telegram";
  throw makeError("Неизвестный провайдер авторизации", 400);
}

function safeReturnTo(value) {
  const returnTo = String(value || "").trim();
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return process.env.OAUTH_SUCCESS_PATH || "/";
  }

  return returnTo;
}

function safeLinkChallengeId(value) {
  const id = String(value || "").trim();
  return /^link_[a-f0-9]{32}$/i.test(id) ? id : "";
}

function addLinkChallengeToReturnTo(returnTo, challengeId) {
  const url = new URL(safeReturnTo(returnTo), "https://vmestevkusnee.local");
  url.searchParams.set("authLink", challengeId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function signJsonPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${hmacValue(encoded)}`;
}

function verifyJsonPayload(value) {
  const [encoded, signature] = String(value || "").split(".");
  if (!encoded || !signature) {
    throw makeError("Сессия авторизации устарела. Попробуйте войти ещё раз.", 400);
  }

  const expected = hmacValue(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw makeError("Не удалось проверить OAuth state", 400);
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch (_error) {
    throw makeError("Не удалось прочитать OAuth state", 400);
  }
}

function setOAuthStateCookie(response, request, payload) {
  appendSetCookie(
    response,
    buildCookie(
      OAUTH_STATE_COOKIE,
      signJsonPayload({
        ...payload,
        exp: Date.now() + OAUTH_STATE_MAX_AGE_SECONDS * 1000
      }),
      request,
      OAUTH_STATE_MAX_AGE_SECONDS
    )
  );
}

export function clearOAuthStateCookie(response, request) {
  appendSetCookie(response, buildCookie(OAUTH_STATE_COOKIE, "", request, 0));
}

function getOAuthState(request) {
  const payload = verifyJsonPayload(readCookie(request, OAUTH_STATE_COOKIE));
  if (!payload.exp || Number(payload.exp) < Date.now()) {
    throw makeError("Сессия авторизации устарела. Попробуйте войти ещё раз.", 400);
  }

  return payload;
}

function makeCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function makeCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function setCustomerSessionCookie(response, request, token) {
  appendSetCookie(response, buildCookie(SESSION_COOKIE, token, request));
}

export function clearCustomerSessionCookie(response, request) {
  appendSetCookie(response, buildCookie(SESSION_COOKIE, "", request, 0));
}

export async function getCustomerByRequest(request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const result = await pool.query(
    `
      select c.*
      from customer_sessions s
      join customers c on c.id = s.customer_id
      where s.token_hash = $1 and s.expires_at > now()
      limit 1
    `,
    [hashValue(token)]
  );

  return publicCustomer(result.rows[0]);
}

export async function setCustomerContactPhone(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) {
    throw makeError("Сначала войдите в аккаунт", 401);
  }

  const useVerifiedPhone = Boolean(input.useVerifiedPhone);
  const contactPhone = useVerifiedPhone
    ? normalizeCustomerPhone(customer.verifiedPhone)
    : normalizeCustomerPhone(input.phone);

  if (!contactPhone) {
    throw makeError("Укажите корректный номер телефона", 400);
  }

  if (useVerifiedPhone && (!customer.phoneVerified || !customer.verifiedPhone)) {
    throw makeError("Сервис входа не передал подтверждённый номер", 400);
  }

  const result = await pool.query(
    `
      update customers
      set contact_phone = $2,
          contact_phone_configured_at = now(),
          updated_at = now()
      where id = $1
      returning *
    `,
    [customer.id, contactPhone]
  );

  return publicCustomer(result.rows[0]);
}

function normalizeChildBirthDate(input) {
  const value = String(input || "").trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return "";
  }

  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const monthDelta = today.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < day)) age -= 1;
  return age >= 0 && age <= 18 ? value : "";
}

export async function setCustomerChildren(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) {
    throw makeError("Сначала войдите в аккаунт", 401);
  }
  if (customer.onboardingStep === "contact") {
    throw makeError("Сначала сохраните контактный номер", 409);
  }
  if (typeof input.hasChildren !== "boolean") {
    throw makeError("Укажите, есть ли у вас дети", 400);
  }

  let children = [];
  if (input.hasChildren) {
    const name = String(input.child?.name || "").trim().slice(0, 80);
    const birthDate = normalizeChildBirthDate(input.child?.birthDate);
    if (!name) throw makeError("Укажите имя ребёнка", 400);
    if (!birthDate) throw makeError("Укажите корректную дату рождения ребёнка до 18 лет", 400);
    if (input.child?.personalDataConsent !== true) {
      throw makeError("Подтвердите согласие на сохранение данных ребёнка", 400);
    }

    children = [
      {
        id: makeId("child"),
        name,
        birthDate,
        consentAt: new Date().toISOString()
      }
    ];
  }

  const result = await pool.query(
    `
      update customers
      set has_children = $2,
          children = $3::jsonb,
          updated_at = now()
      where id = $1
      returning *
    `,
    [customer.id, input.hasChildren, JSON.stringify(children)]
  );
  return publicCustomer(result.rows[0]);
}

export async function setCustomerOnboardingEmail(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) {
    throw makeError("Сначала войдите в аккаунт", 401);
  }
  if (customer.onboardingStep === "contact" || customer.onboardingStep === "children") {
    throw makeError("Сначала завершите предыдущий шаг", 409);
  }

  if (input.skip) {
    throw makeError("Email нужен для электронных чеков. Укажите и подтвердите адрес", 400);
  }

  const email = normalizeCustomerEmail(input.email);
  const marketingConsent = Boolean(input.marketingConsent);
  if (!email) {
    throw makeError("Укажите корректный email", 400);
  }

  if (getEmailDeliveryPublicConfig().required) {
    throw makeError("Сначала подтвердите email кодом из письма", 409, {
      verificationRequired: true
    });
  }

  const result = await pool.query(
    `
      update customers
      set email = $2,
          email_verified = false,
          email_configured_at = now(),
          receipts_consent = true,
          marketing_consent = marketing_consent or $3,
          marketing_channels = case
            when marketing_consent or $3 then jsonb_set(marketing_channels, '{email}', 'true'::jsonb, true)
            else marketing_channels
          end,
          marketing_consent_at = case
            when $3 and not marketing_consent then now()
            else marketing_consent_at
          end,
          onboarding_completed_at = now(),
          updated_at = now()
      where id = $1
      returning *
    `,
    [customer.id, email, marketingConsent]
  );
  return publicCustomer(result.rows[0]);
}

export function getCustomerEmailVerificationConfig() {
  return getEmailDeliveryPublicConfig();
}

export async function startCustomerEmailVerification(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) throw makeError("Сначала войдите в аккаунт", 401);
  if (customer.onboardingStep === "contact" || customer.onboardingStep === "children") {
    throw makeError("Сначала завершите предыдущий шаг", 409);
  }
  if (!isEmailDeliveryConfigured()) {
    throw makeError("Отправка кодов на email еще не настроена", 503);
  }

  const email = normalizeCustomerEmail(input.email);
  if (!email) throw makeError("Укажите корректный email", 400);

  const recent = await pool.query(
    `
      select
        count(*) filter (where created_at > now() - interval '1 hour')::int as hourly_count,
        max(created_at) as last_created_at
      from customer_email_challenges
      where customer_id = $1
    `,
    [customer.id]
  );
  const hourlyCount = Number(recent.rows[0]?.hourly_count || 0);
  const lastCreatedAt = recent.rows[0]?.last_created_at ? new Date(recent.rows[0].last_created_at).getTime() : 0;
  const retryAfterSeconds = Math.max(
    0,
    EMAIL_CODE_MIN_INTERVAL_SECONDS - Math.floor((Date.now() - lastCreatedAt) / 1000)
  );
  if (retryAfterSeconds > 0) {
    throw makeError(`Новый код можно запросить через ${retryAfterSeconds} сек.`, 429, { retryAfterSeconds });
  }
  if (hourlyCount >= EMAIL_CODE_MAX_SENDS_PER_HOUR) {
    throw makeError("Слишком много писем. Попробуйте через час", 429, { retryAfterSeconds: 3600 });
  }

  const challengeId = makeId("email");
  const code = makeNumericCode();
  const codeHash = hmacValue(`${challengeId}:${email}:${code}`);
  const marketingConsent = Boolean(input.marketingConsent);

  await pool.query(
    `
      update customer_email_challenges
      set status = 'replaced', updated_at = now()
      where customer_id = $1 and status = 'pending'
    `,
    [customer.id]
  );
  await pool.query(
    `
      insert into customer_email_challenges
        (id, customer_id, email, code_hash, marketing_consent, ip, expires_at)
      values
        ($1, $2, $3, $4, $5, $6, now() + ($7::int * interval '1 minute'))
    `,
    [challengeId, customer.id, email, codeHash, marketingConsent, request.ip || "", EMAIL_CODE_TTL_MINUTES]
  );

  try {
    await sendEmailVerificationCode({ email, code });
  } catch (error) {
    await pool.query(
      "update customer_email_challenges set status = 'send_failed', updated_at = now() where id = $1",
      [challengeId]
    );
    console.error("Email verification delivery failed", error);
    throw makeError("Не удалось отправить письмо. Проверьте адрес и попробуйте позже", 502);
  }

  return {
    challengeId,
    email,
    expiresInSeconds: EMAIL_CODE_TTL_MINUTES * 60,
    retryAfterSeconds: EMAIL_CODE_MIN_INTERVAL_SECONDS
  };
}

export async function verifyCustomerEmail(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) throw makeError("Сначала войдите в аккаунт", 401);

  const challengeId = String(input.challengeId || "").trim();
  const code = String(input.code || "").replace(/\D/g, "").slice(0, 6);
  if (!/^email_[a-f0-9]{32}$/i.test(challengeId) || code.length !== 6) {
    throw makeError("Введите шестизначный код из письма", 400);
  }

  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("begin");
    transactionOpen = true;
    const challengeResult = await client.query(
      `
        select *
        from customer_email_challenges
        where id = $1 and customer_id = $2
        for update
      `,
      [challengeId, customer.id]
    );
    const challenge = challengeResult.rows[0];
    if (!challenge || challenge.status !== "pending") {
      throw makeError("Этот код уже недействителен. Запросите новый", 409);
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      await client.query(
        "update customer_email_challenges set status = 'expired', updated_at = now() where id = $1",
        [challengeId]
      );
      await client.query("commit");
      transactionOpen = false;
      throw makeError("Срок действия кода истек. Запросите новый", 410);
    }
    if (Number(challenge.attempts || 0) >= EMAIL_CODE_MAX_ATTEMPTS) {
      throw makeError("Превышено число попыток. Запросите новый код", 429);
    }

    const expectedHash = hmacValue(`${challengeId}:${challenge.email}:${code}`);
    if (!safeHashEquals(challenge.code_hash, expectedHash)) {
      const attempts = Number(challenge.attempts || 0) + 1;
      await client.query(
        `
          update customer_email_challenges
          set attempts = $2,
              status = case when $2 >= $3 then 'attempts_exceeded' else status end,
              updated_at = now()
          where id = $1
        `,
        [challengeId, attempts, EMAIL_CODE_MAX_ATTEMPTS]
      );
      await client.query("commit");
      transactionOpen = false;
      throw makeError(
        attempts >= EMAIL_CODE_MAX_ATTEMPTS
          ? "Превышено число попыток. Запросите новый код"
          : "Код не подходит. Проверьте письмо и попробуйте еще раз",
        attempts >= EMAIL_CODE_MAX_ATTEMPTS ? 429 : 400,
        { attemptsLeft: Math.max(0, EMAIL_CODE_MAX_ATTEMPTS - attempts) }
      );
    }

    await client.query(
      `
        update customer_email_challenges
        set status = 'verified', verified_at = now(), updated_at = now()
        where id = $1
      `,
      [challengeId]
    );
    const customerResult = await client.query(
      `
        update customers
        set email = $2,
            email_verified = true,
            email_configured_at = now(),
            receipts_consent = true,
            marketing_consent = marketing_consent or $3,
            marketing_channels = case
              when marketing_consent or $3 then jsonb_set(marketing_channels, '{email}', 'true'::jsonb, true)
              else marketing_channels
            end,
            marketing_consent_at = case
              when $3 and not marketing_consent then now()
              else marketing_consent_at
            end,
            onboarding_completed_at = now(),
            updated_at = now()
        where id = $1
        returning *
      `,
      [customer.id, challenge.email, Boolean(challenge.marketing_consent)]
    );
    await client.query("commit");
    transactionOpen = false;
    return publicCustomer(customerResult.rows[0]);
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("rollback");
      } catch (_rollbackError) {
        // Preserve the original verification error.
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function setCustomerPreferences(request, input = {}) {
  const customer = await getCustomerByRequest(request);
  if (!customer?.id) {
    throw makeError("Сначала войдите в аккаунт", 401);
  }

  const email = String(input.email || "").trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw makeError("Укажите корректный email", 400);
  }

  const marketingConsent = Boolean(input.marketingConsent);
  const marketing = {
    email: marketingConsent && Boolean(input.marketing?.email),
    push: marketingConsent && Boolean(input.marketing?.push),
    sms: marketingConsent && Boolean(input.marketing?.sms)
  };

  const result = await pool.query(
    `
      update customers
      set email = $2,
          email_verified = case when lower(coalesce(email, '')) = $2 then email_verified else false end,
          email_configured_at = now(),
          receipts_consent = $3,
          marketing_consent = $4,
          marketing_channels = $5::jsonb,
          marketing_consent_at = case
            when $4 and not marketing_consent then now()
            else marketing_consent_at
          end,
          marketing_consent_withdrawn_at = case
            when not $4 and marketing_consent then now()
            else marketing_consent_withdrawn_at
          end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [customer.id, email, Boolean(input.receiptsConsent), marketingConsent, JSON.stringify(marketing)]
  );

  return publicCustomer(result.rows[0]);
}

async function parseProviderJson(response, providerName, actionName) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    throw makeError(`${providerName}: неожиданный ответ при ${actionName}`, 502);
  }

  if (!response.ok || data.error) {
    const providerError = typeof data.error === "object" && data.error !== null ? data.error : {};
    const message =
      data.error_description ||
      data.error_message ||
      providerError.error_description ||
      providerError.message ||
      providerError.error_msg ||
      data.error ||
      `${providerName}: не удалось выполнить ${actionName}`;
    throw makeError(String(message), response.ok ? 400 : 502, {
      provider: providerName,
      action: actionName
    });
  }

  return data;
}

async function postFormJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers
    },
    body
  });

  return response;
}

function decodeJwtPart(value, label) {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
  } catch (_error) {
    throw makeError(`Telegram не вернул корректный ${label}`, 502);
  }
}

async function getTelegramJwks() {
  if (telegramJwksCache.expiresAt > Date.now() && telegramJwksCache.keys.length) {
    return telegramJwksCache.keys;
  }

  const response = await fetch(TELEGRAM_OIDC_JWKS_URL, {
    headers: { Accept: "application/json" }
  });
  const data = await parseProviderJson(response, "Telegram", "получении ключей подписи");
  const keys = Array.isArray(data.keys) ? data.keys : [];

  if (!keys.length) {
    throw makeError("Telegram не вернул ключи проверки подписи", 502);
  }

  telegramJwksCache = {
    expiresAt: Date.now() + 60 * 60 * 1000,
    keys
  };
  return keys;
}

async function verifyTelegramIdToken(idToken, options = {}) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) {
    throw makeError("Telegram не вернул корректный ID token", 502);
  }

  const header = decodeJwtPart(parts[0], "заголовок ID token");
  const claims = decodeJwtPart(parts[1], "ID token");

  if (header.alg !== "RS256" || !header.kid) {
    throw makeError("Telegram использовал неподдерживаемую подпись", 502);
  }

  let keys = await getTelegramJwks();
  let jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) {
    telegramJwksCache = { expiresAt: 0, keys: [] };
    keys = await getTelegramJwks();
    jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  }
  if (!jwk) {
    throw makeError("Не найден ключ подписи Telegram", 502);
  }

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], "base64url");
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signatureValid = crypto.verify("RSA-SHA256", signingInput, publicKey, signature);

  if (!signatureValid) {
    throw makeError("Не удалось проверить подпись Telegram", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud.map(String) : [String(claims.aud || "")];
  if (claims.iss !== TELEGRAM_OIDC_ISSUER || !audiences.includes(String(options.clientId || ""))) {
    throw makeError("Telegram ID token выпущен для другого приложения", 401);
  }
  if (!claims.exp || Number(claims.exp) <= now - 30 || Number(claims.iat || now) > now + 60) {
    throw makeError("Telegram ID token устарел", 401);
  }
  if (claims.nbf && Number(claims.nbf) > now + 30) {
    throw makeError("Telegram ID token пока недействителен", 401);
  }
  if (!options.nonce || claims.nonce !== options.nonce) {
    throw makeError("Не удалось проверить Telegram nonce", 401);
  }

  return claims;
}

async function fetchTelegramProfile(code, redirectUri, codeVerifier, nonce) {
  const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID;
  const clientSecret = process.env.TELEGRAM_OIDC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw makeError("Для входа через Telegram нужны TELEGRAM_OIDC_CLIENT_ID и TELEGRAM_OIDC_CLIENT_SECRET", 501);
  }
  if (!codeVerifier || !nonce) {
    throw makeError("Сессия входа через Telegram устарела. Попробуйте ещё раз.", 400);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });
  const token = await parseProviderJson(
    await postFormJson(TELEGRAM_OIDC_TOKEN_URL, tokenBody, {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    }),
    "Telegram",
    "обмене кода"
  );

  if (!token.id_token) {
    throw makeError("Telegram не вернул ID token", 502);
  }

  const claims = await verifyTelegramIdToken(token.id_token, { clientId, nonce });
  const phone = normalizeCustomerPhone(claims.phone_number || "");
  const phoneVerified = Boolean(phone && (claims.phone_number_verified === true || claims.phone_number_verified === "true"));

  if (!phoneVerified) {
    throw makeError(
      "Для входа разрешите Telegram передать подтверждённый номер телефона.",
      400
    );
  }

  const name =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
    claims.preferred_username ||
    "";

  return {
    provider: "telegram",
    providerUserId: String(claims.sub || ""),
    name,
    email: "",
    phone,
    phoneVerified,
    rawProfile: {
      sub: claims.sub || null,
      name: claims.name || null,
      given_name: claims.given_name || null,
      family_name: claims.family_name || null,
      preferred_username: claims.preferred_username || null,
      picture: claims.picture || null,
      phone_number: phone,
      phone_number_verified: phoneVerified
    }
  };
}

async function fetchYandexProfile(code, redirectUri) {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw makeError("Для Яндекс ID нужны YANDEX_CLIENT_ID и YANDEX_CLIENT_SECRET", 501);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code
  });
  const token = await parseProviderJson(
    await postFormJson("https://oauth.yandex.ru/token", tokenBody, {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    }),
    "Яндекс ID",
    "обмене кода"
  );

  if (!token.access_token) {
    throw makeError("Яндекс ID не вернул access_token", 502);
  }

  const profileResponse = await fetch("https://login.yandex.ru/info?format=json", {
    headers: {
      Authorization: `OAuth ${token.access_token}`
    }
  });
  const profile = await parseProviderJson(profileResponse, "Яндекс ID", "получении профиля");
  const name =
    profile.real_name ||
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.login ||
    "";
  const email = profile.default_email || profile.emails?.[0] || profile.email || "";
  const phone = normalizeCustomerPhone(profile.default_phone?.number || profile.phone || "");

  return {
    provider: "yandex",
    providerUserId: String(profile.id || ""),
    name,
    email,
    phone,
    phoneVerified: Boolean(phone),
    rawProfile: profile
  };
}

async function fetchVkProfile(code, redirectUri, codeVerifier, deviceId) {
  const clientId = process.env.VK_ID_CLIENT_ID;
  const clientSecret = process.env.VK_ID_CLIENT_SECRET;

  if (!clientId) {
    throw makeError("Для VK ID нужен VK_ID_CLIENT_ID", 501);
  }
  if (!codeVerifier) {
    throw makeError("Сессия VK ID устарела. Попробуйте войти ещё раз.", 400);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  if (clientSecret) {
    tokenBody.set("client_secret", clientSecret);
  }
  if (deviceId) {
    tokenBody.set("device_id", deviceId);
  }

  const token = await parseProviderJson(
    await postFormJson("https://id.vk.com/oauth2/auth", tokenBody),
    "VK ID",
    "обмене кода"
  );

  if (!token.access_token) {
    throw makeError("VK ID не вернул access_token", 502);
  }

  const profileBody = new URLSearchParams({
    client_id: clientId,
    access_token: token.access_token
  });

  if (clientSecret) {
    profileBody.set("client_secret", clientSecret);
  }

  const profileData = await parseProviderJson(
    await postFormJson("https://id.vk.com/oauth2/user_info", profileBody),
    "VK ID",
    "получении профиля"
  );
  const profile = profileData.user || profileData.response || profileData;
  const providerUserId = String(profile.user_id || profile.id || token.user_id || token.id || token.sub || "");
  const name = profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const email = profile.email || token.email || "";
  const phone = normalizeCustomerPhone(profile.phone || token.phone || "");

  return {
    provider: "vk",
    providerUserId,
    name,
    email,
    phone,
    phoneVerified: Boolean(phone),
    rawProfile: {
      token: {
        user_id: token.user_id || token.id || null,
        scope: token.scope || null,
        expires_in: token.expires_in || null
      },
      profile: profileData
    }
  };
}

async function findIdentityCustomer(client, provider, providerUserId) {
  const result = await client.query(
    `
      select c.*
      from customer_identities i
      join customers c on c.id = i.customer_id
      where i.provider = $1 and i.provider_user_id = $2
      limit 1
    `,
    [provider, providerUserId]
  );
  return result.rows[0] || null;
}

async function listCustomerIdentityProviders(client, customerId) {
  const result = await client.query(
    `
      select distinct provider
      from customer_identities
      where customer_id = $1
      order by provider
    `,
    [customerId]
  );
  return result.rows.map((row) => row.provider);
}

async function canUsePhoneForCustomer(client, phone, customerId) {
  if (!phone) return false;
  const result = await client.query("select id from customers where phone = $1 and id <> $2 limit 1", [
    phone,
    customerId
  ]);
  return !result.rows[0];
}

async function updateCustomerFromIdentity(client, customerId, profile) {
  const name = String(profile.name || "").trim();
  const email = String(profile.email || "").trim();
  const phone = normalizeCustomerPhone(profile.phone);
  const phoneVerified = Boolean(phone && profile.phoneVerified);
  const nextPhone = phoneVerified && (await canUsePhoneForCustomer(client, phone, customerId)) ? phone : "";
  const result = await client.query(
    `
      update customers
      set
        name = case when coalesce(name, '') = '' and $2 <> '' then $2 else name end,
        email = case when coalesce(email, '') = '' and $3 <> '' then $3 else email end,
        phone = case when coalesce(phone, '') = '' and $4 <> '' then $4 else phone end,
        phone_verified = phone_verified or ($4 <> '' and $5),
        marketing_consent = marketing_consent or $6,
        updated_at = now()
      where id = $1
      returning *
    `,
    [customerId, name, email, nextPhone, phoneVerified, Boolean(profile.marketingConsent)]
  );
  return result.rows[0];
}

async function upsertCustomerIdentity(client, customerId, profile) {
  const provider = normalizeOAuthProvider(profile.provider);
  const providerUserId = String(profile.providerUserId || "");
  const email = String(profile.email || "").trim();
  const phone = normalizeCustomerPhone(profile.phone);
  const phoneVerified = Boolean(phone && profile.phoneVerified);
  const result = await client.query(
    `
      insert into customer_identities
        (id, customer_id, provider, provider_user_id, email, phone, phone_verified, raw_profile, last_login_at)
      values
        ($1, $2, $3, $4, nullif($5, ''), nullif($6, ''), $7, $8::jsonb, now())
      on conflict (provider, provider_user_id) do update set
        email = excluded.email,
        phone = excluded.phone,
        phone_verified = excluded.phone_verified,
        raw_profile = excluded.raw_profile,
        last_login_at = now(),
        updated_at = now()
      returning customer_id
    `,
    [
      makeId("identity"),
      customerId,
      provider,
      providerUserId,
      email,
      phone,
      phoneVerified,
      JSON.stringify(profile.rawProfile || {})
    ]
  );

  if (result.rows[0]?.customer_id !== customerId) {
    throw makeError("Этот способ входа уже связан с другим профилем", 409);
  }
}

async function createIdentityLinkChallenge(client, customer, profile) {
  const challengeId = makeId("link");
  const provider = normalizeOAuthProvider(profile.provider);
  const providerUserId = String(profile.providerUserId || "");

  await client.query(
    `
      delete from customer_identity_link_challenges
      where expires_at <= now()
         or (provider = $1 and provider_user_id = $2)
    `,
    [provider, providerUserId]
  );
  await client.query(
    `
      insert into customer_identity_link_challenges
        (id, customer_id, provider, provider_user_id, name, email, phone, phone_verified,
         raw_profile, marketing_consent, expires_at)
      values
        ($1, $2, $3, $4, nullif($5, ''), nullif($6, ''), nullif($7, ''), $8,
         $9::jsonb, $10, now() + ($11::int * interval '1 minute'))
    `,
    [
      challengeId,
      customer.id,
      provider,
      providerUserId,
      String(profile.name || "").trim(),
      String(profile.email || "").trim(),
      normalizeCustomerPhone(profile.phone),
      Boolean(profile.phoneVerified),
      JSON.stringify(profile.rawProfile || {}),
      Boolean(profile.marketingConsent),
      IDENTITY_LINK_TTL_MINUTES
    ]
  );
  return challengeId;
}

async function authenticateOAuthProfile(profile) {
  const provider = normalizeOAuthProvider(profile.provider);
  const providerUserId = String(profile.providerUserId || "");
  const phone = normalizeCustomerPhone(profile.phone);
  const phoneVerified = Boolean(phone && profile.phoneVerified);

  if (!providerUserId) {
    throw makeError("Провайдер не вернул идентификатор пользователя", 502);
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const identityCustomer = await findIdentityCustomer(client, provider, providerUserId);

    if (identityCustomer) {
      const customer = await updateCustomerFromIdentity(client, identityCustomer.id, profile);
      await upsertCustomerIdentity(client, customer.id, profile);
      await client.query("commit");
      return { kind: "authenticated", customer };
    }

    let phoneCustomer = null;
    if (phoneVerified) {
      const byPhone = await client.query(
        "select * from customers where phone = $1 and phone_verified = true limit 1 for update",
        [phone]
      );
      phoneCustomer = byPhone.rows[0] || null;
    }

    if (phoneCustomer) {
      const providers = await listCustomerIdentityProviders(client, phoneCustomer.id);
      if (providers.length) {
        const challengeId = await createIdentityLinkChallenge(client, phoneCustomer, profile);
        await client.query("commit");
        return { kind: "link_required", challengeId };
      }

      const customer = await updateCustomerFromIdentity(client, phoneCustomer.id, profile);
      await upsertCustomerIdentity(client, customer.id, profile);
      await client.query("commit");
      return { kind: "authenticated", customer };
    }

    const customerId = makeId("customer");
    const created = await client.query(
      `
        insert into customers (id, name, phone, email, phone_verified, marketing_consent)
        values ($1, nullif($2, ''), nullif($3, ''), nullif($4, ''), $5, $6)
        returning *
      `,
      [
        customerId,
        String(profile.name || "").trim(),
        phoneVerified ? phone : "",
        String(profile.email || "").trim(),
        phoneVerified,
        Boolean(profile.marketingConsent)
      ]
    );
    await upsertCustomerIdentity(client, customerId, profile);
    await client.query("commit");
    return { kind: "authenticated", customer: created.rows[0] };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function maskPhone(phone) {
  const normalized = normalizeCustomerPhone(phone);
  if (!normalized) return "";
  return `${normalized.slice(0, 2)} ••• •••-${normalized.slice(-2)}`;
}

export async function getIdentityLinkChallenge(challengeId) {
  const id = String(challengeId || "").trim();
  if (!id) throw makeError("Запрос привязки не найден", 404);

  const result = await pool.query(
    `
      select l.*, array_remove(array_agg(distinct i.provider), null) as linked_providers
      from customer_identity_link_challenges l
      left join customer_identities i on i.customer_id = l.customer_id
      where l.id = $1 and l.expires_at > now()
      group by l.id
      limit 1
    `,
    [id]
  );
  const challenge = result.rows[0];
  if (!challenge) throw makeError("Запрос привязки устарел. Начните вход ещё раз.", 404);

  return {
    id: challenge.id,
    newProvider: challenge.provider,
    linkedProviders: Array.isArray(challenge.linked_providers) ? challenge.linked_providers : [],
    phone: maskPhone(challenge.phone),
    expiresAt: challenge.expires_at
  };
}

async function confirmIdentityLink(profile, challengeId) {
  const provider = normalizeOAuthProvider(profile.provider);
  const providerUserId = String(profile.providerUserId || "");
  const client = await pool.connect();

  try {
    await client.query("begin");
    const challengeResult = await client.query(
      `
        select *
        from customer_identity_link_challenges
        where id = $1 and expires_at > now()
        limit 1
        for update
      `,
      [challengeId]
    );
    const challenge = challengeResult.rows[0];
    if (!challenge) {
      throw makeError("Запрос привязки устарел. Начните вход ещё раз.", 404);
    }

    const confirmingCustomer = await findIdentityCustomer(client, provider, providerUserId);
    if (!confirmingCustomer || confirmingCustomer.id !== challenge.customer_id) {
      throw makeError("Подтвердите вход способом, который уже подключён к этому профилю.", 403);
    }

    const pendingProfile = {
      provider: challenge.provider,
      providerUserId: challenge.provider_user_id,
      name: challenge.name || "",
      email: challenge.email || "",
      phone: challenge.phone || "",
      phoneVerified: Boolean(challenge.phone_verified),
      rawProfile: challenge.raw_profile || {},
      marketingConsent: Boolean(challenge.marketing_consent)
    };
    await upsertCustomerIdentity(client, confirmingCustomer.id, pendingProfile);
    await upsertCustomerIdentity(client, confirmingCustomer.id, profile);
    const customer = await updateCustomerFromIdentity(client, confirmingCustomer.id, pendingProfile);
    await client.query("delete from customer_identity_link_challenges where id = $1", [challenge.id]);
    await client.query("commit");
    return customer;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createCustomerSession(customerId, request) {
  const token = crypto.randomBytes(32).toString("base64url");
  await pool.query(
    `
      insert into customer_sessions (token_hash, customer_id, expires_at, user_agent, ip)
      values ($1, $2, now() + ($3::int * interval '1 second'), $4, $5)
    `,
    [
      hashValue(token),
      customerId,
      SESSION_MAX_AGE_SECONDS,
      request.get("user-agent") || "",
      request.ip || ""
    ]
  );

  return token;
}

export async function destroyCustomerSession(request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await pool.query("delete from customer_sessions where token_hash = $1", [hashValue(token)]);
}

export function buildOAuthStartUrl(provider, request, response, options = {}) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const origin = buildRequestOrigin(request);
  const state = crypto.randomBytes(18).toString("base64url");
  const redirectUri = `${origin}/api/auth/${normalizedProvider}/callback`;
  const statePayload = {
    provider: normalizedProvider,
    state,
    redirectUri,
    returnTo: safeReturnTo(options.returnTo),
    marketingConsent: Boolean(options.marketingConsent),
    linkChallengeId: safeLinkChallengeId(options.linkChallengeId)
  };

  if (normalizedProvider === "yandex") {
    const clientId = process.env.YANDEX_CLIENT_ID;
    if (!clientId) {
      throw makeError("Для входа через Яндекс ID нужно задать YANDEX_CLIENT_ID", 501);
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: YANDEX_OAUTH_SCOPE
    });

    if (response) {
      setOAuthStateCookie(response, request, statePayload);
    }

    return `https://oauth.yandex.ru/authorize?${params.toString()}`;
  }

  if (normalizedProvider === "vk") {
    const clientId = process.env.VK_ID_CLIENT_ID;
    if (!clientId) {
      throw makeError("Для входа через VK ID нужно задать VK_ID_CLIENT_ID", 501);
    }

    const codeVerifier = makeCodeVerifier();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "vkid.personal_info email phone",
      state,
      code_challenge: makeCodeChallenge(codeVerifier),
      code_challenge_method: "S256"
    });

    if (response) {
      setOAuthStateCookie(response, request, {
        ...statePayload,
        codeVerifier
      });
    }

    return `https://id.vk.com/authorize?${params.toString()}`;
  }

  if (normalizedProvider === "telegram") {
    const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID;
    if (!clientId) {
      throw makeError("Для входа через Telegram нужно задать TELEGRAM_OIDC_CLIENT_ID", 501);
    }

    const codeVerifier = makeCodeVerifier();
    const nonce = crypto.randomBytes(18).toString("base64url");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid profile phone",
      state,
      nonce,
      code_challenge: makeCodeChallenge(codeVerifier),
      code_challenge_method: "S256"
    });

    if (response) {
      setOAuthStateCookie(response, request, {
        ...statePayload,
        codeVerifier,
        nonce
      });
    }

    return `${TELEGRAM_OIDC_AUTH_URL}?${params.toString()}`;
  }

  throw makeError("Неизвестный провайдер авторизации", 400);
}

export async function completeOAuthLogin(provider, request) {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const code = String(request.query?.code || "");
  const state = String(request.query?.state || "");
  const error = String(request.query?.error || "");
  const errorDescription = String(request.query?.error_description || "");
  const payload = getOAuthState(request);

  if (error) {
    throw makeError(errorDescription || error, 400);
  }

  if (!code) {
    throw makeError("Провайдер не вернул code", 400);
  }

  if (payload.provider !== normalizedProvider || payload.state !== state) {
    throw makeError("Не удалось проверить OAuth state", 400);
  }

  const oauthProfile =
    normalizedProvider === "yandex"
      ? await fetchYandexProfile(code, payload.redirectUri)
      : normalizedProvider === "telegram"
        ? await fetchTelegramProfile(code, payload.redirectUri, payload.codeVerifier, payload.nonce)
        : await fetchVkProfile(
            code,
            payload.redirectUri,
            payload.codeVerifier,
            String(request.query?.device_id || "")
          );
  const profile = {
    ...oauthProfile,
    marketingConsent: Boolean(payload.marketingConsent)
  };
  const customer = payload.linkChallengeId
    ? await confirmIdentityLink(profile, payload.linkChallengeId)
    : await authenticateOAuthProfile(profile);

  if (customer?.kind === "link_required") {
    return {
      linkRequired: true,
      linkChallengeId: customer.challengeId,
      returnTo: addLinkChallengeToReturnTo(payload.returnTo, customer.challengeId)
    };
  }

  const customerRow = customer?.kind === "authenticated" ? customer.customer : customer;
  const token = await createCustomerSession(customerRow.id, request);

  return {
    token,
    customer: publicCustomer(customerRow),
    returnTo: safeReturnTo(payload.returnTo)
  };
}
