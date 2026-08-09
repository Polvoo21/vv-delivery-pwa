import {
  INDIVIDUAL_MASTERCLASS_PATH,
  LATEST_MASTERCLASS_PATH,
  MASTERCLASS_EVENT,
  MASTERCLASSES_PATH,
  MASTERCLASS_EVENTS
} from "./masterclass-events.js";

export const LEGAL_ROUTE_PATHS = Object.freeze([
  "/legal",
  "/legal/user-agreement",
  "/legal/offer",
  "/legal/delivery-payment",
  "/legal/privacy",
  "/legal/personal-data",
  "/legal/cookies",
  "/legal/advertising-consent",
  "/legal/e-receipts",
  "/legal/loyalty",
  "/legal/partners",
  "/legal/reviews",
  "/legal/nutrition"
]);

const PUBLIC_ROUTE_PATHS = [
  "/",
  "/gallery",
  "/dostavka",
  "/delivery-zones",
  "/lost",
  "/bez-perchatok",
  MASTERCLASSES_PATH,
  INDIVIDUAL_MASTERCLASS_PATH,
  ...MASTERCLASS_EVENTS.map((event) => event.path),
  ...LEGAL_ROUTE_PATHS
];

const APP_ROUTE_PATHS = [
  ...PUBLIC_ROUTE_PATHS,
  "/checkout",
  "/payment",
  "/account/orders",
  "/delivery",
  "/partners",
  "/admin"
];

const PUBLIC_ROUTE_SET = new Set(PUBLIC_ROUTE_PATHS);
const APP_ROUTE_SET = new Set(APP_ROUTE_PATHS);

const LEGACY_REDIRECTS = new Map([
  ["/site", "/"],
  ["/poteryashki", "/lost"],
  [LATEST_MASTERCLASS_PATH, MASTERCLASS_EVENT.path],
  ...MASTERCLASS_EVENTS.flatMap((event) =>
    event.legacyPaths.map((legacyPath) => [legacyPath, event.path])
  )
]);

function extractPathname(value = "/") {
  const source = String(value || "/");
  const queryIndex = source.search(/[?#]/);
  const pathname = queryIndex === -1 ? source : source.slice(0, queryIndex);
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function normalizeRoutePath(value = "/") {
  const pathname = extractPathname(value).replace(/\/{2,}/g, "/");
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

export function isPathWithin(pathname, routePrefix) {
  const normalizedPath = normalizeRoutePath(pathname);
  const normalizedPrefix = normalizeRoutePath(routePrefix);
  return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`);
}

export function getRouteRedirect(pathname) {
  const rawPath = extractPathname(pathname);
  const normalizedPath = normalizeRoutePath(rawPath);
  const legacyTarget = LEGACY_REDIRECTS.get(normalizedPath);

  if (isPathWithin(normalizedPath, "/site")) {
    return { status: 301, target: "/" };
  }

  if (legacyTarget) {
    return { status: 301, target: legacyTarget };
  }

  if (normalizedPath !== rawPath) {
    return { status: 308, target: normalizedPath };
  }

  return null;
}

export function isKnownPublicPath(pathname) {
  return PUBLIC_ROUTE_SET.has(normalizeRoutePath(pathname));
}

export function isKnownFrontendPath(pathname) {
  const normalizedPath = normalizeRoutePath(pathname);

  if (APP_ROUTE_SET.has(normalizedPath) || LEGACY_REDIRECTS.has(normalizedPath)) {
    return true;
  }

  if (
    isPathWithin(normalizedPath, "/account/orders") ||
    isPathWithin(normalizedPath, "/partners") ||
    isPathWithin(normalizedPath, "/admin")
  ) {
    return true;
  }

  // Эти маршруты нужны только для локального preview и остаются вне sitemap.
  return isPathWithin(normalizedPath, "/dev") || isPathWithin(normalizedPath, "/site");
}
