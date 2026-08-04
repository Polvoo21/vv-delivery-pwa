import test from "node:test";
import assert from "node:assert/strict";
import {
  applyManagedPromoToOrder,
  getManagedPromoAvailability
} from "../server/promo-codes.js";
import { evaluatePromoCart } from "../shared/promo-rules.js";

const basePromo = {
  code: "LUNCH15",
  percent: 15,
  status: "active",
  validFrom: "2026-07-01",
  validUntil: "2026-07-31",
  dailyStart: "12:00",
  dailyEnd: "14:00"
};

test("managed promo is active inside its Moscow date and time window", () => {
  const availability = getManagedPromoAvailability(
    basePromo,
    new Date("2026-07-24T09:30:00.000Z")
  );

  assert.equal(availability.active, true);
  assert.equal(availability.state, "active");
});

test("managed promo reports a future date window", () => {
  const availability = getManagedPromoAvailability(
    { ...basePromo, validFrom: "2026-08-01", validUntil: "2026-08-31" },
    new Date("2026-07-24T09:30:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "scheduled");
});

test("managed promo reports an expired date window", () => {
  const availability = getManagedPromoAvailability(
    { ...basePromo, validFrom: "2026-06-01", validUntil: "2026-06-30" },
    new Date("2026-07-24T09:30:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "expired");
});

test("managed promo respects its daily Moscow time window", () => {
  const availability = getManagedPromoAvailability(
    basePromo,
    new Date("2026-07-24T12:00:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "outside-hours");
});

test("managed promo can be limited to selected weekdays", () => {
  const availability = getManagedPromoAvailability(
    { ...basePromo, dailyStart: "", dailyEnd: "", weekdays: [1, 2, 3, 4, 5] },
    new Date("2026-07-25T09:30:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "outside-weekdays");
});

test("manager can disable a managed promo regardless of its schedule", () => {
  const availability = getManagedPromoAvailability(
    { ...basePromo, status: "inactive" },
    new Date("2026-07-24T09:30:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "disabled");
});

test("managed promo becomes unavailable when its use limit is exhausted", () => {
  const availability = getManagedPromoAvailability(
    {
      ...basePromo,
      usageLimit: 15,
      usageCount: 14,
      reservedCount: 1
    },
    new Date("2026-07-24T09:30:00.000Z")
  );

  assert.equal(availability.active, false);
  assert.equal(availability.state, "exhausted");
});

test("category promo discounts only matching cart lines", () => {
  const evaluation = evaluatePromoCart(
    {
      percent: 20,
      scopeType: "categories",
      categoryIds: ["pizza"]
    },
    [
      { productId: "pizza-1", category: "pizza", qty: 1, unitPrice: 800 },
      { productId: "drink-1", category: "drinks", qty: 2, unitPrice: 150 }
    ]
  );

  assert.equal(evaluation.eligible, true);
  assert.equal(evaluation.subtotal, 1100);
  assert.equal(evaluation.eligibleSubtotal, 800);
  assert.equal(evaluation.discount, 160);
});

test("optional minimum order and maximum discount are enforced", () => {
  const tooSmall = evaluatePromoCart(
    { percent: 50, minimumOrderAmount: 1000 },
    [{ productId: "pizza-1", qty: 1, unitPrice: 900 }]
  );
  const capped = evaluatePromoCart(
    { percent: 50, minimumOrderAmount: 1000, maximumDiscountAmount: 300 },
    [{ productId: "pizza-1", qty: 1, unitPrice: 1200 }]
  );

  assert.equal(tooSmall.eligible, false);
  assert.equal(tooSmall.state, "minimum-order");
  assert.equal(capped.eligible, true);
  assert.equal(capped.discount, 300);
});

test("server recalculates a managed promo order from eligible lines", () => {
  const order = applyManagedPromoToOrder(
    {
      id: "ORDER-1",
      items: [
        { productId: "pizza-1", categoryId: "pizza", qty: 1, price: 800 },
        { productId: "drink-1", categoryId: "drinks", qty: 1, price: 200 }
      ],
      subtotal: 1,
      discountAmount: 999,
      total: 1
    },
    {
      id: "promo-1",
      type: "managed",
      code: "PIZZA20",
      label: "-20% по промокоду PIZZA20",
      percent: 20,
      status: "active",
      scopeType: "categories",
      categoryIds: ["pizza"],
      productIds: [],
      usageCount: 0,
      reservedCount: 0
    },
    { now: new Date("2026-07-24T09:30:00.000Z") }
  );

  assert.equal(order.subtotal, 1000);
  assert.equal(order.discountAmount, 160);
  assert.equal(order.total, 840);
  assert.equal(order.managedPromoId, "promo-1");
});
