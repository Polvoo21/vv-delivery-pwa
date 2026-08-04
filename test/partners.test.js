import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPartnerPayoutWithinBalance,
  hashPartnerPassword,
  normalizePartnerPayout
} from "../server/partners.js";

test("partner passwords are salted and never stored as plain text", () => {
  const firstHash = hashPartnerPassword("partner-secret");
  const secondHash = hashPartnerPassword("partner-secret");

  assert.notEqual(firstHash, "partner-secret");
  assert.notEqual(firstHash, secondHash);
  assert.match(firstHash, /^[a-f0-9]+:[a-f0-9]+$/);
});

test("partial partner payout keeps kopecks and normalizes its note", () => {
  assert.deepEqual(
    normalizePartnerPayout({
      amount: "397.456",
      note: "  Частичная выплата за июль  "
    }),
    {
      amount: 397.46,
      note: "Частичная выплата за июль"
    }
  );
});

test("partner payout cannot exceed the current payable balance", () => {
  assert.equal(assertPartnerPayoutWithinBalance(300, 680), true);
  assert.throws(
    () => assertPartnerPayoutWithinBalance(700, 680),
    /Доступно к выплате 680\.00 ₽/
  );
});

test("zero and negative partner payouts are rejected", () => {
  assert.throws(() => normalizePartnerPayout({ amount: 0 }), /больше нуля/);
  assert.throws(() => normalizePartnerPayout({ amount: -100 }), /больше нуля/);
});
