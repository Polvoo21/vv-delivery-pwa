import { createHash, randomUUID } from "node:crypto";

const DEFAULT_API_BASE = "https://api.yookassa.ru/v3";

function cleanString(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function makeError(message, statusCode = 500, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

export function makeMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw makeError("Некорректная сумма для оплаты", 400);
  }

  return amount.toFixed(2);
}

function getRequestBaseUrl(request) {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const protocol = (request?.get?.("x-forwarded-proto") || request?.protocol || "http")
    .split(",")[0]
    .trim();
  const host = (request?.get?.("x-forwarded-host") || request?.get?.("host") || "localhost:3000")
    .split(",")[0]
    .trim();
  return `${protocol}://${host}`;
}

function getConfig({ required = true } = {}) {
  const shopId = cleanString(process.env.YOOKASSA_SHOP_ID);
  const secretKey = cleanString(process.env.YOOKASSA_SECRET_KEY);
  const apiBase = cleanString(process.env.YOOKASSA_API_BASE, DEFAULT_API_BASE).replace(/\/$/, "");
  const mode = cleanString(process.env.YOOKASSA_MODE, "test").toLowerCase() === "production" ? "production" : "test";

  if (required && (!shopId || !secretKey)) {
    throw makeError("ЮKassa еще не подключена: нужны YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY", 503);
  }

  return {
    apiBase,
    mode,
    shopId,
    secretKey,
    receiptEnabled: process.env.YOOKASSA_RECEIPT_ENABLED === "1",
    savePaymentMethodEnabled: process.env.YOOKASSA_SAVE_PAYMENT_METHOD_ENABLED === "1",
    vatCode: Number(process.env.YOOKASSA_VAT_CODE || 0)
  };
}

function getPaymentDescriptor(subject = {}) {
  const entityType = cleanString(subject.paymentEntityType, "order");
  const id = cleanString(subject.id);
  if (!id) throw makeError("У объекта оплаты нет идентификатора", 400);

  if (entityType === "masterclass_registration") {
    const eventId = cleanString(subject.eventId);
    return {
      entityType,
      id,
      amount: subject.amount,
      customerEmail: subject.email,
      customerPhone: subject.phone,
      description: cleanString(subject.paymentDescription, `Мастер-класс, запись ${id}`),
      receiptDescription: cleanString(subject.receiptDescription, "Участие в кулинарном мастер-классе"),
      paymentSubject: "service",
      returnPath: cleanString(subject.paymentReturnPath, "/master-klassy"),
      returnParams: {
        provider: "yookassa",
        payment: "return",
        registrationId: id
      },
      metadata: {
        service: "vmeste-vkusnee",
        entityType,
        registrationId: id,
        eventId
      }
    };
  }

  return {
    entityType: "order",
    id,
    amount: subject.total,
    customerEmail: subject.customerEmail,
    customerPhone: subject.customerPhone,
    description: `Заказ ${id} в пиццерии «Вместе Вкуснее»`,
    receiptDescription: `Заказ ${id}`,
    paymentSubject: "commodity",
    returnPath: "/payment",
    returnParams: {
      provider: "yookassa",
      orderId: id
    },
    metadata: {
      service: "vmeste-vkusnee",
      entityType: "order",
      orderId: id,
      customerId: cleanString(subject.customerId)
    }
  };
}

export function isYooKassaConfigured() {
  const config = getConfig({ required: false });
  return Boolean(config.shopId && config.secretKey);
}

export function getYooKassaPublicConfig() {
  const config = getConfig({ required: false });
  return {
    configured: Boolean(config.shopId && config.secretKey),
    mode: config.mode,
    receiptEnabled: config.receiptEnabled,
    savePaymentMethodEnabled: config.savePaymentMethodEnabled
  };
}

function makeIdempotenceKey(action, orderId, suffix = "") {
  return createHash("sha256")
    .update(["vmeste-vkusnee", action, orderId, suffix].filter(Boolean).join(":"))
    .digest("hex");
}

function makeReceipt(subject, descriptor, config) {
  if (!config.receiptEnabled) return undefined;
  if (!Number.isInteger(config.vatCode) || config.vatCode < 1 || config.vatCode > 12) {
    throw makeError("Для чеков ЮKassa задайте YOOKASSA_VAT_CODE от 1 до 12", 500);
  }

  const email = cleanString(descriptor.customerEmail).toLowerCase();
  const phone = cleanString(descriptor.customerPhone).replace(/\D/g, "");
  if (!email && !phone) {
    throw makeError("Для электронного чека нужен email или телефон покупателя", 400);
  }

  return {
    customer: {
      email: email || undefined,
      phone: email ? undefined : phone || undefined
    },
    items: [
      {
        description: descriptor.receiptDescription.slice(0, 128),
        quantity: "1.00",
        amount: {
          value: makeMoney(descriptor.amount),
          currency: "RUB"
        },
        vat_code: config.vatCode,
        payment_mode: "full_payment",
        payment_subject: descriptor.paymentSubject
      }
    ]
  };
}

export function buildYooKassaPaymentPayload(subject, { request } = {}) {
  const config = getConfig();
  const descriptor = getPaymentDescriptor(subject);

  const returnUrl = new URL(descriptor.returnPath, getRequestBaseUrl(request));
  Object.entries(descriptor.returnParams).forEach(([key, value]) => {
    if (value) returnUrl.searchParams.set(key, value);
  });

  return {
    amount: {
      value: makeMoney(descriptor.amount),
      currency: "RUB"
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: returnUrl.toString()
    },
    description: descriptor.description.slice(0, 128),
    metadata: descriptor.metadata,
    receipt: makeReceipt(subject, descriptor, config),
    save_payment_method:
      descriptor.entityType === "order" &&
      config.savePaymentMethodEnabled &&
      Boolean(subject.paymentCardSaveRequested)
        ? true
        : undefined
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 1000) };
  }
}

async function requestYooKassa(path, { method = "GET", body, idempotenceKey, fetchImpl = fetch } = {}) {
  const config = getConfig();
  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${config.shopId}:${config.secretKey}`).toString("base64")}`
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotenceKey) headers["Idempotence-Key"] = idempotenceKey;

  let response;
  try {
    response = await fetchImpl(`${config.apiBase}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
  } catch (networkError) {
    throw makeError("ЮKassa временно недоступна. Попробуйте еще раз.", 502, {
      reason: networkError.message || String(networkError)
    });
  }

  const data = await readJson(response);
  if (!response.ok) {
    throw makeError(data.description || data.message || "ЮKassa отклонила запрос", 502, {
      httpStatus: response.status,
      providerCode: data.code || "",
      providerId: data.id || ""
    });
  }

  return data;
}

export async function createYooKassaPayment(subject, { request, fetchImpl = fetch } = {}) {
  const descriptor = getPaymentDescriptor(subject);
  const payload = buildYooKassaPaymentPayload(subject, { request });
  const payment = await requestYooKassa("/payments", {
    method: "POST",
    body: payload,
    idempotenceKey: makeIdempotenceKey(
      `create-${descriptor.entityType}`,
      descriptor.id,
      String(subject.paymentAttempt || 1)
    ),
    fetchImpl
  });

  const confirmationUrl = cleanString(payment.confirmation?.confirmation_url);
  if (!payment.id || !confirmationUrl) {
    throw makeError("ЮKassa вернула ответ без ссылки оплаты", 502, {
      providerId: payment.id || ""
    });
  }

  return {
    id: payment.id,
    status: payment.status || "pending",
    paid: Boolean(payment.paid),
    amount: payment.amount,
    confirmationUrl,
    test: Boolean(payment.test),
    createdAt: payment.created_at || null,
    metadata: payment.metadata || {}
  };
}

export async function getYooKassaPayment(paymentId, { fetchImpl = fetch } = {}) {
  const safeId = encodeURIComponent(cleanString(paymentId));
  if (!safeId) throw makeError("Не указан идентификатор платежа", 400);
  return requestYooKassa(`/payments/${safeId}`, { fetchImpl });
}

export async function getYooKassaRefund(refundId, { fetchImpl = fetch } = {}) {
  const safeId = encodeURIComponent(cleanString(refundId));
  if (!safeId) throw makeError("Не указан идентификатор возврата", 400);
  return requestYooKassa(`/refunds/${safeId}`, { fetchImpl });
}

export function assertYooKassaPaymentMatchesOrder(payment, order) {
  const descriptor = getPaymentDescriptor(order);
  const paymentEntityType = cleanString(payment?.metadata?.entityType, "order");
  const paymentReferenceId = descriptor.entityType === "masterclass_registration"
    ? cleanString(payment?.metadata?.registrationId)
    : cleanString(payment?.metadata?.orderId);
  if (paymentEntityType !== descriptor.entityType || paymentReferenceId !== descriptor.id) {
    throw makeError("Платеж ЮKassa не относится к этому заказу", 409);
  }

  if (makeMoney(payment?.amount?.value) !== makeMoney(descriptor.amount)) {
    throw makeError("Сумма платежа ЮKassa не совпадает с суммой заказа", 409);
  }

  if (cleanString(payment?.amount?.currency) !== "RUB") {
    throw makeError("ЮKassa вернула платеж в неподдерживаемой валюте", 409);
  }
}

export async function getYooKassaShopInfo({ fetchImpl = fetch } = {}) {
  return requestYooKassa("/me", { fetchImpl });
}

export async function createYooKassaRefund(order, { amount, reason = "", fetchImpl = fetch } = {}) {
  const paymentId = cleanString(order?.paymentId);
  if (!paymentId) throw makeError("У заказа нет платежа ЮKassa", 409);

  const refundAmount = makeMoney(amount ?? order.total);
  const previousRefunds = Array.isArray(order?.refunds) ? order.refunds : [];
  const alreadyRefunded = previousRefunds
    .filter((refund) => ["pending", "succeeded"].includes(cleanString(refund?.status)))
    .reduce((sum, refund) => sum + Number(refund?.amount?.value || 0), 0);
  const remainingAmount = Math.max(0, Number(order.total || 0) - alreadyRefunded);
  if (Number(refundAmount) > remainingAmount) {
    throw makeError(`Можно вернуть не больше ${remainingAmount.toFixed(2)} ₽`, 409);
  }

  const config = getConfig();
  const isPartialRefund = Number(refundAmount) < Number(order.total || 0);
  const descriptor = getPaymentDescriptor(order);
  const refund = await requestYooKassa("/refunds", {
    method: "POST",
    body: {
      payment_id: paymentId,
      amount: {
        value: refundAmount,
        currency: "RUB"
      },
      description: cleanString(reason, `Возврат по заказу ${order.id}`).slice(0, 128),
      receipt: config.receiptEnabled && isPartialRefund
        ? {
            customer: makeReceipt(order, descriptor, config).customer,
            items: [
              {
                description: descriptor.receiptDescription.slice(0, 128),
                quantity: "1.00",
                amount: { value: refundAmount, currency: "RUB" },
                vat_code: config.vatCode,
                payment_mode: "full_payment",
                payment_subject: descriptor.paymentSubject
              }
            ]
          }
        : undefined
    },
    idempotenceKey: makeIdempotenceKey("refund", order.id, `${refundAmount}:${previousRefunds.length + 1}`),
    fetchImpl
  });

  return {
    id: refund.id || randomUUID(),
    status: refund.status || "pending",
    amount: refund.amount || { value: refundAmount, currency: "RUB" },
    createdAt: refund.created_at || null
  };
}
