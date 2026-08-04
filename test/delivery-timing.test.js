import test from "node:test";
import assert from "node:assert/strict";
import { getOrderTimingAvailability } from "../src/utils/deliveryTiming.js";

const settings = {
  currentMinutes: 45
};

test("keeps asap available while the order fits into today's working hours", () => {
  const availability = getOrderTimingAvailability({
    mode: "delivery",
    settings,
    now: new Date(2026, 6, 24, 14, 0)
  });

  assert.equal(availability.asapAvailable, true);
  assert.equal(availability.kind, "open");
});

test("offers a scheduled order before opening", () => {
  const availability = getOrderTimingAvailability({
    mode: "pickup",
    settings,
    now: new Date(2026, 6, 24, 7, 30)
  });

  assert.equal(availability.asapAvailable, false);
  assert.equal(availability.kind, "before-open");
  assert.match(availability.title, /09:00/);
});

test("moves a late delivery to the next working day", () => {
  const availability = getOrderTimingAvailability({
    mode: "delivery",
    settings,
    now: new Date(2026, 6, 24, 21, 20)
  });

  assert.equal(availability.asapAvailable, false);
  assert.equal(availability.kind, "closing");
  assert.equal(availability.earliest.getDate(), 25);
  assert.equal(availability.earliest.getHours(), 9);
});

test("does not allow asap after closing", () => {
  const availability = getOrderTimingAvailability({
    mode: "delivery",
    settings,
    now: new Date(2026, 6, 24, 22, 30)
  });

  assert.equal(availability.asapAvailable, false);
  assert.equal(availability.kind, "closed");
  assert.equal(availability.earliest.getDate(), 25);
});
