import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE_MARK = join(ROOT, "scripts", "assets", "vv-mark-source.svg");
const PUBLIC = join(ROOT, "public");
const ICONS = join(PUBLIC, "icons");
const BRAND = join(PUBLIC, "assets", "brand");
const SOCIAL = join(PUBLIC, "assets", "social");
const SITE = join(PUBLIC, "assets", "site");

const COLORS = Object.freeze({
  canvas: "#f3f4f6",
  white: "#ffffff",
  text: "#202124",
  muted: "#62676d",
  accent: "#ca7767",
  line: "#dde1e5"
});

const covers = [
  {
    output: "og-default-1200x630.jpg",
    photo: "concept-pizza-oven.jpg",
    label: "СЕМЕЙНАЯ ПИЦЦЕРИЯ",
    title: ["Вместе", "Вкуснее"],
    subtitle: "Итальянская пицца · Чебоксары",
    position: "center"
  },
  {
    output: "og-delivery-1200x630.jpg",
    photo: "concept-pizza-table.webp",
    label: "ДОСТАВКА И САМОВЫВОЗ",
    title: ["Пицца и", "горячие блюда"],
    subtitle: "Чебоксары · Пирогова, 1Т",
    position: "center"
  },
  {
    output: "og-gallery-1200x630.jpg",
    photo: "interior-window-real.webp",
    label: "ГАЛЕРЕЯ",
    title: ["Зал, блюда", "и праздники"],
    subtitle: "Семейная пиццерия «Вместе Вкуснее»",
    position: "center"
  },
  {
    output: "og-masterclasses-1200x630.jpg",
    photo: "masterclass-hero-v2.webp",
    label: "МАСТЕР-КЛАССЫ",
    title: ["Готовим пиццу", "вместе"],
    subtitle: "Для детей и взрослых · Чебоксары",
    position: "center"
  },
  {
    output: "og-kitchen-1200x630.jpg",
    photo: "concept-oven.webp",
    label: "ОТКРЫТО О КУХНЕ",
    title: ["Как мы готовим", "пиццу"],
    subtitle: "Чистые руки · горячая печь",
    position: "center"
  }
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeMarkSvg(source) {
  return source
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[\s\S]*?\?>\s*/i, "")
    .replace(/<!DOCTYPE[\s\S]*?>\s*/i, "")
    .replace(/<!--([\s\S]*?)-->\s*/g, "")
    .replace(/width="50mm"\s+height="50mm"/, 'width="512" height="512"')
    .trim();
}

function withoutBackground(svg) {
  return svg.replace(/\s*<rect\s+fill="#FEFEFE"[^>]*\/>/i, "");
}

async function renderSquare(svg, size, output) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

async function renderMaskable(markSvg, size, output) {
  const markSize = Math.round(size * 0.74);
  const mark = await sharp(Buffer.from(markSvg))
    .resize(markSize, markSize, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: COLORS.canvas }
  })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(images.length * 16);
  let offset = 6 + entries.length;

  images.forEach(({ size, data }, index) => {
    const entryOffset = index * 16;
    entries.writeUInt8(size === 256 ? 0 : size, entryOffset);
    entries.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    entries.writeUInt8(0, entryOffset + 2);
    entries.writeUInt8(0, entryOffset + 3);
    entries.writeUInt16LE(1, entryOffset + 4);
    entries.writeUInt16LE(32, entryOffset + 6);
    entries.writeUInt32LE(data.length, entryOffset + 8);
    entries.writeUInt32LE(offset, entryOffset + 12);
    offset += data.length;
  });

  return Buffer.concat([header, entries, ...images.map((image) => image.data)]);
}

function socialTextSvg(cover) {
  const titleLines = cover.title.map((line, index) => (
    `<tspan x="64" dy="${index === 0 ? 0 : 66}">${escapeXml(line)}</tspan>`
  )).join("");

  return Buffer.from(`
    <svg width="636" height="630" viewBox="0 0 636 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="636" height="630" fill="${COLORS.canvas}"/>
      <rect x="635" width="1" height="630" fill="${COLORS.line}"/>
      <text x="64" y="210" fill="${COLORS.accent}" font-family="Segoe UI, Arial, sans-serif"
        font-size="20" font-weight="700" letter-spacing="1.6">${escapeXml(cover.label)}</text>
      <rect x="64" y="232" width="48" height="5" rx="2.5" fill="${COLORS.accent}"/>
      <text x="64" y="321" fill="${COLORS.text}" font-family="Segoe UI, Arial, sans-serif"
        font-size="58" font-weight="700" letter-spacing="-1.2">${titleLines}</text>
      <text x="64" y="532" fill="${COLORS.muted}" font-family="Segoe UI, Arial, sans-serif"
        font-size="23" font-weight="500">${escapeXml(cover.subtitle)}</text>
      <text x="64" y="578" fill="${COLORS.text}" font-family="Segoe UI, Arial, sans-serif"
        font-size="19" font-weight="600">vmestevkusnee.ru</text>
    </svg>
  `);
}

async function renderCover(cover, markSvg) {
  const photo = await sharp(join(SITE, cover.photo))
    .resize(564, 630, { fit: "cover", position: cover.position })
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const mark = await sharp(Buffer.from(markSvg))
    .resize(110, 110, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: COLORS.canvas }
  })
    .composite([
      { input: socialTextSvg(cover), left: 0, top: 0 },
      { input: photo, left: 636, top: 0 },
      { input: mark, left: 64, top: 48 }
    ])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(join(SOCIAL, cover.output));
}

async function main() {
  await Promise.all([ICONS, BRAND, SOCIAL].map((folder) => mkdir(folder, { recursive: true })));

  const source = await readFile(SOURCE_MARK, "utf16le");
  const markSvg = normalizeMarkSvg(source);
  const transparentMarkSvg = withoutBackground(markSvg);

  await Promise.all([
    writeFile(join(BRAND, "vv-mark.svg"), `${markSvg}\n`, "utf8"),
    writeFile(join(ICONS, "icon.svg"), `${markSvg}\n`, "utf8"),
    writeFile(join(PUBLIC, "favicon.svg"), `${markSvg}\n`, "utf8")
  ]);

  const faviconImages = [];
  for (const size of [16, 32, 48]) {
    const output = join(ICONS, `favicon-${size}.png`);
    await renderSquare(markSvg, size, output);
    faviconImages.push({ size, data: await readFile(output) });
  }

  await Promise.all([
    renderSquare(markSvg, 180, join(ICONS, "apple-touch-icon.png")),
    renderSquare(markSvg, 192, join(ICONS, "icon-192.png")),
    renderSquare(markSvg, 512, join(ICONS, "icon-512.png")),
    renderMaskable(transparentMarkSvg, 192, join(ICONS, "icon-maskable-192.png")),
    renderMaskable(transparentMarkSvg, 512, join(ICONS, "icon-maskable-512.png")),
    ...covers.map((cover) => renderCover(cover, transparentMarkSvg))
  ]);

  await writeFile(join(PUBLIC, "favicon.ico"), createIco(faviconImages));
}

await main();
