import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMaxNewPaidOrderMessage,
  buildMaxOrderStatusMessage
} from "../server/max-notifications.js";

test("MAX new-order notification contains the paid order details and escapes user input", () => {
  const message = buildMaxNewPaidOrderMessage({
    id: "WEB-123",
    mode: "delivery",
    requestedTime: "Сегодня, 19:30",
    total: 2450,
    customerName: "<Анна>",
    customerPhone: "+7 (999) 123-45-67",
    address: "ул. Пирогова, 1Т",
    orderComment: "<b>не звонить</b>",
    createdAt: "2026-07-31T15:00:00.000Z",
    items: [
      {
        name: "Маргарита",
        qty: 2,
        size: "30 см",
        price: 900,
        lineTotal: 1800
      }
    ]
  });

  assert.match(message, /Новый оплаченный заказ #WEB-123/);
  assert.match(message, /2× Маргарита/);
  assert.match(message, /2\s?450 ₽/);
  assert.match(message, /&lt;Анна&gt;/);
  assert.doesNotMatch(message, /<Анна>/);
  assert.match(message, /&lt;b&gt;не звонить&lt;\/b&gt;/);
  assert.ok(message.length <= 4000);
});

test("MAX status notification is concise and includes elapsed time", () => {
  const message = buildMaxOrderStatusMessage({
    id: "WEB-123",
    status: "cooking",
    createdAt: "2026-07-31T15:00:00.000Z",
    updatedAt: "2026-07-31T15:08:00.000Z",
    statusHistory: [
      {
        status: "accepted",
        changedAt: "2026-07-31T15:02:00.000Z",
        changedBy: "admin"
      },
      {
        status: "cooking",
        changedAt: "2026-07-31T15:08:00.000Z",
        changedBy: "admin"
      }
    ]
  });

  assert.match(message, /Заказ <b>#WEB-123<\/b> → <b>Готовится<\/b>/);
  assert.match(message, /Через 8 мин\./);
  assert.ok(message.length < 220);
});

test("MAX does not notify when the same order status is confirmed repeatedly", () => {
  const message = buildMaxOrderStatusMessage({
    id: "WEB-123",
    status: "cooking",
    statusHistory: [
      { status: "cooking", changedAt: "2026-07-31T15:08:00.000Z" },
      { status: "cooking", changedAt: "2026-07-31T15:09:00.000Z" }
    ]
  });

  assert.equal(message, "");
});
