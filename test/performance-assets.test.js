import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSiteSeoPage } from "../shared/site-seo.js";
import { renderSeoDocument } from "../server/site-seo.js";

async function readSource(filePath) {
  return readFile(new URL(`../${filePath}`, import.meta.url), "utf8");
}

test("homepage priority images use responsive AVIF/WebP and reserve layout space", async () => {
  const [about, promo, mainSite, mobilePromoAvif] = await Promise.all([
    readSource("src/components/site/SiteAboutSection.jsx"),
    readSource("src/components/site/SiteMasterclassPromo.jsx"),
    readSource("src/components/MainSite.jsx"),
    readFile(new URL("../public/assets/site/masterclass-promo-hero-480.avif", import.meta.url))
  ]);

  assert.match(about, /interior-window-hero-480\.avif/);
  assert.match(about, /width="720"[\s\S]*height="636"[\s\S]*loading="eager"[\s\S]*fetchpriority="high"/);
  assert.doesNotMatch(about, /interior-window-real\.webp/);

  assert.match(promo, /masterclass-promo-hero-480\.avif/);
  assert.match(promo, /media="\(max-width: 640px\)"[\s\S]*srcSet="\/assets\/site\/masterclass-promo-hero-480\.avif"/);
  assert.match(promo, /width="800"[\s\S]*height="383"[\s\S]*loading="lazy"[\s\S]*decoding="async"/);
  assert.doesNotMatch(promo, /masterclass-real-03/);
  assert.match(promo, /AUTO_OPEN_DELAY_MS = 1200/);
  assert.match(promo, /site-masterclass-promo-dialog/);
  assert.match(promo, /aria-modal="true"/);
  assert.match(mainSite, /isMasterclassPromoOpen/);
  assert.ok(
    mainSite.indexOf("<SiteAboutSection") < mainSite.indexOf("<SiteMasterclassPromo"),
    "The evergreen homepage hero must precede the temporary campaign"
  );
  assert.ok(mobilePromoAvif.byteLength <= 8_000, "Mobile LCP image must stay below 8 KB");
});

test("important landing hero has modern responsive sources and high priority", async () => {
  const source = await readSource("src/components/site/SiteNoGlovesPage.jsx");

  assert.match(source, /no-gloves-hero-640\.avif/);
  assert.match(source, /no-gloves-hero-640\.webp/);
  assert.match(source, /width="1280"[\s\S]*height="854"[\s\S]*loading="eager"[\s\S]*fetchPriority="high"/);
});

test("non-home routes and Leaflet are loaded on demand", async () => {
  const [app, main, homeMain, zones, server, homeStyles] = await Promise.all([
    readSource("src/App.jsx"),
    readSource("src/main.jsx"),
    readSource("src/home-main.jsx"),
    readSource("src/components/site/SiteDeliveryZonesPage.jsx"),
    readSource("server/index.js"),
    readSource("server/home-styles.js")
  ]);

  assert.match(app, /lazyNamed\(\(\) => import\("\.\/components\/site\/SiteCheckoutPage"\)/);
  assert.match(app, /lazy\(\(\) => import\("\.\/components\/AdminApp"\)\)/);
  assert.doesNotMatch(main, /leaflet\/dist\/leaflet\.css/);
  assert.doesNotMatch(main, /styles\.css|final-polish\.css/);
  assert.match(homeMain, /import MainSite from "\.\/components\/MainSite"/);
  assert.match(homeMain, /createRoot\(document\.getElementById\("root"\)\)\.render/);
  assert.doesNotMatch(homeMain, /hydrateRoot/);
  assert.match(homeMain, /<MainSite \/>/);
  assert.doesNotMatch(homeMain, /\.\/App|AdminApp|ClientApp/);
  assert.doesNotMatch(await readSource("src/components/site/siteCoreData.js"), /data\/config/);
  assert.doesNotMatch(await readSource("src/components/site/cartModel.js"), /data\/config/);
  assert.match(server, /page\.path === "\/" \? "home\.html" : "index\.html"/);
  assert.match(server, /page\.path === "\/" \? await renderHomeApp\(\) : ""/);
  assert.match(server, /page\.path === "\/" \? await inlineHomeStyles\(source, distDir\) : source/);
  assert.match(homeStyles, /data-home-critical/);
  assert.match(zones, /import\("leaflet\/dist\/leaflet\.css"\)/);
});

test("production HTML preloads the route-specific LCP image", () => {
  const source = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>x</title><meta name="description" content="x"></head><body><div id="root"></div></body></html>';
  const homepage = renderSeoDocument(source, getSiteSeoPage("/"));
  const noGloves = renderSeoDocument(source, getSiteSeoPage("/bez-perchatok"));

  assert.match(homepage, /rel="preload"[\s\S]*fetchpriority="high"/);
  assert.match(homepage, /interior-window-hero-480\.avif 480w/);
  assert.match(homepage, /interior-window-hero-720\.avif 720w/);
  assert.doesNotMatch(homepage, /masterclass-promo-hero-[^" ]+\.avif"[\s\S]*fetchpriority="high"/);
  assert.ok(
    homepage.indexOf('rel="preload"') < homepage.indexOf('<script'),
    "LCP preload must be discovered before application scripts"
  );
  assert.ok(
    homepage.indexOf('name="viewport"') < homepage.indexOf('rel="preload"'),
    "Responsive image preload must be evaluated after the viewport is declared"
  );
  assert.match(noGloves, /no-gloves-hero-1280\.avif/);
});
