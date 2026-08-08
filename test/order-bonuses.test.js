import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checkoutFiles = [
  new URL("../src/components/site/CartDrawer.jsx", import.meta.url),
  new URL("../src/components/site/SiteCheckoutPage.jsx", import.meta.url)
];

test("корзина и оформление не обещают бонусы за заказ", async () => {
  for (const file of checkoutFiles) {
    const source = await readFile(file, "utf8");
    assert.equal(source.includes("Начислим бонусы"), false);
    assert.equal(source.includes("cartSummary.total * 0.05"), false);
  }
});

test("правила прямо сообщают, что заказы не начисляют бонусы", async () => {
  const source = await readFile(
    new URL("../src/components/site/LegalPage.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /бонусы за оформление, оплату или получение заказов не начисляются/i);
});
