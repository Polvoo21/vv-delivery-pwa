const DEMO_REVIEWS_STORAGE_KEY = "vv_demo_product_reviews_v1";
const REVIEW_STATUSES = new Set(["pending", "approved", "rejected"]);

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeStatus(value) {
  return REVIEW_STATUSES.has(value) ? value : "pending";
}

function readStoredReviews() {
  if (!canUseStorage()) return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(DEMO_REVIEWS_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStoredReviews(reviews) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function isLocalReviewDemo() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function listDemoReviews({ status = "all", productId = "" } = {}) {
  const normalizedProductId = String(productId || "").trim();
  return readStoredReviews()
    .filter((review) => !normalizedProductId || review.productId === normalizedProductId)
    .filter((review) => status === "all" || review.status === status)
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
}

export function createDemoReview({ productId, rating, text, customerName }) {
  const now = new Date().toISOString();
  const review = {
    id: `demo-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: String(productId || "").trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text: String(text || "").trim().slice(0, 1000),
    status: "pending",
    customerName: String(customerName || "").trim().slice(0, 80) || "Демо-гость",
    customerPhone: "",
    orderId: "",
    isDemo: true,
    createdAt: now,
    moderatedAt: null,
    photos: []
  };

  writeStoredReviews([review, ...readStoredReviews()]);
  return review;
}

export function updateDemoReviewStatus(reviewId, status) {
  const nextStatus = normalizeStatus(status);
  let updatedReview = null;
  const reviews = readStoredReviews().map((review) => {
    if (review.id !== reviewId) return review;

    updatedReview = {
      ...review,
      status: nextStatus,
      moderatedAt: nextStatus === "pending" ? null : new Date().toISOString()
    };
    return updatedReview;
  });

  writeStoredReviews(reviews);
  return updatedReview;
}

export function getDemoProductReviewState(productId) {
  const reviews = listDemoReviews({ productId, status: "approved" });
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return {
    summary: {
      productId: String(productId || "").trim(),
      average: Number(average.toFixed(1)),
      count: reviews.length,
      orderedCount: 0
    },
    reviews
  };
}
