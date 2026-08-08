import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { SITE_SEO_PAGES } from "../shared/site-seo.js";

const PUBLIC = join(process.cwd(), "public");
const ICONS = join(PUBLIC, "icons");
const SOCIAL = join(PUBLIC, "assets", "social");

const iconFiles = [
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
  ["favicon-48.png", 48],
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-192.png", 192],
  ["icon-maskable-512.png", 512]
];

const socialFiles = [
  "og-default-1200x630.jpg",
  "og-delivery-1200x630.jpg",
  "og-gallery-1200x630.jpg",
  "og-kitchen-1200x630.jpg",
  "og-masterclasses-1200x630.jpg"
];

const manifestFiles = [
  "manifest.json",
  "site-manifest.json",
  "admin-manifest.json",
  "admin-staff-manifest.json",
  "partner-manifest.json"
];

test("favicon and Apple/PWA icons are real image assets with the declared sizes", async () => {
  const ico = await readFile(join(PUBLIC, "favicon.ico"));
  assert.ok(ico.length > 1000);
  assert.deepEqual([...ico.subarray(0, 6)], [0, 0, 1, 0, 3, 0]);

  const faviconSvg = await readFile(join(PUBLIC, "favicon.svg"), "utf8");
  assert.match(faviconSvg, /<svg\b/);
  assert.match(faviconSvg, /viewBox="0 0 17\.67 17\.67"/);

  for (const [file, size] of iconFiles) {
    const metadata = await sharp(join(ICONS, file)).metadata();
    assert.equal(metadata.format, "png", `${file} must be PNG`);
    assert.equal(metadata.width, size, `${file} width`);
    assert.equal(metadata.height, size, `${file} height`);
  }
});

test("every PWA manifest has separate any and maskable icon declarations", async () => {
  for (const file of manifestFiles) {
    const manifest = JSON.parse(await readFile(join(PUBLIC, file), "utf8"));
    const purposes = new Set(manifest.icons.map((icon) => icon.purpose));
    assert.ok(purposes.has("any"), `${file} is missing an any icon`);
    assert.ok(purposes.has("maskable"), `${file} is missing a maskable icon`);
    assert.ok(!purposes.has("any maskable"), `${file} must not reuse a single crop for both purposes`);

    for (const icon of manifest.icons) {
      assert.ok(existsSync(join(PUBLIC, icon.src.slice(1))), `${file}: ${icon.src} does not exist`);
    }
  }
});

test("social covers and every indexable page image use the 1200 by 630 contract", async () => {
  for (const file of socialFiles) {
    const metadata = await sharp(join(SOCIAL, file)).metadata();
    assert.equal(metadata.format, "jpeg", `${file} must be JPEG`);
    assert.equal(metadata.width, 1200, `${file} width`);
    assert.equal(metadata.height, 630, `${file} height`);
  }

  const availableCovers = new Set(socialFiles.map((file) => `/assets/social/${file}`));
  for (const page of SITE_SEO_PAGES) {
    const imagePath = new URL(page.imageUrl).pathname;
    assert.ok(availableCovers.has(imagePath), `${page.path} uses an unknown social cover`);
  }
});

test("public and admin HTML expose favicon and Apple touch icon fallbacks", async () => {
  for (const file of ["index.html", "admin.html"]) {
    const html = await readFile(join(process.cwd(), file), "utf8");
    assert.match(html, /href="\/favicon\.ico"/);
    assert.match(html, /href="\/favicon\.svg" type="image\/svg\+xml"/);
    assert.match(html, /href="\/icons\/favicon-32\.png"/);
    assert.match(html, /href="\/icons\/apple-touch-icon\.png" sizes="180x180"/);
  }
});
