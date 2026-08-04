import assert from "node:assert/strict";
import test from "node:test";
import { isDemoReviewSubmissionEnabled } from "../server/reviews.js";
import {
  createDemoReview,
  getDemoProductReviewState,
  isLocalReviewDemo,
  listDemoReviews,
  updateDemoReviewStatus
} from "../src/utils/demoReviews.js";

test("demo review submission is disabled unless explicitly enabled", () => {
  assert.equal(isDemoReviewSubmissionEnabled({}), false);
  assert.equal(isDemoReviewSubmissionEnabled({ VV_DEMO_REVIEWS: "1" }), true);
  assert.equal(isDemoReviewSubmissionEnabled({ VV_DEMO_REVIEWS: "0" }), false);
  assert.equal(isDemoReviewSubmissionEnabled({ VV_DEMO_REVIEWS: "true" }), false);
});

test("local demo reviews move through moderation and only approved reviews become public", () => {
  const storage = new Map();
  global.window = {
    location: { hostname: "localhost" },
    localStorage: {
      getItem(key) {
        return storage.get(key) || null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      }
    }
  };

  assert.equal(isLocalReviewDemo(), true);
  const review = createDemoReview({
    productId: "pizza-demo",
    rating: 5,
    text: "Очень вкусно",
    customerName: "Никита"
  });

  assert.equal(review.status, "pending");
  assert.equal(review.isDemo, true);
  assert.equal(listDemoReviews({ status: "pending" }).length, 1);
  assert.equal(getDemoProductReviewState("pizza-demo").reviews.length, 0);

  updateDemoReviewStatus(review.id, "approved");
  const publicState = getDemoProductReviewState("pizza-demo");
  assert.equal(publicState.reviews.length, 1);
  assert.equal(publicState.summary.average, 5);

  delete global.window;
});
