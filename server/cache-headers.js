import path from "node:path";

const HASHED_BUILD_ASSET = /[\\/]assets[\\/][^\\/]+-[a-z0-9_-]{8,}\.(?:css|js|woff2?)$/i;
const MEDIA_ASSET = /\.(?:avif|webp|png|jpe?g|svg|ico|woff2?)$/i;

export function getStaticCacheControl(filePath) {
  const normalizedPath = String(filePath || "");

  if (HASHED_BUILD_ASSET.test(normalizedPath)) {
    return "public, max-age=31536000, immutable";
  }

  if (MEDIA_ASSET.test(path.basename(normalizedPath))) {
    return "public, max-age=604800, stale-while-revalidate=86400";
  }

  return "no-cache";
}

export function setStaticCacheHeaders(response, filePath) {
  response.setHeader("Cache-Control", getStaticCacheControl(filePath));
}
