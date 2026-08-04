import assert from "node:assert/strict";
import test from "node:test";
import { assertCheckoutTotalMatches, priceCheckoutOrder } from "../server/checkout-pricing.js";

const catalog = {
  products: [
    {
      id: "pizza-1",
      category: "pizza",
      name: "Пицца",
      description: "Описание",
      price: 600,
      customizable: true,
      comboItems: []
    },
    {
      id: "drink-1",
      category: "drink",
      name: "Морс",
      price: 150,
      customizable: false,
      comboItems: []
    }
  ]
};

test("checkout pricing ignores client prices and uses the server catalog", async () => {
  const order = await priceCheckoutOrder(
    {
      subtotal: 875,
      items: [
        {
          productId: "pizza-1",
          name: "Поддельное название",
          qty: 1,
          unitPrice: 1,
          addons: [{ id: "mozzarella", qty: 1, price: 1 }]
        },
        { productId: "drink-1", qty: 1, unitPrice: 1 }
      ]
    },
    { catalog }
  );

  assert.equal(order.items[0].name, "Пицца");
  assert.equal(order.items[0].unitPrice, 725);
  assert.equal(order.items[1].unitPrice, 150);
  assert.equal(order.subtotal, 875);
  assert.equal(order.total, 875);
});

test("checkout pricing rejects missing products and stale totals", async () => {
  await assert.rejects(
    priceCheckoutOrder({ items: [{ productId: "missing", qty: 1 }] }, { catalog }),
    /больше недоступно/
  );
  assert.throws(() => assertCheckoutTotalMatches(1, { total: 875 }), /Итоговая сумма/);
});
