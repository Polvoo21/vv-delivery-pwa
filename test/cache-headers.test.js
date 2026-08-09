import assert from "node:assert/strict";
import test from "node:test";
import { getStaticCacheControl } from "../server/cache-headers.js";

test("hashed Vite assets are cached for one year as immutable", () => {
  assert.equal(
    getStaticCacheControl("C:\\site\\dist\\assets\\main-DLSlKhC9.js"),
    "public, max-age=31536000, immutable"
  );
  assert.equal(
    getStaticCacheControl("C:\\site\\dist\\assets\\main-A2XhDCck.css"),
    "public, max-age=31536000, immutable"
  );
});

test("unversioned media uses bounded revalidation caching", () => {
  assert.equal(
    getStaticCacheControl("C:\\site\\dist\\assets\\site\\interior-window-hero-720.avif"),
    "public, max-age=604800, stale-while-revalidate=86400"
  );
});

test("HTML and service worker files are always revalidated", () => {
  assert.equal(getStaticCacheControl("C:\\site\\dist\\index.html"), "no-cache");
  assert.equal(getStaticCacheControl("C:\\site\\dist\\service-worker.js"), "no-cache");
});
