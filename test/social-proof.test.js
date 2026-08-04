import assert from "node:assert/strict";
import test from "node:test";

import { getProductSocialProof } from "../src/utils/socialProof.js";

test("social proof never invents ratings or order counts", () => {
  assert.deepEqual(getProductSocialProof({ id: "pizza", name: "Пицца" }), {
    reviewAverage: 0,
    reviewCount: 0,
    orderedCount: 0
  });
});

test("social proof uses real API values", () => {
  assert.deepEqual(
    getProductSocialProof(
      { id: "pizza", name: "Пицца" },
      { average: 4.9, count: 12, orderedCount: 34 }
    ),
    {
      reviewAverage: 4.9,
      reviewCount: 12,
      orderedCount: 34
    }
  );
});
