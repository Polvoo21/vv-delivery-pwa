import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import express from "express";
import {
  getRouteRedirect,
  isKnownFrontendPath,
  isKnownPublicPath
} from "../shared/site-routes.js";
import {
  canonicalRedirectMiddleware,
  createSpaFallbackHandler,
  renderNotFoundHtml
} from "../server/site-routing.js";

const INDEX_FIXTURE = `<!doctype html>
<html lang="ru">
  <head>
    <meta name="description" content="Исходное описание" />
    <title>Вместе Вкуснее</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

test("canonical route redirects cover aliases and duplicate slashes", () => {
  assert.deepEqual(getRouteRedirect("/poteryashki"), { status: 301, target: "/lost" });
  assert.deepEqual(getRouteRedirect("/site/old-page"), { status: 301, target: "/" });
  assert.deepEqual(getRouteRedirect("/master-klass-pizza"), {
    status: 301,
    target: "/master-klassy/pizza-vetchina-griby-16-avgusta-2026"
  });
  assert.deepEqual(getRouteRedirect("/gallery/"), { status: 308, target: "/gallery" });
  assert.deepEqual(getRouteRedirect("//delivery-zones//"), {
    status: 308,
    target: "/delivery-zones"
  });
  assert.equal(getRouteRedirect("/gallery"), null);
});

test("known route registry distinguishes public, app, and missing paths", () => {
  assert.equal(isKnownPublicPath("/gallery"), true);
  assert.equal(isKnownPublicPath("/dostavka"), true);
  assert.equal(isKnownPublicPath("/checkout"), false);
  assert.equal(isKnownFrontendPath("/checkout"), true);
  assert.equal(isKnownFrontendPath("/account/orders/123"), true);
  assert.equal(isKnownFrontendPath("/legal/not-a-document"), false);
  assert.equal(isKnownFrontendPath("/this-page-does-not-exist-12345"), false);
});

test("not-found renderer adds noindex, one H1, and useful links", () => {
  const html = renderNotFoundHtml(INDEX_FIXTURE);

  assert.match(html, /<title>Страница не найдена \| Вместе Вкуснее<\/title>/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/delivery-zones"/);
  assert.doesNotMatch(html, /Исходное описание/);
});

test("server routing returns redirects, 200 for known pages, and 404 for unknown pages", async (t) => {
  const fixtureDir = await mkdtemp(path.join(tmpdir(), "vv-site-routing-"));
  await writeFile(path.join(fixtureDir, "index.html"), INDEX_FIXTURE, "utf8");
  t.after(() => rm(fixtureDir, { recursive: true, force: true }));

  const app = express();
  app.use(canonicalRedirectMiddleware);
  app.get(/^(?!\/api\/).*/, createSpaFallbackHandler({ distDir: fixtureDir }));

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  const knownResponse = await fetch(`${origin}/gallery`);
  assert.equal(knownResponse.status, 200);

  const missingResponse = await fetch(`${origin}/this-page-does-not-exist-12345`);
  assert.equal(missingResponse.status, 404);
  assert.match(await missingResponse.text(), /Страница не найдена/);

  const aliasResponse = await fetch(`${origin}/poteryashki?utm_source=test`, {
    redirect: "manual"
  });
  assert.equal(aliasResponse.status, 301);
  assert.equal(aliasResponse.headers.get("location"), "/lost?utm_source=test");

  const slashResponse = await fetch(`${origin}/gallery/?from=old`, {
    redirect: "manual"
  });
  assert.equal(slashResponse.status, 308);
  assert.equal(slashResponse.headers.get("location"), "/gallery?from=old");
});
