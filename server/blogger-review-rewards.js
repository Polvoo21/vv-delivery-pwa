import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";

export const MAX_BLOGGER_REWARD_FILES = 2;
export const MAX_BLOGGER_REWARD_UPLOAD_BYTES = 12 * 1024 * 1024;

const MAX_SCREENSHOT_BYTES = 500 * 1024;
const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads", "blogger-review-rewards");
const PUBLIC_PATH = "/uploads/blogger-review-rewards";

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanText(value, maxLength = 300) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeInstagramUrl(value) {
  let raw = cleanText(value, 500);
  if (!raw) {
    throw makeError("Укажите ссылку на Instagram-аккаунт", 400);
  }

  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw.replace(/^\/+/, "")}`;
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw makeError("Проверьте ссылку на Instagram-аккаунт", 400);
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "instagram.com" && !host.endsWith(".instagram.com")) {
    throw makeError("Нужна ссылка именно на Instagram-аккаунт", 400);
  }

  const handle = url.pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)[0]
    ?.replace(/^@/, "")
    .toLowerCase();

  if (!handle) {
    throw makeError("В ссылке не найден Instagram-аккаунт", 400);
  }

  return {
    url: `https://www.instagram.com/${handle}/`,
    handle
  };
}

function getInstagramHandle(value) {
  try {
    return new URL(String(value || "")).pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)[0]
      ?.replace(/^@/, "")
      .toLowerCase() || "";
  } catch {
    return "";
  }
}

function mapReward(row) {
  return {
    id: row.id,
    instagramUrl: row.instagram_url,
    instagramKey: getInstagramHandle(row.instagram_url),
    reviewScreenshot: row.review_screenshot_url,
    profileScreenshot: row.profile_screenshot_url,
    status: row.status,
    createdBy: row.created_by,
    createdByRole: row.created_by_role,
    createdAt: row.created_at,
    redeemedBy: row.redeemed_by || "",
    redeemedByRole: row.redeemed_by_role || "",
    redeemedAt: row.redeemed_at || null,
    updatedAt: row.updated_at
  };
}

async function compressScreenshot(file, rewardId, kind) {
  if (!file?.buffer || !String(file.mimetype || "").startsWith("image/")) {
    throw makeError("Загрузите оба скриншота в формате изображения", 400);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const pipeline = sharp(file.buffer, { failOn: "none" }).rotate();
  let result = null;

  for (const width of [1800, 1600, 1400, 1200, 1000, 900, 800]) {
    for (const quality of [84, 78, 72, 66, 60, 54, 48]) {
      const next = await pipeline
        .clone()
        .resize({ width, height: 2200, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer({ resolveWithObject: true });

      result = next;
      if (next.data.length <= MAX_SCREENSHOT_BYTES) {
        break;
      }
    }

    if (result?.data?.length <= MAX_SCREENSHOT_BYTES) {
      break;
    }
  }

  if (!result?.data) {
    throw makeError("Не удалось обработать скриншот", 400);
  }

  if (result.data.length > MAX_SCREENSHOT_BYTES) {
    throw makeError("Скриншот слишком большой. Сделайте снимок без лишних полей экрана.", 400);
  }

  const filename = `${rewardId}-${kind}-${Date.now().toString(36)}.webp`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), result.data);

  return {
    url: `${PUBLIC_PATH}/${filename}`,
    filePath: path.join(UPLOAD_DIR, filename)
  };
}

async function removeFiles(files) {
  await Promise.all(
    files.filter(Boolean).map((filePath) => fs.unlink(filePath).catch(() => {}))
  );
}

export async function listBloggerReviewRewards() {
  const result = await pool.query(`
    select *
    from blogger_review_rewards
    order by
      case when status = 'pending' then 0 else 1 end,
      created_at desc
    limit 1000
  `);

  return result.rows.map(mapReward);
}

export async function createBloggerReviewReward({ body, files, actor }) {
  const instagram = normalizeInstagramUrl(body?.instagramUrl);
  const rewardId = makeId("blogger_reward");
  const reviewFile = files?.reviewScreenshot?.[0];
  const profileFile = files?.profileScreenshot?.[0];
  let reviewScreenshot;
  let profileScreenshot;

  try {
    [reviewScreenshot, profileScreenshot] = await Promise.all([
      compressScreenshot(reviewFile, rewardId, "review"),
      compressScreenshot(profileFile, rewardId, "profile")
    ]);

    const result = await pool.query(
      `
        insert into blogger_review_rewards (
          id, instagram_url,
          review_screenshot_url, profile_screenshot_url,
          status, created_by, created_by_role, created_at, updated_at
        )
        values ($1, $2, $3, $4, 'pending', $5, $6, now(), now())
        returning *
      `,
      [
        rewardId,
        instagram.url,
        reviewScreenshot.url,
        profileScreenshot.url,
        cleanText(actor?.label || actor?.login || "Сотрудник", 120),
        cleanText(actor?.role || "admin", 40)
      ]
    );

    return mapReward(result.rows[0]);
  } catch (error) {
    await removeFiles([reviewScreenshot?.filePath, profileScreenshot?.filePath]);

    if (error.code === "23505") {
      throw makeError("Этот Instagram-аккаунт уже есть в учёте. Найдите его через поиск.", 409);
    }

    throw error;
  }
}

export async function updateBloggerReviewRewardStatus(rewardId, status, actor) {
  if (!["pending", "redeemed"].includes(status)) {
    throw makeError("Неизвестный статус выдачи", 400);
  }

  const isRedeemed = status === "redeemed";
  const result = await pool.query(
    `
      update blogger_review_rewards
      set status = $2,
          redeemed_at = case when $3::boolean then now() else null end,
          redeemed_by = case when $3::boolean then $4 else null end,
          redeemed_by_role = case when $3::boolean then $5 else null end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      rewardId,
      status,
      isRedeemed,
      cleanText(actor?.label || actor?.login || "Сотрудник", 120),
      cleanText(actor?.role || "admin", 40)
    ]
  );

  if (!result.rowCount) {
    throw makeError("Карточка блогера не найдена", 404);
  }

  return mapReward(result.rows[0]);
}
