import assert from "node:assert/strict";
import test from "node:test";

import { MENU } from "../src/data/menu.js";
import { calculateCartTotals, getProductOldPrice } from "../src/utils/price.js";

test("пиццы продаются по ценам меню без фиктивной старой цены", () => {
  const expectedPrices = {
    margarita: 640,
    "pizza-carbonara": 690,
    pepperoni: 660
  };

  for (const [productId, expectedPrice] of Object.entries(expectedPrices)) {
    const product = MENU.find((item) => item.id === productId);
    assert.ok(product, `Не найден товар ${productId}`);
    assert.equal(product.price, expectedPrice);
    assert.equal(getProductOldPrice(product), 0);
  }
});

test("устаревший локальный оффер не уменьшает сумму корзины", () => {
  const totals = calculateCartTotals(
    [{ productId: "margarita", unitPrice: 640, qty: 1 }],
    null,
    { active: true, percent: 25 }
  );

  assert.equal(totals.subtotal, 640);
  assert.equal(totals.discount, 0);
  assert.equal(totals.total, 640);
});
