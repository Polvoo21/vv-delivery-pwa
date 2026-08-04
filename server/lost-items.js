import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";

export const MAX_LOST_ITEM_PHOTOS = 1;
export const MAX_LOST_ITEM_UPLOAD_BYTES = 12 * 1024 * 1024;
const STATIC_LOST_ITEM_COUNT = 70;

const MAX_LOST_ITEM_PHOTO_BYTES = 200 * 1024;
const LOST_ITEM_UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "lost-items");
const LOST_ITEM_PUBLIC_PATH = "/uploads/lost-items";

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toDateOnly(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function publicLostItem(row, { includePrivate = false } = {}) {
  const item = {
    id: row.id,
    itemNumber: Number(row.item_number || 0),
    addedAt: toDateOnly(row.added_at),
    createdAt: row.created_at,
    image: row.image_url,
    width: Number(row.width || 0),
    height: Number(row.height || 0),
    sizeBytes: Number(row.size_bytes || 0)
  };

  if (includePrivate) {
    item.archivedAt = row.archived_at || null;
    item.createdBy = row.created_by || "";
    item.originalName = row.original_name || "";
  }

  return item;
}

async function compressLostItemPhoto(file, itemId) {
  if (!file?.buffer || !String(file.mimetype || "").startsWith("image/")) {
    throw makeError("Можно загрузить только фотографию", 400);
  }

  await fs.mkdir(LOST_ITEM_UPLOAD_DIR, { recursive: true });

  const pipeline = sharp(file.buffer, { failOn: "none" }).rotate();
  let result = null;

  for (const width of [1400, 1200, 1000, 900, 800, 700, 600, 520, 480]) {
    for (const quality of [82, 76, 70, 64, 58, 52, 46, 40, 36, 32]) {
      const next = await pipeline
        .clone()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      result = next;
      if (next.data.length <= MAX_LOST_ITEM_PHOTO_BYTES) {
        break;
      }
    }

    if (result?.data?.length <= MAX_LOST_ITEM_PHOTO_BYTES) {
      break;
    }
  }

  if (!result?.data) {
    throw makeError("Не удалось обработать фотографию", 400);
  }

  if (result.data.length > MAX_LOST_ITEM_PHOTO_BYTES) {
    throw makeError("Не удалось сжать фотографию до 200 КБ. Попробуйте сделать снимок чуть ближе или при лучшем освещении.", 400);
  }

  const filename = `${itemId}-${Date.now().toString(36)}.jpg`;
  const filePath = path.join(LOST_ITEM_UPLOAD_DIR, filename);
  await fs.writeFile(filePath, result.data);

  return {
    imageUrl: `${LOST_ITEM_PUBLIC_PATH}/${filename}`,
    originalName: file.originalname || "",
    mimeType: "image/jpeg",
    sizeBytes: result.data.length,
    width: result.info.width,
    height: result.info.height
  };
}

export async function listPublicLostItems() {
  const result = await pool.query(
    `
      select *
      from lost_items
      where archived_at is null
      order by added_at desc, item_number desc, created_at desc
      limit 300
    `
  );

  return result.rows.map(publicLostItem);
}

export async function listAdminLostItems() {
  const result = await pool.query(
    `
      select *
      from lost_items
      order by item_number desc, created_at desc
      limit 300
    `
  );

  return result.rows.map((row) => publicLostItem(row, { includePrivate: true }));
}

export async function createLostItem({ file, addedAt, createdBy = "Админка" }) {
  const itemId = makeId("lost");
  const photo = await compressLostItemPhoto(file, itemId);
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("lock table lost_items in exclusive mode");

    const numberResult = await client.query(
      "select greatest($1::integer, coalesce(max(item_number), $1::integer)) + 1 as next_number from lost_items",
      [STATIC_LOST_ITEM_COUNT]
    );
    const itemNumber = Number(numberResult.rows[0]?.next_number || STATIC_LOST_ITEM_COUNT + 1);

    const result = await client.query(
      `
        insert into lost_items (
          id, item_number, image_url, original_name, mime_type, size_bytes, width, height,
          added_at, created_by, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
        returning *
      `,
      [
        itemId,
        itemNumber,
        photo.imageUrl,
        photo.originalName,
        photo.mimeType,
        photo.sizeBytes,
        photo.width,
        photo.height,
        toDateOnly(addedAt),
        String(createdBy || "Админка").trim().slice(0, 120)
      ]
    );

    await client.query("commit");
    return publicLostItem(result.rows[0], { includePrivate: true });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function archiveLostItem(itemId) {
  const result = await pool.query(
    `
      update lost_items
      set archived_at = now(),
          updated_at = now()
      where id = $1
      returning *
    `,
    [itemId]
  );

  if (!result.rowCount) {
    throw makeError("Потеряшка не найдена", 404);
  }

  return publicLostItem(result.rows[0], { includePrivate: true });
}
