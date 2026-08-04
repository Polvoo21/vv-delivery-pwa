import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";

export const MAX_REVIEW_PHOTOS = 3;
const MAX_REVIEW_PHOTO_BYTES = 250 * 1024;
const MAX_REVIEW_TEXT_LENGTH = 1000;
const MAX_REVIEW_GUEST_NAME_LENGTH = 80;
const REVIEW_UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "reviews");
const REVIEW_PUBLIC_PATH = "/uploads/reviews";

export function isDemoReviewSubmissionEnabled(env = process.env) {
  return String(env.VV_DEMO_REVIEWS || "") === "1";
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeProductId(value) {
  return String(value || "").trim();
}

function normalizeReviewText(value) {
  return String(value || "").trim().slice(0, MAX_REVIEW_TEXT_LENGTH);
}

function normalizeGuestName(value) {
  return String(value || "").trim().slice(0, MAX_REVIEW_GUEST_NAME_LENGTH);
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw makeError("Поставьте оценку от 1 до 5", 400);
  }

  return rating;
}

function orderItemMatchesProduct(item, productId) {
  if (!item || typeof item !== "object") return false;
  if (String(item.productId || item.id || "") === productId) return true;

  if (Array.isArray(item.comboItems)) {
    return item.comboItems.some((comboItem) => String(comboItem?.id || comboItem?.productId || "") === productId);
  }

  return false;
}

function getOrderItems(raw) {
  try {
    const payload = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function getOrderItemQty(item) {
  const qty = Number(item?.qty ?? item?.quantity ?? 1);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

async function getDeliveredProductCounts(productIds) {
  const ids = [...new Set((productIds || []).map(normalizeProductId).filter(Boolean))];
  if (!ids.length) return {};

  const idSet = new Set(ids);
  const counts = Object.fromEntries(ids.map((id) => [id, 0]));
  const result = await pool.query(
    `
      select raw
      from orders
      where status = 'delivered'
        and raw is not null
      order by created_at desc
      limit 50000
    `
  );

  for (const row of result.rows) {
    for (const item of getOrderItems(row.raw)) {
      const qty = getOrderItemQty(item);
      const productId = normalizeProductId(item.productId || item.id);
      if (idSet.has(productId)) {
        counts[productId] += qty;
      }

      if (Array.isArray(item.comboItems)) {
        for (const comboItem of item.comboItems) {
          const comboProductId = normalizeProductId(comboItem?.productId || comboItem?.id);
          if (idSet.has(comboProductId)) {
            counts[comboProductId] += qty;
          }
        }
      }
    }
  }

  return counts;
}

function publicPhoto(row) {
  return {
    id: row.id,
    url: row.url,
    width: Number(row.width || 0),
    height: Number(row.height || 0)
  };
}

function publicReview(row, { includePrivate = false } = {}) {
  const photos = Array.isArray(row.photos) ? row.photos.filter(Boolean).map(publicPhoto) : [];
  const review = {
    id: row.id,
    productId: row.product_id,
    rating: Number(row.rating),
    text: row.text || "",
    status: row.status,
    customerName: row.customer_name || "Гость",
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    moderatedAt: row.moderated_at,
    photos
  };

  if (includePrivate) {
    review.customerPhone = row.customer_phone || "";
    review.orderId = row.order_id || "";
  }

  return review;
}

async function findDeliveredOrderForProduct({ customer, productId, orderId }) {
  if (!customer?.id || !customer?.phone) {
    throw makeError("Войдите в личный кабинет, чтобы оставить отзыв", 401);
  }

  const params = [customer.phone];
  const orderFilter = orderId ? "and id = $2" : "";
  if (orderId) params.push(orderId);

  const result = await pool.query(
    `
      select id, raw
      from orders
      where status = 'delivered'
        and customer_phone = $1
        ${orderFilter}
      order by created_at desc
      limit 100
    `,
    params
  );

  const order = result.rows.find((row) => {
    const items = getOrderItems(row.raw);
    return items.some((item) => orderItemMatchesProduct(item, productId));
  });

  if (!order) {
    throw makeError("Оставить отзыв можно после доставленного заказа с этим товаром.", 403);
  }

  return order.id;
}

async function compressReviewPhoto(file, reviewId, index) {
  if (!file?.buffer || !String(file.mimetype || "").startsWith("image/")) {
    throw makeError("Можно загрузить только фотографии", 400);
  }

  await fs.mkdir(REVIEW_UPLOAD_DIR, { recursive: true });

  const pipeline = sharp(file.buffer, { failOn: "none" }).rotate();
  let result = null;

  for (const width of [1600, 1280, 1024, 900]) {
    for (const quality of [82, 74, 66, 58, 50, 44]) {
      const next = await pipeline
        .clone()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      result = next;
      if (next.data.length <= MAX_REVIEW_PHOTO_BYTES) {
        break;
      }
    }

    if (result?.data?.length <= MAX_REVIEW_PHOTO_BYTES) {
      break;
    }
  }

  if (!result?.data) {
    throw makeError("Не удалось обработать фотографию", 400);
  }

  const filename = `${reviewId}-${index + 1}-${Date.now().toString(36)}.jpg`;
  const filePath = path.join(REVIEW_UPLOAD_DIR, filename);
  await fs.writeFile(filePath, result.data);

  return {
    id: makeId("photo"),
    url: `${REVIEW_PUBLIC_PATH}/${filename}`,
    originalName: file.originalname || "",
    mimeType: "image/jpeg",
    sizeBytes: result.data.length,
    width: result.info.width,
    height: result.info.height
  };
}

export async function getProductReviewSummary(productIds) {
  const ids = [...new Set((productIds || []).map(normalizeProductId).filter(Boolean))].slice(0, 300);
  if (!ids.length) return {};

  const [result, deliveredCounts] = await Promise.all([
    pool.query(
      `
        select product_id, round(avg(rating)::numeric, 1) as average, count(*)::int as count
        from product_reviews
        where status = 'approved'
          and product_id = any($1::text[])
        group by product_id
      `,
      [ids]
    ),
    getDeliveredProductCounts(ids)
  ]);

  return Object.fromEntries(
    ids.map((id) => {
      const row = result.rows.find((item) => item.product_id === id);
      return [
        id,
        {
          productId: id,
          average: row ? Number(row.average || 0) : 0,
          count: row ? Number(row.count || 0) : 0,
          orderedCount: Number(deliveredCounts[id] || 0)
        }
      ];
    })
  );
}

export async function listProductReviews(productId) {
  const normalizedProductId = normalizeProductId(productId);
  if (!normalizedProductId) {
    throw makeError("Товар не найден", 404);
  }

  const summary = (await getProductReviewSummary([normalizedProductId]))[normalizedProductId] || {
    productId: normalizedProductId,
    average: 0,
    count: 0,
    orderedCount: 0
  };

  const result = await pool.query(
    `
      select
        r.*,
        coalesce(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.url,
              'width', p.width,
              'height', p.height
            )
            order by p.created_at
          ) filter (where p.id is not null),
          '[]'::json
        ) as photos
      from product_reviews r
      left join product_review_photos p on p.review_id = r.id
      where r.product_id = $1
        and r.status = 'approved'
      group by r.id
      order by r.created_at desc
      limit 50
    `,
    [normalizedProductId]
  );

  return {
    summary,
    reviews: result.rows.map(publicReview)
  };
}

export async function createProductReview({
  customer,
  productId,
  orderId,
  rating,
  text,
  guestName,
  files = [],
  demoMode = false
}) {
  const normalizedProductId = normalizeProductId(productId);
  if (!normalizedProductId) {
    throw makeError("Товар не найден", 404);
  }

  const normalizedRating = normalizeRating(rating);
  const normalizedText = normalizeReviewText(text);
  const limitedFiles = Array.isArray(files) ? files.slice(0, MAX_REVIEW_PHOTOS) : [];
  const matchedOrderId = demoMode
    ? null
    : await findDeliveredOrderForProduct({
        customer,
        productId: normalizedProductId,
        orderId: orderId ? String(orderId) : ""
      });

  if (!demoMode) {
    const duplicate = await pool.query(
      `
        select id
        from product_reviews
        where product_id = $1
          and customer_id = $2
          and order_id = $3
          and status <> 'rejected'
        limit 1
      `,
      [normalizedProductId, customer.id, matchedOrderId]
    );

    if (duplicate.rowCount) {
      throw makeError("Вы уже отправили отзыв на этот товар из этого заказа.", 409);
    }
  }

  const reviewId = makeId("review");
  const customerId = customer?.id || null;
  const customerName =
    normalizeGuestName(guestName) || normalizeGuestName(customer?.name) || (demoMode ? "Демо-гость" : "Гость");
  const customerPhone = customer?.phone || "";
  const photos = [];

  for (let index = 0; index < limitedFiles.length; index += 1) {
    photos.push(await compressReviewPhoto(limitedFiles[index], reviewId, index));
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const reviewResult = await client.query(
      `
        insert into product_reviews (
          id, product_id, customer_id, order_id, rating, text, status,
          customer_name, customer_phone, is_demo, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, now(), now())
        returning *
      `,
      [
        reviewId,
        normalizedProductId,
        customerId,
        matchedOrderId,
        normalizedRating,
        normalizedText,
        customerName,
        customerPhone,
        Boolean(demoMode)
      ]
    );

    for (const photo of photos) {
      await client.query(
        `
          insert into product_review_photos (
            id, review_id, url, original_name, mime_type, size_bytes, width, height, created_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, now())
        `,
        [
          photo.id,
          reviewId,
          photo.url,
          photo.originalName,
          photo.mimeType,
          photo.sizeBytes,
          photo.width,
          photo.height
        ]
      );
    }

    await client.query("commit");
    return publicReview({ ...reviewResult.rows[0], photos });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAdminReviews(status = "pending") {
  const allowedStatuses = new Set(["pending", "approved", "rejected", "all"]);
  const nextStatus = allowedStatuses.has(status) ? status : "pending";
  const params = [];
  const statusFilter = nextStatus === "all" ? "" : "where r.status = $1";
  if (nextStatus !== "all") params.push(nextStatus);

  const result = await pool.query(
    `
      select
        r.*,
        coalesce(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.url,
              'width', p.width,
              'height', p.height
            )
            order by p.created_at
          ) filter (where p.id is not null),
          '[]'::json
        ) as photos
      from product_reviews r
      left join product_review_photos p on p.review_id = r.id
      ${statusFilter}
      group by r.id
      order by r.created_at desc
      limit 100
    `,
    params
  );

  return result.rows.map((row) => publicReview(row, { includePrivate: true }));
}

export async function moderateReview(reviewId, { status, moderationNote = "" }) {
  const allowedStatuses = new Set(["pending", "approved", "rejected"]);
  if (!allowedStatuses.has(status)) {
    throw makeError("Некорректный статус отзыва", 400);
  }

  const result = await pool.query(
    `
      update product_reviews
      set status = $2,
          moderation_note = $3,
          moderated_at = case when $2 = 'pending' then null else now() end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [reviewId, status, String(moderationNote || "").trim()]
  );

  if (!result.rowCount) {
    throw makeError("Отзыв не найден", 404);
  }

  return publicReview({ ...result.rows[0], photos: [] }, { includePrivate: true });
}
