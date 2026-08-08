import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";
import { MENU, MENU_CATEGORIES, isPublicMenuCategory } from "../src/data/menu.js";

export const MAX_CATALOG_UPLOAD_BYTES = 14 * 1024 * 1024;
export const MAX_CATALOG_VIDEO_UPLOAD_BYTES = 120 * 1024 * 1024;
export const MAX_CATALOG_MEDIA_FILES = 1;

const CATALOG_UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "catalog");
const CATALOG_VIDEO_UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "catalog-video");
const CATALOG_PUBLIC_PATH = "/uploads/catalog";
const CATALOG_VIDEO_PUBLIC_PATH = "/uploads/catalog-video";
const DEFAULT_PRODUCT_IMAGE = "/assets/site/product-photo-placeholder.png";
const BUNDLED_PRODUCT_IMAGE_BY_ID = Object.fromEntries(
  MENU.map((product) => [product.id, product.image]).filter(
    ([, image]) => image && image !== DEFAULT_PRODUCT_IMAGE
  )
);
const VALID_STATUSES = new Set(["active", "hidden", "archived"]);

const DEFAULT_COMBO_CATEGORY = {
  id: "combo",
  title: "Комбо",
  shortTitle: "Комбо",
  description: "Готовые наборы для семьи, гостей и праздников.",
  image: "/assets/site/concept-pizza-table.webp"
};

const DEFAULT_CATEGORY_ORDER = [
  "combo",
  "summer",
  "pizza",
  "breakfast",
  "breakfast-addon",
  "kids",
  "soup",
  "main",
  "pasta",
  "salad",
  "starter",
  "dumplings",
  "waffle",
  "side",
  "bread",
  "dessert",
  "drink"
];

const DEFAULT_COMBO_PRODUCTS = [
  {
    id: "combo-family-pizza",
    category: "combo",
    name: "Семейное комбо из 3 пицц",
    description: "Три пиццы на компанию: классика, пеперони и фирменная пицца.",
    weight: "3 пиццы",
    price: 1890,
    badges: [],
    image: DEFAULT_PRODUCT_IMAGE,
    comboItemIds: ["signature-vv-pizza", "margarita", "pepperoni"]
  },
  {
    id: "combo-date-pizza",
    category: "combo",
    name: "Комбо на двоих",
    description: "Две пиццы и напиток к ужину дома или самовывозу.",
    weight: "2 пиццы",
    price: 1290,
    badges: [],
    image: DEFAULT_PRODUCT_IMAGE,
    comboItemIds: ["margarita", "pepperoni"]
  },
  {
    id: "combo-kids-party",
    category: "combo",
    name: "Комбо для детского праздника",
    description: "Пиццы, фокачча и понятные вкусы для детского стола.",
    weight: "для праздника",
    price: 2290,
    badges: [],
    image: DEFAULT_PRODUCT_IMAGE,
    comboItemIds: ["kids-margarita-pizza", "kids-ham-pizza", "parmesan-focaccia"]
  }
];

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function slugify(value, fallbackPrefix = "item") {
  const source = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return source || `${fallbackPrefix}-${Date.now().toString(36)}`;
}

function cleanText(value, maxLength = 400) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeStatus(value) {
  const status = cleanText(value, 20).toLowerCase();
  return VALID_STATUSES.has(status) ? status : "active";
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
}

function normalizeDecimal(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 10) / 10) : fallback;
}

function normalizeNutrition(value = {}) {
  let nutrition = value && typeof value === "object" ? value : {};
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        nutrition = parsed;
      }
    } catch {
      nutrition = {};
    }
  }
  return {
    calories: normalizeDecimal(nutrition.calories),
    protein: normalizeDecimal(nutrition.protein),
    fat: normalizeDecimal(nutrition.fat),
    carbs: normalizeDecimal(nutrition.carbs)
  };
}

function getRowNutrition(row = {}) {
  const nutrition = normalizeNutrition({
    calories: row.calories,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs
  });
  return Object.values(nutrition).some((value) => value !== null) ? nutrition : null;
}

function normalizeSortOrder(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(-9999, Math.min(9999, Math.round(number))) : fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "да"].includes(raw)) return true;
  if (["0", "false", "no", "off", "нет"].includes(raw)) return false;
  return fallback;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item, 120)).filter(Boolean);
  }

  if (value && typeof value === "object") {
    return [];
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => cleanText(item, 120)).filter(Boolean);
    }
  } catch {
    // Plain text list.
  }

  return raw
    .split(/[\n,;]+/g)
    .map((item) => cleanText(item, 120))
    .filter(Boolean);
}

function categoryRowToPublic(row, { includePrivate = false } = {}) {
  const category = {
    id: row.id,
    title: row.title || "",
    shortTitle: row.short_title || row.title || "",
    label: row.short_title || row.title || "",
    description: row.description || "",
    image: row.image_url || "",
    sortOrder: Number(row.sort_order || 0)
  };

  if (includePrivate) {
    category.status = row.status || "active";
    category.archivedAt = row.archived_at || null;
    category.createdAt = row.created_at;
    category.updatedAt = row.updated_at;
    category.createdBy = row.created_by || "";
  }

  return category;
}

function productRowToPublic(row, productById = {}, { includePrivate = false } = {}) {
  const ingredients = Array.isArray(row.ingredients) ? row.ingredients.filter(Boolean) : [];
  const badges = Array.isArray(row.badges) ? row.badges.filter(Boolean) : [];
  const comboItemIds = Array.isArray(row.combo_item_ids) ? row.combo_item_ids.filter(Boolean) : [];
  const storedImage = String(row.image_url || "").trim();
  const image =
    !storedImage || storedImage === DEFAULT_PRODUCT_IMAGE
      ? BUNDLED_PRODUCT_IMAGE_BY_ID[row.id] || DEFAULT_PRODUCT_IMAGE
      : storedImage;
  const product = {
    id: row.id,
    category: row.category_id,
    categoryId: row.category_id,
    name: row.name || "",
    description: row.description || "",
    weight: row.weight || "",
    price: normalizeNumber(row.price),
    oldPrice: normalizeNumber(row.old_price),
    badges,
    ingredients,
    nutrition: getRowNutrition(row),
    featured: Boolean(row.featured),
    customizable: Boolean(row.customizable),
    image,
    video: row.video_url
      ? {
          url: row.video_url,
          originalName: row.video_original_name || "",
          mimeType: row.video_mime_type || "video/mp4",
          sizeBytes: Number(row.video_size_bytes || 0)
        }
      : null,
    videoUrl: row.video_url || "",
    visual: {
      image,
      label: row.name || ""
    },
    comboItemIds,
    comboItems: comboItemIds.map((id) => productById[id]).filter(Boolean),
    sortOrder: Number(row.sort_order || 0)
  };

  if (includePrivate) {
    product.status = row.status || "active";
    product.archivedAt = row.archived_at || null;
    product.originalName = row.original_name || "";
    product.mimeType = row.mime_type || "";
    product.sizeBytes = Number(row.size_bytes || 0);
    product.width = Number(row.width || 0);
    product.height = Number(row.height || 0);
    product.videoOriginalName = row.video_original_name || "";
    product.videoMimeType = row.video_mime_type || "";
    product.videoSizeBytes = Number(row.video_size_bytes || 0);
    product.createdBy = row.created_by || "";
    product.createdAt = row.created_at;
    product.updatedAt = row.updated_at;
  }

  return product;
}

async function compressCatalogImage(file, productId) {
  if (!file?.buffer || !String(file.mimetype || "").startsWith("image/")) {
    throw makeError("Можно загрузить только изображение товара", 400);
  }

  await fs.mkdir(CATALOG_UPLOAD_DIR, { recursive: true });

  const result = await sharp(file.buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  if (!result?.data?.length) {
    throw makeError("Не удалось обработать изображение товара", 400);
  }

  const filename = `${productId}-${Date.now().toString(36)}.webp`;
  await fs.writeFile(path.join(CATALOG_UPLOAD_DIR, filename), result.data);

  return {
    imageUrl: `${CATALOG_PUBLIC_PATH}/${filename}`,
    originalName: file.originalname || "",
    mimeType: "image/webp",
    sizeBytes: result.data.length,
    width: result.info.width,
    height: result.info.height
  };
}

function getVideoExtension(file) {
  const original = String(file?.originalname || "").toLowerCase();
  if (original.endsWith(".mov")) return ".mov";
  if (original.endsWith(".webm")) return ".webm";
  if (original.endsWith(".m4v")) return ".m4v";
  return ".mp4";
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let errorOutput = "";

    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(makeError(errorOutput.trim() || "Не удалось сжать видео товара", 500));
    });
  });
}

async function processCatalogVideo(file, productId) {
  const isVideo = String(file?.mimetype || "").startsWith("video/");
  if (!file?.buffer || !isVideo) {
    throw makeError("Можно загрузить только видео товара", 400);
  }

  await fs.mkdir(CATALOG_VIDEO_UPLOAD_DIR, { recursive: true });

  const stamp = Date.now().toString(36);
  const tempName = `${productId}-${stamp}-source${getVideoExtension(file)}`;
  const tempPath = path.join(CATALOG_VIDEO_UPLOAD_DIR, tempName);
  const outputName = `${productId}-${stamp}.mp4`;
  const outputPath = path.join(CATALOG_VIDEO_UPLOAD_DIR, outputName);

  await fs.writeFile(tempPath, file.buffer);

  try {
    await runFfmpeg([
      "-y",
      "-i",
      tempPath,
      "-an",
      "-vf",
      "scale=720:-2",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath
    ]);

    const stat = await fs.stat(outputPath);
    await fs.unlink(tempPath).catch(() => {});

    return {
      videoUrl: `${CATALOG_VIDEO_PUBLIC_PATH}/${outputName}`,
      originalName: file.originalname || "",
      mimeType: "video/mp4",
      sizeBytes: stat.size
    };
  } catch (error) {
    const fallbackName = `${productId}-${stamp}${getVideoExtension(file)}`;
    const fallbackPath = path.join(CATALOG_VIDEO_UPLOAD_DIR, fallbackName);
    await fs.rename(tempPath, fallbackPath).catch(async () => {
      await fs.writeFile(fallbackPath, file.buffer);
      await fs.unlink(tempPath).catch(() => {});
    });
    await fs.unlink(outputPath).catch(() => {});

    const stat = await fs.stat(fallbackPath);
    return {
      videoUrl: `${CATALOG_VIDEO_PUBLIC_PATH}/${fallbackName}`,
      originalName: file.originalname || "",
      mimeType: file.mimetype || "video/mp4",
      sizeBytes: stat.size,
      processingWarning: error.message || "Видео сохранено без серверного сжатия"
    };
  }
}

async function seedCatalogIfEmpty() {
  const result = await pool.query("select count(*)::int as count from catalog_categories");
  if (Number(result.rows[0]?.count || 0) > 0) return;

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("lock table catalog_categories in exclusive mode");

    const lockedResult = await client.query("select count(*)::int as count from catalog_categories");
    if (Number(lockedResult.rows[0]?.count || 0) > 0) {
      await client.query("commit");
      return;
    }

    const categoryById = Object.fromEntries(
      [
        DEFAULT_COMBO_CATEGORY,
        ...MENU_CATEGORIES.map((category) => ({
          id: category.id,
          title: category.title,
          shortTitle: category.shortTitle,
          description: category.description,
          image: category.image
        }))
      ].map((category) => [category.id, category])
    );
    const categories = DEFAULT_CATEGORY_ORDER.map((id) => categoryById[id])
      .filter(Boolean)
      .concat(
        MENU_CATEGORIES.filter((category) => !DEFAULT_CATEGORY_ORDER.includes(category.id)).map((category) => ({
        id: category.id,
        title: category.title,
        shortTitle: category.shortTitle,
        description: category.description,
        image: category.image
      }))
      );

    for (const [index, category] of categories.entries()) {
      await client.query(
        `
          insert into catalog_categories (
            id, title, short_title, description, image_url, sort_order, status, created_by, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, 'active', 'Первичный импорт', now(), now())
          on conflict (id) do nothing
        `,
        [
          category.id,
          cleanText(category.title, 120),
          cleanText(category.shortTitle || category.title, 80),
          cleanText(category.description, 600),
          category.image || "",
          index * 10
        ]
      );
    }

    const products = [
      ...DEFAULT_COMBO_PRODUCTS,
      ...MENU.map((product) => ({
        ...product,
        category: product.category,
        oldPrice: product.oldPrice || 0,
        comboItemIds: []
      }))
    ];

    for (const [index, product] of products.entries()) {
      await client.query(
        `
          insert into catalog_products (
            id, category_id, name, description, weight, price, old_price, badges, ingredients,
            calories, protein, fat, carbs, combo_item_ids, image_url, customizable, featured, sort_order, status, created_by,
            created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, 'active', 'Первичный импорт', now(), now())
          on conflict (id) do nothing
        `,
        [
          product.id,
          product.category,
          cleanText(product.name, 160),
          cleanText(product.description, 900),
          cleanText(product.weight, 80),
          normalizeNumber(product.price),
          normalizeNumber(product.oldPrice),
          JSON.stringify(Array.isArray(product.badges) ? product.badges : []),
          JSON.stringify(Array.isArray(product.ingredients) ? product.ingredients : []),
          normalizeDecimal(product.nutrition?.calories),
          normalizeDecimal(product.nutrition?.protein),
          normalizeDecimal(product.nutrition?.fat),
          normalizeDecimal(product.nutrition?.carbs),
          JSON.stringify(Array.isArray(product.comboItemIds) ? product.comboItemIds : []),
          product.image || DEFAULT_PRODUCT_IMAGE,
          normalizeBoolean(product.customizable, product.category === "pizza"),
          normalizeBoolean(product.featured, false),
          index * 10
        ]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function readCatalog({ includePrivate = false } = {}) {
  await seedCatalogIfEmpty();

  const categoryQuery = includePrivate
    ? `
        select *
        from catalog_categories
        order by
          case when status = 'active' and archived_at is null then 0 else 1 end,
          sort_order asc,
          created_at desc
      `
    : `
        select *
        from catalog_categories
        where status = 'active'
          and archived_at is null
        order by sort_order asc, created_at desc
      `;

  const productQuery = includePrivate
    ? `
        select *
        from catalog_products
        order by
          case when status = 'active' and archived_at is null then 0 else 1 end,
          category_id asc,
          sort_order asc,
          created_at desc
      `
    : `
        select p.*
        from catalog_products p
        join catalog_categories c on c.id = p.category_id
        where p.status = 'active'
          and p.archived_at is null
          and c.status = 'active'
          and c.archived_at is null
        order by p.category_id asc, p.sort_order asc, p.created_at desc
      `;

  const [categoryResult, productResult] = await Promise.all([
    pool.query(categoryQuery),
    pool.query(productQuery)
  ]);

  const publicProductRows = includePrivate
    ? productResult.rows
    : productResult.rows.filter((row) => isPublicMenuCategory(row.category_id));
  const baseProducts = publicProductRows.map((row) => productRowToPublic(row, {}, { includePrivate }));
  const productById = Object.fromEntries(baseProducts.map((product) => [product.id, product]));
  const products = publicProductRows.map((row) => productRowToPublic(row, productById, { includePrivate }));
  const categories = categoryResult.rows
    .map((row) => categoryRowToPublic(row, { includePrivate }))
    .filter((category) => includePrivate || isPublicMenuCategory(category.id));
  const visibleCategoryIds = new Set(products.map((product) => product.category || product.categoryId));

  return {
    categories: includePrivate
      ? categories
      : categories.filter((category) => visibleCategoryIds.has(category.id)),
    products
  };
}

export async function listPublicCatalog() {
  return readCatalog({ includePrivate: false });
}

export async function listAdminCatalog() {
  return readCatalog({ includePrivate: true });
}

export async function createCatalogCategory(body = {}, { createdBy = "Админка" } = {}) {
  const title = cleanText(body.title, 120);
  if (!title) throw makeError("Введите название категории", 400);

  const id = slugify(body.id || title, "category");
  const result = await pool.query(
    `
      insert into catalog_categories (
        id, title, short_title, description, image_url, sort_order, status, created_by, created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      returning *
    `,
    [
      id,
      title,
      cleanText(body.shortTitle || title, 80),
      cleanText(body.description, 600),
      cleanText(body.image, 500),
      normalizeSortOrder(body.sortOrder, 0),
      normalizeStatus(body.status),
      cleanText(createdBy, 120)
    ]
  );

  return categoryRowToPublic(result.rows[0], { includePrivate: true });
}

export async function updateCatalogCategory(categoryId, body = {}, { createdBy = "Админка" } = {}) {
  const result = await pool.query(
    `
      update catalog_categories
      set title = $2,
          short_title = $3,
          description = $4,
          image_url = $5,
          sort_order = $6,
          status = $7,
          created_by = $8,
          archived_at = case when $7 = 'archived' then coalesce(archived_at, now()) else null end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      categoryId,
      cleanText(body.title, 120),
      cleanText(body.shortTitle || body.title, 80),
      cleanText(body.description, 600),
      cleanText(body.image, 500),
      normalizeSortOrder(body.sortOrder, 0),
      normalizeStatus(body.status),
      cleanText(createdBy, 120)
    ]
  );

  if (!result.rowCount) throw makeError("Категория не найдена", 404);
  return categoryRowToPublic(result.rows[0], { includePrivate: true });
}

function buildProductPatch(body, current = {}) {
  const name = cleanText(body.name ?? current.name, 160);
  if (!name) throw makeError("Введите название товара", 400);

  return {
    categoryId: cleanText(body.categoryId ?? body.category ?? current.category_id, 80),
    name,
    description: cleanText(body.description ?? current.description, 900),
    weight: cleanText(body.weight ?? current.weight, 80),
    price: normalizeNumber(body.price ?? current.price),
    oldPrice: normalizeNumber(body.oldPrice ?? body.old_price ?? current.old_price),
    badges: normalizeList(body.badges ?? current.badges),
    ingredients: normalizeList(body.ingredients ?? current.ingredients),
    nutrition: normalizeNutrition(body.nutrition ?? {
      calories: body.calories ?? current.calories,
      protein: body.protein ?? current.protein,
      fat: body.fat ?? current.fat,
      carbs: body.carbs ?? current.carbs
    }),
    comboItemIds: normalizeList(body.comboItemIds ?? body.combo_item_ids ?? current.combo_item_ids),
    imageUrl: cleanText(body.imageUrl ?? body.image ?? current.image_url, 500),
    customizable: normalizeBoolean(body.customizable ?? current.customizable, false),
    featured: normalizeBoolean(body.featured ?? current.featured, false),
    sortOrder: normalizeSortOrder(body.sortOrder ?? current.sort_order, 0),
    status: normalizeStatus(body.status ?? current.status)
  };
}

export async function createCatalogProduct({ file, body = {}, createdBy = "Админка" }) {
  const patch = buildProductPatch(body);
  if (!patch.categoryId) throw makeError("Выберите категорию товара", 400);

  const id = slugify(body.id || patch.name, "product");
  let media = null;
  if (file) {
    media = await compressCatalogImage(file, id);
  }

  const result = await pool.query(
    `
      insert into catalog_products (
        id, category_id, name, description, weight, price, old_price, badges, ingredients,
        calories, protein, fat, carbs, combo_item_ids, image_url, customizable, featured, sort_order, status,
        original_name, mime_type, size_bytes, width, height, created_by, created_at, updated_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14::jsonb, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, now(), now()
      )
      returning *
    `,
    [
      id,
      patch.categoryId,
      patch.name,
      patch.description,
      patch.weight,
      patch.price,
      patch.oldPrice,
      JSON.stringify(patch.badges),
      JSON.stringify(patch.ingredients),
      patch.nutrition.calories,
      patch.nutrition.protein,
      patch.nutrition.fat,
      patch.nutrition.carbs,
      JSON.stringify(patch.comboItemIds),
      media?.imageUrl || patch.imageUrl || DEFAULT_PRODUCT_IMAGE,
      patch.customizable,
      patch.featured,
      patch.sortOrder,
      patch.status,
      media?.originalName || "",
      media?.mimeType || "",
      media?.sizeBytes || 0,
      media?.width || 0,
      media?.height || 0,
      cleanText(createdBy, 120)
    ]
  );

  const catalog = await readCatalog({ includePrivate: true });
  return catalog.products.find((product) => product.id === result.rows[0].id);
}

export async function updateCatalogProduct(productId, { file, body = {}, createdBy = "Админка" }) {
  const currentResult = await pool.query("select * from catalog_products where id = $1", [productId]);
  if (!currentResult.rowCount) throw makeError("Товар не найден", 404);

  const current = currentResult.rows[0];
  const patch = buildProductPatch(body, current);
  if (!patch.categoryId) throw makeError("Выберите категорию товара", 400);

  let media = null;
  if (file) {
    media = await compressCatalogImage(file, productId);
  }

  const result = await pool.query(
    `
      update catalog_products
      set category_id = $2,
          name = $3,
          description = $4,
          weight = $5,
          price = $6,
          old_price = $7,
          badges = $8::jsonb,
          ingredients = $9::jsonb,
          calories = $10,
          protein = $11,
          fat = $12,
          carbs = $13,
          combo_item_ids = $14::jsonb,
          image_url = $15,
          customizable = $16,
          featured = $17,
          sort_order = $18,
          status = $19,
          original_name = $20,
          mime_type = $21,
          size_bytes = $22,
          width = $23,
          height = $24,
          created_by = $25,
          archived_at = case when $19 = 'archived' then coalesce(archived_at, now()) else null end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      productId,
      patch.categoryId,
      patch.name,
      patch.description,
      patch.weight,
      patch.price,
      patch.oldPrice,
      JSON.stringify(patch.badges),
      JSON.stringify(patch.ingredients),
      patch.nutrition.calories,
      patch.nutrition.protein,
      patch.nutrition.fat,
      patch.nutrition.carbs,
      JSON.stringify(patch.comboItemIds),
      media?.imageUrl || patch.imageUrl || DEFAULT_PRODUCT_IMAGE,
      patch.customizable,
      patch.featured,
      patch.sortOrder,
      patch.status,
      media?.originalName || current.original_name || "",
      media?.mimeType || current.mime_type || "",
      media?.sizeBytes || current.size_bytes || 0,
      media?.width || current.width || 0,
      media?.height || current.height || 0,
      cleanText(createdBy, 120)
    ]
  );

  const catalog = await readCatalog({ includePrivate: true });
  return catalog.products.find((product) => product.id === result.rows[0].id);
}

export async function saveCatalogProductVideo(productId, { file, createdBy = "Админка" }) {
  const currentResult = await pool.query("select * from catalog_products where id = $1", [productId]);
  if (!currentResult.rowCount) throw makeError("Товар не найден", 404);
  if (!file) throw makeError("Выберите видео товара", 400);

  const media = await processCatalogVideo(file, productId);
  const result = await pool.query(
    `
      update catalog_products
      set video_url = $2,
          video_original_name = $3,
          video_mime_type = $4,
          video_size_bytes = $5,
          created_by = $6,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      productId,
      media.videoUrl,
      media.originalName,
      media.mimeType,
      media.sizeBytes,
      cleanText(createdBy, 120)
    ]
  );

  const catalog = await readCatalog({ includePrivate: true });
  const product = catalog.products.find((item) => item.id === result.rows[0].id);
  return {
    product,
    warning: media.processingWarning || ""
  };
}

export async function removeCatalogProductVideo(productId, { createdBy = "Админка" } = {}) {
  const result = await pool.query(
    `
      update catalog_products
      set video_url = null,
          video_original_name = null,
          video_mime_type = null,
          video_size_bytes = null,
          created_by = $2,
          updated_at = now()
      where id = $1
      returning *
    `,
    [productId, cleanText(createdBy, 120)]
  );

  if (!result.rowCount) throw makeError("Товар не найден", 404);
  const catalog = await readCatalog({ includePrivate: true });
  return catalog.products.find((product) => product.id === result.rows[0].id);
}

export async function archiveCatalogProduct(productId) {
  const result = await pool.query(
    `
      update catalog_products
      set status = 'archived',
          archived_at = now(),
          updated_at = now()
      where id = $1
      returning *
    `,
    [productId]
  );

  if (!result.rowCount) throw makeError("Товар не найден", 404);
  const catalog = await readCatalog({ includePrivate: true });
  return catalog.products.find((product) => product.id === productId);
}
