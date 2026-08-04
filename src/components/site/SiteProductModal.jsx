import { ChevronLeft, ImagePlus, Info, Maximize2, Minimize2, Minus, Plus, ShoppingBag, Star, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, getProductOldPrice } from "../../utils/price";
import { apiPath } from "../../utils/api";
import {
  createDemoReview,
  getDemoProductReviewState,
  isLocalReviewDemo
} from "../../utils/demoReviews";
import { formatOrdersCount, getProductSocialProof } from "../../utils/socialProof";
import { TEST_CARD_IMAGE } from "./siteData";

const BASE_LINE_ID = "base";
const ARE_ADDONS_IN_DEVELOPMENT = true;

const TEST_TASTE_ADDONS = Array.from({ length: 8 }, (_, index) => ({
  id: `mozzarella-${index + 1}`,
  name: "Моцарелла",
  weight: "35 г",
  price: 125,
  image: TEST_CARD_IMAGE
}));

function getProductMeta(product) {
  if (product.category === "combo") {
    return product.weight || "набор";
  }

  if (product.category === "pizza") {
    return product.weight || "1 пицца";
  }

  return product.weight || "1 порция";
}

function getProductIngredients(product) {
  if (Array.isArray(product?.ingredients) && product.ingredients.length) {
    return product.ingredients.filter(Boolean);
  }

  return [];
}

function getProductComposition(product) {
  const ingredients = getProductIngredients(product);

  if (ingredients.length) {
    return ingredients.join(", ");
  }

  return product.description || "Состав уточним перед финальным запуском меню.";
}

function formatCompositionText(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "Состав: уточним перед финальным запуском меню.";
  }

  return /^состав\s*:/i.test(text) ? text : `Состав: ${text}`;
}

function getProductNutrition(product) {
  const nutrition = product?.nutrition || {};
  const values = {
    calories: nutrition.calories ?? product?.calories,
    protein: nutrition.protein ?? product?.protein,
    fat: nutrition.fat ?? product?.fat,
    carbs: nutrition.carbs ?? product?.carbs
  };

  return Object.values(values).some((value) => value !== null && value !== undefined && value !== "")
    ? values
    : null;
}

function formatNutritionValue(value, suffix = "") {
  const number = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(number)) return "уточняется";
  const formatted = Number.isInteger(number) ? String(number) : number.toFixed(1).replace(".", ",");
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function getProductImage(product) {
  return product?.image || product?.visual?.image || TEST_CARD_IMAGE;
}

function getLineId(productId, index = 0) {
  return `${productId || "item"}-${index}`;
}

function getSelectedAddons(lineId, addonCounts) {
  return TEST_TASTE_ADDONS
    .map((addon) => ({ ...addon, qty: Number(addonCounts[`${lineId}:${addon.id}`] || 0) }))
    .filter((addon) => addon.qty > 0);
}

function getAddonTotal(addons) {
  return addons.reduce((sum, addon) => sum + addon.price * addon.qty, 0);
}

function getRemovedForLine(lineId, removedIngredients) {
  return Array.isArray(removedIngredients[lineId]) ? removedIngredients[lineId] : [];
}

function formatReviewDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function renderStars(value, className = "") {
  const rating = Math.max(0, Math.min(5, Number(value || 0)));

  return (
    <span className={`site-product-review-stars ${className}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          fill={index < Math.round(rating) ? "currentColor" : "none"}
          key={index}
          size={15}
          strokeWidth={2.4}
        />
      ))}
    </span>
  );
}

function canShowPreviewReviews() {
  if (typeof window === "undefined") return false;

  return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}

function getPreviewReviews(product) {
  if (!canShowPreviewReviews()) return [];

  const image = product?.image || TEST_CARD_IMAGE;

  return [
    {
      id: `${product?.id || "product"}-preview-review-1`,
      customerName: "Анна",
      rating: 5,
      createdAt: "2026-07-04T10:30:00.000Z",
      text: "Заказывали домой, приехало горячим. Тесто мягкое, бортик румяный, ребенку тоже понравилось.",
      photos: [{ id: "preview-photo-1", url: image, alt: "Фото блюда в отзыве" }]
    },
    {
      id: `${product?.id || "product"}-preview-review-2`,
      customerName: "Максим",
      rating: 5,
      createdAt: "2026-07-02T17:20:00.000Z",
      text: "Понятный вкус без лишней тяжести. Хороший вариант для семейного ужина.",
      photos: [{ id: "preview-photo-2", url: TEST_CARD_IMAGE, alt: "Фото блюда от гостя" }]
    },
    {
      id: `${product?.id || "product"}-preview-review-3`,
      customerName: "Екатерина",
      rating: 4,
      createdAt: "2026-06-28T13:05:00.000Z",
      text: "Взяли на обед, порция сытная. В следующий раз попробуем добавить допы, когда они появятся.",
      photos: []
    }
  ];
}

function getAverageReviewRating(reviews) {
  if (!reviews.length) return 0;

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return total / reviews.length;
}

function formatReviewCount(count) {
  const value = Math.max(0, Number(count) || 0);
  const mod10 = value % 10;
  const mod100 = value % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "отзыв"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "отзыва"
        : "отзывов";
  return `${value} ${word}`;
}

export function SiteProductModal({ product, customer, onClose, onAddToCart }) {
  const [addonCounts, setAddonCounts] = useState({});
  const [removedIngredients, setRemovedIngredients] = useState({});
  const [activeComboIndex, setActiveComboIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [activeMedia, setActiveMedia] = useState("image");
  const [isProductImageFullscreen, setIsProductImageFullscreen] = useState(false);
  const [isProductVideoFullscreen, setIsProductVideoFullscreen] = useState(false);
  const [isProductVideoReady, setIsProductVideoReady] = useState(false);
  const [isFullscreenVideoReady, setIsFullscreenVideoReady] = useState(false);
  const [reviewState, setReviewState] = useState({
    summary: { average: 0, count: 0, orderedCount: 0 },
    reviews: []
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewGuestName, setReviewGuestName] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDemoEnabled, setReviewDemoEnabled] = useState(isLocalReviewDemo);
  const [activeReviewPhoto, setActiveReviewPhoto] = useState(null);
  const productVideoUrl = product?.videoUrl || product?.video?.url || "";
  const nutrition = getProductNutrition(product);

  useEffect(() => {
    setAddonCounts({});
    setRemovedIngredients({});
    setActiveComboIndex(null);
    setActiveTab("details");
    setActiveMedia("image");
    setIsProductImageFullscreen(false);
    setIsProductVideoFullscreen(false);
    setIsProductVideoReady(false);
    setIsFullscreenVideoReady(false);
    setReviewState({
      summary: { average: 0, count: 0, orderedCount: 0 },
      reviews: []
    });
    setReviewRating(5);
    setReviewText("");
    setReviewGuestName("");
    setReviewPhotos([]);
    setReviewStatus("");
    setReviewError("");
    setActiveReviewPhoto(null);
  }, [product?.id]);

  useEffect(() => {
    if (activeMedia === "video") {
      setIsProductVideoReady(false);
    }
  }, [activeMedia, productVideoUrl]);

  useEffect(() => {
    if (!product?.id) return undefined;

    if (isLocalReviewDemo()) {
      setReviewDemoEnabled(true);
      setReviewState(getDemoProductReviewState(product.id));
      setReviewsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setReviewsLoading(true);

    fetch(`${apiPath("productReviews")}/${encodeURIComponent(product.id)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.ok !== false) {
          setReviewDemoEnabled(Boolean(data.demoSubmissionEnabled));
          setReviewState({
            summary: data.summary || { average: 0, count: 0 },
            reviews: data.reviews || []
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewState({ summary: { average: 0, count: 0, orderedCount: 0 }, reviews: [] });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (!isProductVideoFullscreen && !isProductImageFullscreen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProductVideoFullscreen(false);
        setIsProductImageFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProductImageFullscreen, isProductVideoFullscreen]);

  const comboLines = useMemo(
    () =>
      Array.isArray(product?.comboItems)
        ? product.comboItems.map((comboProduct, index) => ({
            lineId: getLineId(comboProduct.id, index),
            product: comboProduct
          }))
        : [],
    [product]
  );

  const isCombo = product?.category === "combo" && comboLines.length > 0;
  const selectedMainAddons = useMemo(() => getSelectedAddons(BASE_LINE_ID, addonCounts), [addonCounts]);
  const comboCustomizations = useMemo(
    () =>
      comboLines.map((line) => ({
        id: line.product.id,
        lineId: line.lineId,
        name: line.product.name,
        weight: getProductMeta(line.product),
        removed: getRemovedForLine(line.lineId, removedIngredients),
        addons: getSelectedAddons(line.lineId, addonCounts)
      })),
    [addonCounts, comboLines, removedIngredients]
  );

  if (!product) return null;

  const productMeta = getProductMeta(product);
  const composition = getProductComposition(product);
  const mainIngredients = getProductIngredients(product);
  const mainRemoved = getRemovedForLine(BASE_LINE_ID, removedIngredients);
  const comboAddonTotal = comboCustomizations.reduce((sum, customization) => sum + getAddonTotal(customization.addons), 0);
  const unitPrice = Number(product.price || 0) + (isCombo ? comboAddonTotal : getAddonTotal(selectedMainAddons));
  const oldProductPrice = getProductOldPrice(product);
  const oldUnitPrice = oldProductPrice ? oldProductPrice + Math.max(0, unitPrice - Number(product.price || 0)) : 0;
  const activeComboLine =
    Number.isInteger(activeComboIndex) && comboLines[activeComboIndex] ? comboLines[activeComboIndex] : null;
  const { orderedCount } = getProductSocialProof(product, reviewState.summary);
  const approvedReviews = Array.isArray(reviewState.reviews) ? reviewState.reviews : [];
  const previewReviews = approvedReviews.length ? [] : getPreviewReviews(product);
  const visibleReviews = approvedReviews.length ? approvedReviews : previewReviews;
  const reviewCount = approvedReviews.length
    ? Number(reviewState.summary?.count || approvedReviews.length)
    : visibleReviews.length;
  const reviewAverage = approvedReviews.length
    ? Number(reviewState.summary?.average || getAverageReviewRating(approvedReviews))
    : getAverageReviewRating(visibleReviews);

  const handleReviewPhotoChange = (event) => {
    const files = Array.from(event.target.files || [])
      .filter((file) => String(file.type || "").startsWith("image/"))
      .slice(0, 3);
    setReviewPhotos(files);
    setReviewError("");
    setReviewStatus("");
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!customer && !reviewDemoEnabled) {
      setReviewError("Войдите в личный кабинет, чтобы оставить отзыв после заказа.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewStatus("");

    try {
      const formData = new FormData();
      formData.append("rating", String(reviewRating));
      formData.append("text", reviewText);
      formData.append("guestName", reviewGuestName);
      reviewPhotos.slice(0, 3).forEach((file) => formData.append("photos", file));

      if (isLocalReviewDemo()) {
        createDemoReview({
          productId: product.id,
          rating: reviewRating,
          text: reviewText,
          customerName: reviewGuestName || customer?.name
        });
        setReviewRating(5);
        setReviewText("");
        setReviewGuestName("");
        setReviewPhotos([]);
        setReviewStatus(
          reviewPhotos.length
            ? "Спасибо, отзыв отправлен на модерацию. В локальном демо фото не сохраняется."
            : "Спасибо, отзыв отправлен на модерацию."
        );
        form.reset();
        return;
      }

      const response = await fetch(`${apiPath("productReviews")}/${encodeURIComponent(product.id)}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Не удалось отправить отзыв");
      }

      setReviewRating(5);
      setReviewText("");
      setReviewGuestName("");
      setReviewPhotos([]);
      setReviewStatus("Спасибо, отзыв отправлен на модерацию.");
      form.reset();
    } catch (error) {
      setReviewError(error.message || "Не удалось отправить отзыв");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const changeAddonQty = (lineId, addonId, delta) => {
    setAddonCounts((current) => {
      const countKey = `${lineId}:${addonId}`;
      const nextQty = Math.max(0, Number(current[countKey] || 0) + delta);
      return { ...current, [countKey]: nextQty };
    });
  };

  const toggleRemovedIngredient = (lineId, ingredient) => {
    setRemovedIngredients((current) => {
      const lineRemoved = getRemovedForLine(lineId, current);
      const nextLineRemoved = lineRemoved.includes(ingredient)
        ? lineRemoved.filter((item) => item !== ingredient)
        : [...lineRemoved, ingredient];

      return { ...current, [lineId]: nextLineRemoved };
    });
  };

  const resetLine = (lineId) => {
    setRemovedIngredients((current) => ({ ...current, [lineId]: [] }));
    setAddonCounts((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${lineId}:`)))
    );
  };

  const addToCart = () => {
    const baseCartItem = {
      uid: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId: product.id,
      category: product.category,
      name: product.name,
      description: product.description,
      image: getProductImage(product),
      visual: product.visual,
      qty: 1,
      unitPrice,
      weight: productMeta,
      productSnapshot: product
    };

    if (isCombo) {
      onAddToCart({
        ...baseCartItem,
        comboItems: comboLines.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          weight: getProductMeta(line.product)
        })),
        customizations: comboCustomizations.filter(
          (customization) => customization.removed.length || customization.addons.length
        ),
        addons: [],
        removed: []
      });
      return;
    }

    onAddToCart({
      ...baseCartItem,
      addons: selectedMainAddons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        weight: addon.weight,
        price: addon.price,
        qty: addon.qty
      })),
      removed: mainRemoved
    });
  };

  const renderIngredientControls = (lineId, ingredients) => {
    if (!ingredients.length) return null;

    const removed = getRemovedForLine(lineId, removedIngredients);

    return (
      <section className="site-product-remove-section" aria-label="Ингредиенты, которые можно удалить">
        <h3>Можно удалить</h3>
        <div className="site-product-remove-list">
          {ingredients.map((ingredient) => {
            const isRemoved = removed.includes(ingredient);
            return (
              <button
                className={`site-product-remove-chip ${isRemoved ? "is-removed" : ""}`}
                type="button"
                key={ingredient}
                onClick={() => toggleRemovedIngredient(lineId, ingredient)}
              >
                {ingredient}
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderAddonGrid = (lineId) => (
    <section className="site-product-addon-section" aria-labelledby={`site-product-addon-title-${lineId}`}>
      <h3 id={`site-product-addon-title-${lineId}`}>Добавить по вкусу</h3>
      <div className="site-product-addon-grid">
        {TEST_TASTE_ADDONS.map((addon) => {
          const qty = Number(addonCounts[`${lineId}:${addon.id}`] || 0);
          return (
            <div
              className={`site-product-addon-card ${qty > 0 ? "is-selected" : ""}${
                ARE_ADDONS_IN_DEVELOPMENT ? " is-disabled" : ""
              }`}
              key={addon.id}
              role="button"
              tabIndex={ARE_ADDONS_IN_DEVELOPMENT ? -1 : 0}
              aria-disabled={ARE_ADDONS_IN_DEVELOPMENT}
              onClick={() => {
                if (!ARE_ADDONS_IN_DEVELOPMENT) {
                  changeAddonQty(lineId, addon.id, 1);
                }
              }}
              onKeyDown={(event) => {
                if (ARE_ADDONS_IN_DEVELOPMENT) {
                  return;
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  changeAddonQty(lineId, addon.id, 1);
                }
              }}
            >
              <img src={addon.image} alt="" loading="lazy" />
              <span>{addon.name}</span>
              <small>+{addon.weight}</small>
              <b>{formatPrice(addon.price)} ₽</b>
              {ARE_ADDONS_IN_DEVELOPMENT ? (
                <em>в разработке</em>
              ) : null}
              {!ARE_ADDONS_IN_DEVELOPMENT && qty > 0 ? (
                <span className="site-product-addon-qty" aria-label={`${addon.name}: ${qty}`}>
                  <button
                    type="button"
                    aria-label="Уменьшить"
                    onClick={(event) => {
                      event.stopPropagation();
                      changeAddonQty(lineId, addon.id, -1);
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <strong>{qty}</strong>
                  <button
                    type="button"
                    aria-label="Увеличить"
                    onClick={(event) => {
                      event.stopPropagation();
                      changeAddonQty(lineId, addon.id, 1);
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderComboIngredientLine = (line) => {
    const ingredients = getProductIngredients(line.product);
    const removed = getRemovedForLine(line.lineId, removedIngredients);

    if (!ingredients.length) {
      return line.product.description || "";
    }

    return ingredients.map((ingredient, index) => (
      <span className={removed.includes(ingredient) ? "is-removed" : ""} key={ingredient}>
        {ingredient}
        {index < ingredients.length - 1 ? ", " : ""}
      </span>
    ));
  };

  const renderReviewsPanel = () => (
    <div className="site-product-reviews">
      <section className="site-product-review-summary" aria-label="Рейтинг товара">
        <div>
          <b>{reviewCount ? reviewAverage.toFixed(1) : "0"}</b>
          {renderStars(reviewAverage)}
        </div>
        <span>
          {reviewCount ? formatReviewCount(reviewCount) : "Отзывов пока нет"}
          {orderedCount > 0 ? ` · ${formatOrdersCount(orderedCount)} этого блюда` : ""}
        </span>
      </section>

      {reviewsLoading ? (
        <div className="site-product-review-empty">Загружаем отзывы...</div>
      ) : visibleReviews.length ? (
        <div className="site-product-review-list">
          {visibleReviews.map((review) => (
            <article className="site-product-review-card" key={review.id}>
              <header>
                <div>
                  <b>{review.customerName || "Гость"}</b>
                  {renderStars(review.rating)}
                </div>
                <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
              </header>
              {review.text ? <p>{review.text}</p> : null}
              {review.photos?.length ? (
                <div className="site-product-review-photos" aria-label="Фотографии к отзыву">
                  {review.photos.map((photo) => (
                    <button
                      className="site-product-review-photo-button"
                      type="button"
                      key={photo.id || photo.url}
                      onClick={() =>
                        setActiveReviewPhoto({
                          url: photo.url,
                          alt: photo.alt || `Фото отзыва ${review.customerName || "гостя"}`,
                          customerName: review.customerName || "Гость"
                        })
                      }
                    >
                      <img
                        src={photo.url}
                        alt={photo.alt || `Фото отзыва ${review.customerName || "гостя"}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="site-product-review-empty">
          {reviewDemoEnabled
            ? "Оставьте первый отзыв и помогите другим гостям выбрать блюдо."
            : "После заказа можно будет оставить первый отзыв и помочь другим гостям выбрать блюдо."}
        </div>
      )}

      <form className="site-product-review-form" onSubmit={submitReview}>
        <h3>Оставить отзыв</h3>
        {customer || reviewDemoEnabled ? (
          <>
            {!customer ? (
              <input
                className="site-product-review-name"
                type="text"
                value={reviewGuestName}
                onChange={(event) => setReviewGuestName(event.target.value)}
                maxLength={80}
                placeholder="Ваше имя"
                required
              />
            ) : null}
            <div className="site-product-review-stars is-input" role="radiogroup" aria-label="Оценка">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    className={value <= reviewRating ? "is-active" : ""}
                    type="button"
                    aria-label={`${value} из 5`}
                    aria-checked={reviewRating === value}
                    role="radio"
                    key={value}
                    onClick={() => setReviewRating(value)}
                  >
                    <Star size={17} fill="currentColor" strokeWidth={2.4} />
                  </button>
                );
              })}
            </div>
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              maxLength={1000}
              placeholder="Что понравилось или что нужно улучшить?"
            />
            <label className="site-product-review-file">
              <span>
                <ImagePlus size={17} />
                Фото к отзыву
              </span>
              <small>{reviewPhotos.length ? `${reviewPhotos.length}/3` : "до 3 фото"}</small>
              <input type="file" accept="image/*" multiple onChange={handleReviewPhotoChange} />
            </label>
            <p className="site-product-review-note">
              {reviewDemoEnabled && !customer
                ? "Демо-режим: вход и заказ не требуются. Отзыв появится только после модерации."
                : "Отзыв появится после модерации. Фото автоматически сожмём перед публикацией."}
            </p>
            {reviewStatus ? <p className="site-product-review-status">{reviewStatus}</p> : null}
            {reviewError ? <p className="site-product-review-error">{reviewError}</p> : null}
            <button type="submit" disabled={reviewSubmitting}>
              {reviewSubmitting ? "Отправляем..." : "Отправить на модерацию"}
            </button>
          </>
        ) : (
          <p className="site-product-review-note">
            Войдите в личный кабинет. Оставить отзыв можно после доставленного заказа с этим товаром.
          </p>
        )}
      </form>
    </div>
  );

  const openProductVideoFullscreen = () => {
    setIsFullscreenVideoReady(false);
    setIsProductVideoFullscreen(true);
  };

  const openProductImageFullscreen = () => {
    setIsProductImageFullscreen(true);
  };

  const renderProductMedia = () => {
    if (isCombo) {
      return renderComboEditor();
    }

    const imageUrl = getProductImage(product);
    const showVideo = productVideoUrl && activeMedia === "video";

    return (
      <div className={`site-product-media-stage ${productVideoUrl ? "has-video" : "is-image-only"}`}>
        {productVideoUrl ? (
          <div className="site-product-media-tabs" role="tablist" aria-label="Медиа товара">
            <button
              className={activeMedia === "image" ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={activeMedia === "image"}
              onClick={() => setActiveMedia("image")}
            >
              Изображение
            </button>
            <button
              className={activeMedia === "video" ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={activeMedia === "video"}
              onClick={() => setActiveMedia("video")}
            >
              <Video size={15} />
              Видео
            </button>
          </div>
        ) : null}

        <div
          className={`site-product-media-frame ${showVideo ? "is-video" : "is-image"} ${
            showVideo && !isProductVideoReady ? "is-loading" : ""
          }`}
          aria-busy={showVideo && !isProductVideoReady ? "true" : undefined}
        >
          {showVideo ? (
            <>
              {!isProductVideoReady ? <div className="site-product-video-skeleton" aria-hidden="true" /> : null}
              <video
                src={productVideoUrl}
                poster={imageUrl}
                muted
                playsInline
                autoPlay
                loop
                onLoadedData={() => setIsProductVideoReady(true)}
                onCanPlay={() => setIsProductVideoReady(true)}
                onPlaying={() => setIsProductVideoReady(true)}
                onWaiting={() => setIsProductVideoReady(false)}
                onError={() => setIsProductVideoReady(true)}
              />
              <button
                className="site-product-video-fullscreen"
                type="button"
                aria-label="Развернуть видео на весь экран"
                onClick={openProductVideoFullscreen}
              >
                <Maximize2 size={18} strokeWidth={2.4} />
                <span>На весь экран</span>
              </button>
            </>
          ) : (
            <>
              <img src={imageUrl} alt="" />
              <button
                className="site-product-video-fullscreen site-product-image-fullscreen"
                type="button"
                aria-label="Развернуть изображение на весь экран"
                onClick={openProductImageFullscreen}
              >
                <Maximize2 size={18} strokeWidth={2.4} />
                <span>На весь экран</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReviewPhotoViewer = () => {
    if (!activeReviewPhoto) return null;

    return (
      <div className="site-product-review-photo-layer" role="presentation" onClick={() => setActiveReviewPhoto(null)}>
        <section
          className="site-product-review-photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Фото из отзыва"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" aria-label="Закрыть фото" onClick={() => setActiveReviewPhoto(null)}>
            <X size={22} strokeWidth={2.4} />
          </button>
          <img src={activeReviewPhoto.url} alt={activeReviewPhoto.alt} />
          <p>{activeReviewPhoto.customerName}</p>
        </section>
      </div>
    );
  };

  const renderProductVideoFullscreen = () => {
    if (!isProductVideoFullscreen || !productVideoUrl) return null;

    return (
      <div
        className={`site-product-video-layer ${isFullscreenVideoReady ? "is-ready" : "is-loading"}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Видео блюда ${product.name}`}
        aria-busy={!isFullscreenVideoReady ? "true" : undefined}
      >
        {!isFullscreenVideoReady ? <div className="site-product-video-layer-skeleton" aria-hidden="true" /> : null}
        <video
          src={productVideoUrl}
          poster={getProductImage(product)}
          muted
          playsInline
          autoPlay
          loop
          onLoadedData={() => setIsFullscreenVideoReady(true)}
          onCanPlay={() => setIsFullscreenVideoReady(true)}
          onPlaying={() => setIsFullscreenVideoReady(true)}
          onWaiting={() => setIsFullscreenVideoReady(false)}
          onError={() => setIsFullscreenVideoReady(true)}
        />
        <button type="button" onClick={() => setIsProductVideoFullscreen(false)}>
          <Minimize2 size={19} strokeWidth={2.4} />
          <span>Свернуть</span>
        </button>
      </div>
    );
  };

  const renderProductImageFullscreen = () => {
    if (!isProductImageFullscreen) return null;

    return (
      <div
        className="site-product-image-layer"
        role="dialog"
        aria-modal="true"
        aria-label={`Изображение блюда ${product.name}`}
      >
        <img src={getProductImage(product)} alt="" />
        <button type="button" onClick={() => setIsProductImageFullscreen(false)}>
          <Minimize2 size={19} strokeWidth={2.4} />
          <span>Свернуть</span>
        </button>
      </div>
    );
  };

  const renderComboEditor = () => {
    if (!activeComboLine) {
      return (
        <div className="site-product-combo-overview">
          <img src={getProductImage(product)} alt="" />
          <div>
            <span>Готовый набор</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
        </div>
      );
    }

    const lineProduct = activeComboLine.product;
    const lineIngredients = getProductIngredients(lineProduct);

    return (
      <div className="site-product-combo-editor">
        <header className="site-product-combo-editor-head">
          <button type="button" onClick={() => setActiveComboIndex(null)} aria-label="Назад к набору">
            <ChevronLeft size={28} />
          </button>
          <div>
            <h2>Меняйте на свой вкус</h2>
            <p>{lineProduct.name}</p>
          </div>
        </header>
        {renderIngredientControls(activeComboLine.lineId, lineIngredients)}
        {renderAddonGrid(activeComboLine.lineId)}
        <div className="site-product-combo-actions">
          <button type="button" onClick={() => setActiveComboIndex(null)}>
            Сохранить
          </button>
          <button type="button" onClick={() => resetLine(activeComboLine.lineId)}>
            Сбросить
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="site-product-modal-layer" role="presentation">
      <div
        className="site-product-modal-scrim"
        aria-label="Закрыть товар"
        aria-hidden="true"
        onClick={onClose}
        onWheel={(event) => event.preventDefault()}
        onTouchMove={(event) => event.preventDefault()}
      />
      <button className="site-product-modal-close" type="button" aria-label="Закрыть" onClick={onClose}>
        <X size={28} strokeWidth={2.4} />
      </button>

      <section
        className={`site-product-modal ${isCombo ? "is-combo" : ""} ${activeComboLine ? "is-editing-combo" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-product-modal-title"
      >
        <div className="site-product-modal-visual" aria-hidden={false}>
          {renderProductMedia()}
        </div>

        <div className="site-product-modal-panel">
          <div className="site-product-modal-scroll">
            <header className="site-product-modal-head">
              <div>
                <h2 id="site-product-modal-title">{product.name}</h2>
                <p>{productMeta}</p>
              </div>
              <button className="site-product-nutrition" type="button" aria-label="Пищевая ценность">
                <Info size={18} />
                <span>
                  <b>Пищевая ценность на порцию</b>
                  {nutrition ? (
                    <>
                      <small>Энерг. ценность {formatNutritionValue(nutrition.calories, "ккал")}</small>
                      <small>Белки {formatNutritionValue(nutrition.protein, "г")}</small>
                      <small>Жиры {formatNutritionValue(nutrition.fat, "г")}</small>
                      <small>Углеводы {formatNutritionValue(nutrition.carbs, "г")}</small>
                    </>
                  ) : (
                    <small>КБЖУ уточняется</small>
                  )}
                  <small>Вес {productMeta}</small>
                </span>
              </button>
            </header>

            <div
              className="site-product-modal-tabs"
              role="tablist"
              aria-label="Информация о товаре"
            >
              <button
                className={activeTab === "details" ? "is-active" : ""}
                type="button"
                role="tab"
                aria-selected={activeTab === "details"}
                onClick={() => setActiveTab("details")}
              >
                Состав
              </button>
              <button
                className={activeTab === "reviews" ? "is-active" : ""}
                type="button"
                role="tab"
                aria-selected={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
              >
                Отзывы{reviewCount ? ` ${reviewCount}` : ""}
              </button>
            </div>

            {reviewCount > 0 || orderedCount > 0 ? (
              <div className="site-product-modal-proof" aria-label="Рейтинг и популярность товара">
                {reviewCount > 0 ? (
                  <span className="is-rated">
                    <Star size={15} strokeWidth={2.4} fill="currentColor" />
                    {reviewAverage.toFixed(1)}
                  </span>
                ) : null}
                {orderedCount > 0 ? (
                  <span>
                    <ShoppingBag size={15} strokeWidth={2.5} />
                    {formatOrdersCount(orderedCount)} этого блюда
                  </span>
                ) : null}
              </div>
            ) : null}

            {activeTab === "reviews" ? (
              renderReviewsPanel()
            ) : isCombo ? (
              <>
                <p className="site-product-composition">
                  {formatCompositionText(product.description)}
                </p>
                <section className="site-combo-list" aria-label="Пиццы в наборе">
                  {comboLines.map((line, index) => {
                    const removed = getRemovedForLine(line.lineId, removedIngredients);
                    const addons = getSelectedAddons(line.lineId, addonCounts);
                    const hasChanges = removed.length || addons.length;

                    return (
                      <article
                        className={`site-combo-item-card ${activeComboIndex === index ? "is-active" : ""}`}
                        key={line.lineId}
                      >
                        <img src={getProductImage(line.product)} alt="" loading="lazy" />
                        <div>
                          <h3>{line.product.name}</h3>
                          <span>{getProductMeta(line.product)}</span>
                          <p>{renderComboIngredientLine(line)}</p>
                          {hasChanges ? <small>Есть изменения состава</small> : null}
                          <button type="button" onClick={() => setActiveComboIndex(index)}>
                            Изменить состав
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </>
            ) : (
              <>
                <p className="site-product-composition">{formatCompositionText(composition)}</p>
                {renderIngredientControls(BASE_LINE_ID, mainIngredients)}
                {renderAddonGrid(BASE_LINE_ID)}
              </>
            )}
          </div>

          <footer className="site-product-modal-footer">
            <button type="button" onClick={addToCart}>
              {oldUnitPrice ? <span className="site-product-modal-old-price">{formatPrice(oldUnitPrice)} ₽</span> : null}
              <span>В корзину за {formatPrice(unitPrice)} ₽</span>
            </button>
          </footer>
        </div>
      </section>
      {renderReviewPhotoViewer()}
      {renderProductImageFullscreen()}
      {renderProductVideoFullscreen()}
    </div>
  );
}
