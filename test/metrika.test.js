import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const COUNTER_ID = "111415863";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("public HTML entries load the website Metrika counter", async () => {
  for (const file of ["home.html", "index.html"]) {
    const html = await read(file);
    assert.match(html, new RegExp(`tag\\.js\\?id=${COUNTER_ID}`));
    assert.match(html, new RegExp(`ym\\(${COUNTER_ID},"init"`));
    assert.match(html, /webvisor:true/);
    assert.match(html, /accurateTrackBounce:true/);
    assert.match(html, /trackLinks:true/);
    assert.match(html, new RegExp(`mc\\.yandex\\.ru/watch/${COUNTER_ID}`));
  }
});

test("the private admin entry does not load the public analytics counter", async () => {
  const html = await read("admin.html");
  assert.doesNotMatch(html, new RegExp(COUNTER_ID));
});

test("business funnel goals are implemented with stable identifiers", async () => {
  const analytics = await read("src/utils/analytics.js");
  const expectedGoals = [
    "add_to_cart",
    "checkout_start",
    "order_created",
    "payment_start",
    "payment_success",
    "phone_click",
    "masterclass_open",
    "masterclass_signup",
    "masterclass_payment",
    "masterclass_paid"
  ];

  for (const goal of expectedGoals) {
    assert.match(analytics, new RegExp(`"${goal}"`));
  }

  const sources = await Promise.all([
    read("src/components/MainSite.jsx"),
    read("src/components/site/SiteCheckoutPage.jsx"),
    read("src/components/site/SitePaymentPage.jsx"),
    read("src/components/site/SiteMasterClassPage.jsx")
  ]);
  const implementation = sources.join("\n");

  for (const constant of [
    "ADD_TO_CART",
    "CHECKOUT_START",
    "ORDER_CREATED",
    "PAYMENT_START",
    "PAYMENT_SUCCESS",
    "MASTERCLASS_SIGNUP",
    "MASTERCLASS_PAYMENT",
    "MASTERCLASS_PAID"
  ]) {
    assert.match(implementation, new RegExp(`METRIKA_GOALS\\.${constant}`));
  }
});
