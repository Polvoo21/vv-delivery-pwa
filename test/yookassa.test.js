import assert from "node:assert/strict";
import test from "node:test";
import {
  assertYooKassaPaymentMatchesOrder,
  buildYooKassaPaymentPayload,
  createYooKassaRefund,
  makeMoney
} from "../server/yookassa.js";

const ORIGINAL_ENV = { ...process.env };

test.beforeEach(() => {
  process.env.YOOKASSA_SHOP_ID = "test-shop";
  process.env.YOOKASSA_SECRET_KEY = "test-secret";
  process.env.YOOKASSA_RECEIPT_ENABLED = "0";
  process.env.PUBLIC_SITE_URL = "https://vmestevkusnee.ru";
});

test.after(() => {
  process.env = ORIGINAL_ENV;
});

test("formats payment amounts with two decimal places", () => {
  assert.equal(makeMoney(1495), "1495.00");
  assert.throws(() => makeMoney(0), /Некорректная сумма/);
});

test("builds a redirect payment bound to the internal order", () => {
  const payload = buildYooKassaPaymentPayload({
    id: "WEB-123",
    customerId: "customer_1",
    total: 1495
  });

  assert.deepEqual(payload.amount, { value: "1495.00", currency: "RUB" });
  assert.equal(payload.capture, true);
  assert.equal(payload.metadata.orderId, "WEB-123");
  assert.equal(payload.metadata.customerId, "customer_1");
  assert.equal(
    payload.confirmation.return_url,
    "https://vmestevkusnee.ru/payment?provider=yookassa&orderId=WEB-123"
  );
});

test("builds a masterclass payment with service metadata and return URL", () => {
  const payload = buildYooKassaPaymentPayload({
    paymentEntityType: "masterclass_registration",
    id: "registration-123",
    eventId: "pizza-2026-09-01",
    amount: 1800,
    phone: "+7 999 123-45-67",
    email: "guest@example.ru",
    paymentReturnPath: "/master-klassy/pizza-1-sentyabrya"
  });

  assert.equal(payload.amount.value, "1800.00");
  assert.equal(payload.metadata.entityType, "masterclass_registration");
  assert.equal(payload.metadata.registrationId, "registration-123");
  assert.equal(
    payload.confirmation.return_url,
    "https://vmestevkusnee.ru/master-klassy/pizza-1-sentyabrya?provider=yookassa&payment=return&registrationId=registration-123"
  );
});

test("rejects a provider payment with a mismatched order or amount", () => {
  const order = { id: "WEB-123", total: 1495 };
  assert.doesNotThrow(() =>
    assertYooKassaPaymentMatchesOrder(
      { metadata: { orderId: "WEB-123" }, amount: { value: "1495.00", currency: "RUB" } },
      order
    )
  );
  assert.throws(
    () =>
      assertYooKassaPaymentMatchesOrder(
        { metadata: { orderId: "WEB-999" }, amount: { value: "1495.00", currency: "RUB" } },
        order
      ),
    /не относится/
  );
  assert.throws(
    () =>
      assertYooKassaPaymentMatchesOrder(
        { metadata: { orderId: "WEB-123" }, amount: { value: "1494.00", currency: "RUB" } },
        order
      ),
    /не совпадает/
  );
});

test("refund validation does not exceed the remaining paid amount", async () => {
  await assert.rejects(
    createYooKassaRefund({
      id: "WEB-123",
      paymentId: "payment-123",
      total: 1000,
      refunds: [{ status: "succeeded", amount: { value: "700.00", currency: "RUB" } }]
    }, { amount: 400 }),
    /не больше 300.00/
  );
});

test("receipt configuration accepts current VAT codes through 12", () => {
  process.env.YOOKASSA_RECEIPT_ENABLED = "1";
  process.env.YOOKASSA_VAT_CODE = "12";
  const payload = buildYooKassaPaymentPayload({
    id: "WEB-124",
    total: 1000,
    customerEmail: "guest@example.ru"
  });
  assert.equal(payload.receipt.items[0].vat_code, 12);
});
