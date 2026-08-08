import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderSeoDocument } from "../server/site-seo.js";
import { getSiteSeoPage, SITE_SEO_PAGES } from "../shared/site-seo.js";
import { BUSINESS_PROFILE_URLS, BUSINESS_PROFILES } from "../shared/site-profiles.js";

const INDEX_FIXTURE = `<!doctype html>
<html lang="ru">
  <head>
    <meta name="description" content="Исходное описание" />
    <title>Вместе Вкуснее</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

async function readSitemapUrls() {
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function countTags(html, tagName) {
  return (html.match(new RegExp(`<${tagName}\\b`, "gi")) || []).length;
}

test("sitemap and the indexable SEO registry contain the same canonical pages", async () => {
  const sitemapUrls = await readSitemapUrls();
  const registryUrls = SITE_SEO_PAGES.map((page) => page.canonicalUrl);

  assert.deepEqual(new Set(registryUrls), new Set(sitemapUrls));
  assert.equal(registryUrls.length, new Set(registryUrls).size, "Canonical URLs must be unique");
  assert.equal(
    SITE_SEO_PAGES.length,
    new Set(SITE_SEO_PAGES.map((page) => page.title)).size,
    "Page titles must be unique"
  );
  assert.equal(
    SITE_SEO_PAGES.length,
    new Set(SITE_SEO_PAGES.map((page) => page.description)).size,
    "Meta descriptions must be unique"
  );
});

test("every sitemap page has a complete server-rendered SEO document", async () => {
  const sitemapUrls = await readSitemapUrls();

  for (const sitemapUrl of sitemapUrls) {
    const url = new URL(sitemapUrl);
    const page = getSiteSeoPage(url.pathname);
    assert.ok(page, `Missing SEO data for ${url.pathname}`);
    assert.equal(page.canonicalUrl, sitemapUrl, `Canonical mismatch for ${url.pathname}`);
    assert.ok(page.h1.trim(), `Missing H1 for ${url.pathname}`);
    assert.ok(page.intro.trim(), `Missing indexable copy for ${url.pathname}`);
    assert.ok(page.links.length >= 3, `Missing internal links for ${url.pathname}`);

    if (url.pathname !== "/") {
      assert.ok(page.breadcrumbs.length >= 2, `Missing breadcrumbs for ${url.pathname}`);
      assert.equal(page.breadcrumbs.at(-1).url, sitemapUrl);
    }

    const html = renderSeoDocument(INDEX_FIXTURE, page);
    assert.equal(countTags(html, "h1"), 1, `Expected one H1 for ${url.pathname}`);
    assert.equal(countTags(html, "title"), 1, `Expected one title for ${url.pathname}`);
    assert.equal(
      (html.match(/rel="canonical"/g) || []).length,
      1,
      `Expected one canonical for ${url.pathname}`
    );
    assert.match(html, new RegExp(`href="${sitemapUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, /property="og:url"/);
    assert.match(html, /property="og:image"/);
    assert.match(html, /property="og:image:type" content="image\/jpeg"/);
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html, /<div\s+id="root"\s*><\/div>/i);

    const schemaMatch = html.match(
      /<script id="site-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    assert.ok(schemaMatch, `Missing JSON-LD for ${url.pathname}`);
    const schema = JSON.parse(schemaMatch[1]);
    assert.equal(schema["@context"], "https://schema.org");
  }
});

test("legacy and preview aliases resolve to canonical SEO data", () => {
  assert.equal(getSiteSeoPage("/poteryashki")?.path, "/lost");
  assert.equal(getSiteSeoPage("/site/gallery")?.path, "/gallery");
  assert.equal(getSiteSeoPage("/dev/delivery-zones")?.path, "/delivery-zones");
  assert.equal(getSiteSeoPage("/not-an-indexable-page"), null);
});

test("homepage schema links the verified restaurant, organization, website, and order methods", () => {
  const homepage = getSiteSeoPage("/");
  const schema = JSON.parse(
    renderSeoDocument(INDEX_FIXTURE, homepage).match(
      /<script id="site-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/
    )[1]
  );
  const graph = schema["@graph"];
  const organization = graph.find((node) => node["@id"]?.endsWith("#organization"));
  const restaurant = graph.find((node) => node["@type"] === "Restaurant");
  const website = graph.find((node) => node["@type"] === "WebSite");
  const webpage = graph.find((node) => node["@id"] === `${homepage.canonicalUrl}#webpage`);

  assert.ok(organization);
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.legalName, "ООО «АвтоТехнологии»");
  assert.equal(organization.taxID, "2130140563");
  assert.deepEqual(new Set(organization.sameAs), new Set(BUSINESS_PROFILE_URLS));

  assert.ok(restaurant);
  assert.equal(restaurant.parentOrganization["@id"], organization["@id"]);
  assert.equal(restaurant.telephone, "+7 (8352) 66-77-77");
  assert.deepEqual(restaurant.geo, {
    "@type": "GeoCoordinates",
    latitude: 56.140976,
    longitude: 47.223716
  });
  assert.deepEqual(restaurant.servesCuisine, [
    "Итальянская кухня",
    "Европейская кухня",
    "Русская кухня"
  ]);
  assert.equal(restaurant.hasMap, BUSINESS_PROFILES.yandexMaps);
  assert.deepEqual(new Set(restaurant.sameAs), new Set(BUSINESS_PROFILE_URLS));
  assert.deepEqual(
    restaurant.potentialAction.map((action) => action.deliveryMethod),
    [
      "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
      "http://purl.org/goodrelations/v1#DeliveryModePickUp"
    ]
  );
  assert.ok(restaurant.potentialAction.every((action) => action.target.endsWith("/checkout")));
  assert.equal(restaurant.aggregateRating, undefined);
  assert.equal(restaurant.review, undefined);

  assert.ok(website);
  assert.equal(website.publisher["@id"], organization["@id"]);
  assert.equal(website.about["@id"], restaurant["@id"]);
  assert.equal(webpage.mainEntity["@id"], restaurant["@id"]);
});
