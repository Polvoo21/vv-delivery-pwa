import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";

export const MAX_GALLERY_MEDIA_FILES = 1;
export const MAX_GALLERY_UPLOAD_BYTES = 14 * 1024 * 1024;

const GALLERY_UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "gallery");
const GALLERY_PUBLIC_PATH = "/uploads/gallery";
const DEFAULT_VIDEO_POSTER = "/assets/site/concept-pizza-oven.jpg";
const VALID_TYPES = new Set(["photo", "video"]);
const VALID_ORIENTATIONS = new Set(["landscape", "portrait", "square", "video"]);
const VALID_STATUSES = new Set(["active", "archived"]);

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanText(value, maxLength = 180) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeType(value) {
  const type = cleanText(value, 20).toLowerCase();
  return VALID_TYPES.has(type) ? type : "photo";
}

function normalizeOrientation(value, fallback = "landscape") {
  const orientation = cleanText(value, 20).toLowerCase();
  return VALID_ORIENTATIONS.has(orientation) ? orientation : fallback;
}

function normalizeStatus(value) {
  const status = cleanText(value, 20).toLowerCase();
  return VALID_STATUSES.has(status) ? status : "active";
}

function normalizeSortOrder(value, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(-9999, Math.min(9999, Math.round(next)));
}

function inferOrientation(width, height, fallback = "landscape") {
  if (!width || !height) return fallback;
  const ratio = width / height;
  if (ratio < 0.78) return "portrait";
  if (ratio > 1.25) return "landscape";
  return "square";
}

function normalizeVideoUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch {
    throw makeError("Укажите полную ссылку на видео, например https://kinescope.io/embed/...", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw makeError("Ссылка на видео должна начинаться с https://", 400);
  }

  if (parsed.hostname.endsWith("kinescope.io") && !parsed.pathname.includes("/embed/")) {
    const videoId = parsed.pathname.split("/").filter(Boolean).pop();
    if (videoId) {
      return `https://kinescope.io/embed/${videoId}`;
    }
  }

  return parsed.toString();
}

function publicGalleryItem(row, { includePrivate = false } = {}) {
  const item = {
    id: row.id,
    type: row.type || "photo",
    title: row.title || "",
    caption: row.caption || "",
    image: row.image_url || row.poster_url || "",
    poster: row.poster_url || row.image_url || DEFAULT_VIDEO_POSTER,
    videoUrl: row.video_url || "",
    orientation: row.orientation || "landscape",
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (includePrivate) {
    item.status = row.status || "active";
    item.archivedAt = row.archived_at || null;
    item.createdBy = row.created_by || "";
    item.originalName = row.original_name || "";
    item.mimeType = row.mime_type || "";
    item.sizeBytes = Number(row.size_bytes || 0);
    item.width = Number(row.width || 0);
    item.height = Number(row.height || 0);
  }

  return item;
}

async function compressGalleryImage(file, itemId, kind = "image") {
  if (!file?.buffer || !String(file.mimetype || "").startsWith("image/")) {
    throw makeError("Можно загрузить только изображение", 400);
  }

  await fs.mkdir(GALLERY_UPLOAD_DIR, { recursive: true });

  const result = await sharp(file.buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  if (!result?.data?.length) {
    throw makeError("Не удалось обработать изображение", 400);
  }

  const filename = `${itemId}-${kind}-${Date.now().toString(36)}.webp`;
  await fs.writeFile(path.join(GALLERY_UPLOAD_DIR, filename), result.data);

  return {
    url: `${GALLERY_PUBLIC_PATH}/${filename}`,
    originalName: file.originalname || "",
    mimeType: "image/webp",
    sizeBytes: result.data.length,
    width: result.info.width,
    height: result.info.height
  };
}

async function getNextSortOrder() {
  const result = await pool.query("select coalesce(max(sort_order), 0) + 10 as next_order from site_gallery_items");
  return Number(result.rows[0]?.next_order || 10);
}

export async function listPublicGalleryItems() {
  const result = await pool.query(
    `
      select *
      from site_gallery_items
      where status = 'active'
        and archived_at is null
      order by sort_order asc, created_at desc
      limit 80
    `
  );

  return result.rows.map(publicGalleryItem);
}

export async function listAdminGalleryItems() {
  const result = await pool.query(
    `
      select *
      from site_gallery_items
      order by
        case when status = 'active' and archived_at is null then 0 else 1 end,
        sort_order asc,
        created_at desc
      limit 160
    `
  );

  return result.rows.map((row) => publicGalleryItem(row, { includePrivate: true }));
}

export async function createGalleryItem({ file, body = {}, createdBy = "Админка" }) {
  const itemId = makeId("gallery");
  const type = normalizeType(body.type);
  const title = cleanText(body.title, 120);
  const caption = cleanText(body.caption, 220);
  const requestedOrientation = normalizeOrientation(body.orientation, type === "video" ? "video" : "landscape");
  const sortOrder = body.sortOrder === undefined || body.sortOrder === "" ? await getNextSortOrder() : normalizeSortOrder(body.sortOrder);
  let image = null;
  let poster = null;
  let videoUrl = "";
  let orientation = requestedOrientation;

  if (type === "photo") {
    if (!file) {
      throw makeError("Загрузите фотографию для галереи", 400);
    }

    image = await compressGalleryImage(file, itemId, "photo");
    if (!body.orientation) {
      orientation = inferOrientation(image.width, image.height, "landscape");
    }
  }

  if (type === "video") {
    videoUrl = normalizeVideoUrl(body.videoUrl);
    if (!videoUrl) {
      throw makeError("Укажите ссылку на видео", 400);
    }

    if (file) {
      poster = await compressGalleryImage(file, itemId, "poster");
      if (!body.orientation) {
        orientation = "video";
      }
    }
  }

  const result = await pool.query(
    `
      insert into site_gallery_items (
        id, type, title, caption, image_url, poster_url, video_url, orientation,
        sort_order, status, original_name, mime_type, size_bytes, width, height,
        created_by, created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11, $12, $13, $14, $15, now(), now())
      returning *
    `,
    [
      itemId,
      type,
      title,
      caption,
      image?.url || "",
      poster?.url || "",
      videoUrl,
      orientation,
      sortOrder,
      image?.originalName || poster?.originalName || "",
      image?.mimeType || poster?.mimeType || "",
      image?.sizeBytes || poster?.sizeBytes || 0,
      image?.width || poster?.width || 0,
      image?.height || poster?.height || 0,
      cleanText(createdBy, 120)
    ]
  );

  return publicGalleryItem(result.rows[0], { includePrivate: true });
}

export async function updateGalleryItem(itemId, { file, body = {}, createdBy = "Админка" }) {
  const currentResult = await pool.query("select * from site_gallery_items where id = $1", [itemId]);
  if (!currentResult.rowCount) {
    throw makeError("Материал галереи не найден", 404);
  }

  const current = currentResult.rows[0];
  const nextType = body.type ? normalizeType(body.type) : current.type || "photo";
  const patch = {
    type: nextType,
    title: body.title !== undefined ? cleanText(body.title, 120) : current.title || "",
    caption: body.caption !== undefined ? cleanText(body.caption, 220) : current.caption || "",
    orientation:
      body.orientation !== undefined
        ? normalizeOrientation(body.orientation, nextType === "video" ? "video" : "landscape")
        : current.orientation || "landscape",
    sortOrder:
      body.sortOrder !== undefined ? normalizeSortOrder(body.sortOrder, current.sort_order || 0) : Number(current.sort_order || 0),
    status: body.status !== undefined ? normalizeStatus(body.status) : current.status || "active",
    imageUrl: current.image_url || "",
    posterUrl: current.poster_url || "",
    videoUrl: current.video_url || "",
    originalName: current.original_name || "",
    mimeType: current.mime_type || "",
    sizeBytes: Number(current.size_bytes || 0),
    width: Number(current.width || 0),
    height: Number(current.height || 0)
  };

  if (body.videoUrl !== undefined) {
    patch.videoUrl = nextType === "video" ? normalizeVideoUrl(body.videoUrl) : "";
  }

  if (file) {
    const media = await compressGalleryImage(file, itemId, nextType === "video" ? "poster" : "photo");
    if (nextType === "video") {
      patch.posterUrl = media.url;
    } else {
      patch.imageUrl = media.url;
    }
    patch.originalName = media.originalName;
    patch.mimeType = media.mimeType;
    patch.sizeBytes = media.sizeBytes;
    patch.width = media.width;
    patch.height = media.height;
    if (body.orientation === undefined && nextType === "photo") {
      patch.orientation = inferOrientation(media.width, media.height, patch.orientation);
    }
  }

  if (nextType === "photo" && !patch.imageUrl) {
    throw makeError("Для фото нужен файл изображения", 400);
  }

  if (nextType === "video" && !patch.videoUrl) {
    throw makeError("Для видео нужна ссылка", 400);
  }

  const result = await pool.query(
    `
      update site_gallery_items
      set type = $2,
          title = $3,
          caption = $4,
          image_url = $5,
          poster_url = $6,
          video_url = $7,
          orientation = $8,
          sort_order = $9,
          status = $10,
          original_name = $11,
          mime_type = $12,
          size_bytes = $13,
          width = $14,
          height = $15,
          created_by = $16,
          archived_at = case when $10 = 'archived' then coalesce(archived_at, now()) else null end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      itemId,
      patch.type,
      patch.title,
      patch.caption,
      patch.imageUrl,
      patch.posterUrl,
      patch.videoUrl,
      patch.orientation,
      patch.sortOrder,
      patch.status,
      patch.originalName,
      patch.mimeType,
      patch.sizeBytes,
      patch.width,
      patch.height,
      cleanText(createdBy, 120)
    ]
  );

  return publicGalleryItem(result.rows[0], { includePrivate: true });
}

export async function archiveGalleryItem(itemId) {
  const result = await pool.query(
    `
      update site_gallery_items
      set status = 'archived',
          archived_at = now(),
          updated_at = now()
      where id = $1
      returning *
    `,
    [itemId]
  );

  if (!result.rowCount) {
    throw makeError("Материал галереи не найден", 404);
  }

  return publicGalleryItem(result.rows[0], { includePrivate: true });
}
