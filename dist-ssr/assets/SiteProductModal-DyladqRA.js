import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { X, Info, Star, ShoppingBag, Video, Maximize2, ImagePlus, Minimize2, ChevronLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { b as apiPath, c as getProductOldPrice, f as formatPrice } from "../home-ssr.js";
import { g as getProductSocialProof, f as formatOrdersCount } from "./socialProof-DMleontK.js";
import { T as TEST_CARD_IMAGE } from "./siteData-Bg885p-K.js";
import "react-dom/server";
import "./config-DkuDoHBX.js";
const DEMO_REVIEWS_STORAGE_KEY = "vv_demo_product_reviews_v1";
function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
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
function isLocalReviewDemo() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}
function listDemoReviews({ status = "all", productId = "" } = {}) {
  const normalizedProductId = String(productId || "").trim();
  return readStoredReviews().filter((review) => !normalizedProductId || review.productId === normalizedProductId).filter((review) => status === "all" || review.status === status).sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
}
function createDemoReview({ productId, rating, text, customerName }) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const review = {
    id: `demo-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: String(productId || "").trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text: String(text || "").trim().slice(0, 1e3),
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
function getDemoProductReviewState(productId) {
  const reviews = listDemoReviews({ productId, status: "approved" });
  const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
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
  if (Array.isArray(product == null ? void 0 : product.ingredients) && product.ingredients.length) {
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
  const nutrition = (product == null ? void 0 : product.nutrition) || {};
  const values = {
    calories: nutrition.calories ?? (product == null ? void 0 : product.calories),
    protein: nutrition.protein ?? (product == null ? void 0 : product.protein),
    fat: nutrition.fat ?? (product == null ? void 0 : product.fat),
    carbs: nutrition.carbs ?? (product == null ? void 0 : product.carbs)
  };
  return Object.values(values).some((value) => value !== null && value !== void 0 && value !== "") ? values : null;
}
function formatNutritionValue(value, suffix = "") {
  const number = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(number)) return "уточняется";
  const formatted = Number.isInteger(number) ? String(number) : number.toFixed(1).replace(".", ",");
  return suffix ? `${formatted} ${suffix}` : formatted;
}
function getProductImage(product) {
  var _a;
  return (product == null ? void 0 : product.image) || ((_a = product == null ? void 0 : product.visual) == null ? void 0 : _a.image) || TEST_CARD_IMAGE;
}
function getLineId(productId, index = 0) {
  return `${productId || "item"}-${index}`;
}
function getSelectedAddons(lineId, addonCounts) {
  return TEST_TASTE_ADDONS.map((addon) => ({ ...addon, qty: Number(addonCounts[`${lineId}:${addon.id}`] || 0) })).filter((addon) => addon.qty > 0);
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
  return /* @__PURE__ */ jsx("span", { className: `site-product-review-stars ${className}`, children: Array.from({ length: 5 }, (_, index) => /* @__PURE__ */ jsx(
    Star,
    {
      "aria-hidden": "true",
      fill: index < Math.round(rating) ? "currentColor" : "none",
      size: 15,
      strokeWidth: 2.4
    },
    index
  )) });
}
function canShowPreviewReviews() {
  if (typeof window === "undefined") return false;
  return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}
function getPreviewReviews(product) {
  if (!canShowPreviewReviews()) return [];
  const image = (product == null ? void 0 : product.image) || TEST_CARD_IMAGE;
  return [
    {
      id: `${(product == null ? void 0 : product.id) || "product"}-preview-review-1`,
      customerName: "Анна",
      rating: 5,
      createdAt: "2026-07-04T10:30:00.000Z",
      text: "Заказывали домой, приехало горячим. Тесто мягкое, бортик румяный, ребенку тоже понравилось.",
      photos: [{ id: "preview-photo-1", url: image, alt: "Фото блюда в отзыве" }]
    },
    {
      id: `${(product == null ? void 0 : product.id) || "product"}-preview-review-2`,
      customerName: "Максим",
      rating: 5,
      createdAt: "2026-07-02T17:20:00.000Z",
      text: "Понятный вкус без лишней тяжести. Хороший вариант для семейного ужина.",
      photos: [{ id: "preview-photo-2", url: TEST_CARD_IMAGE, alt: "Фото блюда от гостя" }]
    },
    {
      id: `${(product == null ? void 0 : product.id) || "product"}-preview-review-3`,
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
  const word = mod10 === 1 && mod100 !== 11 ? "отзыв" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "отзыва" : "отзывов";
  return `${value} ${word}`;
}
function SiteProductModal({ product, customer, onClose, onAddToCart }) {
  var _a, _b, _c;
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
  const productVideoUrl = (product == null ? void 0 : product.videoUrl) || ((_a = product == null ? void 0 : product.video) == null ? void 0 : _a.url) || "";
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
  }, [product == null ? void 0 : product.id]);
  useEffect(() => {
    if (activeMedia === "video") {
      setIsProductVideoReady(false);
    }
  }, [activeMedia, productVideoUrl]);
  useEffect(() => {
    if (!(product == null ? void 0 : product.id)) return void 0;
    if (isLocalReviewDemo()) {
      setReviewDemoEnabled(true);
      setReviewState(getDemoProductReviewState(product.id));
      setReviewsLoading(false);
      return void 0;
    }
    let cancelled = false;
    setReviewsLoading(true);
    fetch(`${apiPath("productReviews")}/${encodeURIComponent(product.id)}`).then((response) => response.json()).then((data) => {
      if (!cancelled && (data == null ? void 0 : data.ok) !== false) {
        setReviewDemoEnabled(Boolean(data.demoSubmissionEnabled));
        setReviewState({
          summary: data.summary || { average: 0, count: 0 },
          reviews: data.reviews || []
        });
      }
    }).catch(() => {
      if (!cancelled) {
        setReviewState({ summary: { average: 0, count: 0, orderedCount: 0 }, reviews: [] });
      }
    }).finally(() => {
      if (!cancelled) {
        setReviewsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [product == null ? void 0 : product.id]);
  useEffect(() => {
    if (!isProductVideoFullscreen && !isProductImageFullscreen) return void 0;
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
    () => Array.isArray(product == null ? void 0 : product.comboItems) ? product.comboItems.map((comboProduct, index) => ({
      lineId: getLineId(comboProduct.id, index),
      product: comboProduct
    })) : [],
    [product]
  );
  const isCombo = (product == null ? void 0 : product.category) === "combo" && comboLines.length > 0;
  const selectedMainAddons = useMemo(() => getSelectedAddons(BASE_LINE_ID, addonCounts), [addonCounts]);
  const comboCustomizations = useMemo(
    () => comboLines.map((line) => ({
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
  const activeComboLine = Number.isInteger(activeComboIndex) && comboLines[activeComboIndex] ? comboLines[activeComboIndex] : null;
  const { orderedCount } = getProductSocialProof(product, reviewState.summary);
  const approvedReviews = Array.isArray(reviewState.reviews) ? reviewState.reviews : [];
  const previewReviews = approvedReviews.length ? [] : getPreviewReviews(product);
  const visibleReviews = approvedReviews.length ? approvedReviews : previewReviews;
  const reviewCount = approvedReviews.length ? Number(((_b = reviewState.summary) == null ? void 0 : _b.count) || approvedReviews.length) : visibleReviews.length;
  const reviewAverage = approvedReviews.length ? Number(((_c = reviewState.summary) == null ? void 0 : _c.average) || getAverageReviewRating(approvedReviews)) : getAverageReviewRating(visibleReviews);
  const handleReviewPhotoChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => String(file.type || "").startsWith("image/")).slice(0, 3);
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
          customerName: reviewGuestName || (customer == null ? void 0 : customer.name)
        });
        setReviewRating(5);
        setReviewText("");
        setReviewGuestName("");
        setReviewPhotos([]);
        setReviewStatus(
          reviewPhotos.length ? "Спасибо, отзыв отправлен на модерацию. В локальном демо фото не сохраняется." : "Спасибо, отзыв отправлен на модерацию."
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
  const toggleRemovedIngredient = (lineId, ingredient) => {
    setRemovedIngredients((current) => {
      const lineRemoved = getRemovedForLine(lineId, current);
      const nextLineRemoved = lineRemoved.includes(ingredient) ? lineRemoved.filter((item) => item !== ingredient) : [...lineRemoved, ingredient];
      return { ...current, [lineId]: nextLineRemoved };
    });
  };
  const resetLine = (lineId) => {
    setRemovedIngredients((current) => ({ ...current, [lineId]: [] }));
    setAddonCounts(
      (current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${lineId}:`)))
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
    return /* @__PURE__ */ jsxs("section", { className: "site-product-remove-section", "aria-label": "Ингредиенты, которые можно удалить", children: [
      /* @__PURE__ */ jsx("h3", { children: "Можно удалить" }),
      /* @__PURE__ */ jsx("div", { className: "site-product-remove-list", children: ingredients.map((ingredient) => {
        const isRemoved = removed.includes(ingredient);
        return /* @__PURE__ */ jsx(
          "button",
          {
            className: `site-product-remove-chip ${isRemoved ? "is-removed" : ""}`,
            type: "button",
            onClick: () => toggleRemovedIngredient(lineId, ingredient),
            children: ingredient
          },
          ingredient
        );
      }) })
    ] });
  };
  const renderAddonGrid = (lineId) => /* @__PURE__ */ jsxs("section", { className: "site-product-addon-section", "aria-labelledby": `site-product-addon-title-${lineId}`, children: [
    /* @__PURE__ */ jsx("h3", { id: `site-product-addon-title-${lineId}`, children: "Добавить по вкусу" }),
    /* @__PURE__ */ jsx("div", { className: "site-product-addon-grid", children: TEST_TASTE_ADDONS.map((addon) => {
      const qty = Number(addonCounts[`${lineId}:${addon.id}`] || 0);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: `site-product-addon-card ${qty > 0 ? "is-selected" : ""}${" is-disabled"}`,
          role: "button",
          tabIndex: -1,
          "aria-disabled": ARE_ADDONS_IN_DEVELOPMENT,
          onClick: () => {
          },
          onKeyDown: (event) => {
            {
              return;
            }
          },
          children: [
            /* @__PURE__ */ jsx("img", { src: addon.image, alt: "", loading: "lazy" }),
            /* @__PURE__ */ jsx("span", { children: addon.name }),
            /* @__PURE__ */ jsxs("small", { children: [
              "+",
              addon.weight
            ] }),
            /* @__PURE__ */ jsxs("b", { children: [
              formatPrice(addon.price),
              " ₽"
            ] }),
            /* @__PURE__ */ jsx("em", { children: "в разработке" }),
            null
          ]
        },
        addon.id
      );
    }) })
  ] });
  const renderComboIngredientLine = (line) => {
    const ingredients = getProductIngredients(line.product);
    const removed = getRemovedForLine(line.lineId, removedIngredients);
    if (!ingredients.length) {
      return line.product.description || "";
    }
    return ingredients.map((ingredient, index) => /* @__PURE__ */ jsxs("span", { className: removed.includes(ingredient) ? "is-removed" : "", children: [
      ingredient,
      index < ingredients.length - 1 ? ", " : ""
    ] }, ingredient));
  };
  const renderReviewsPanel = () => /* @__PURE__ */ jsxs("div", { className: "site-product-reviews", children: [
    /* @__PURE__ */ jsxs("section", { className: "site-product-review-summary", "aria-label": "Рейтинг товара", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: reviewCount ? reviewAverage.toFixed(1) : "0" }),
        renderStars(reviewAverage)
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        reviewCount ? formatReviewCount(reviewCount) : "Отзывов пока нет",
        orderedCount > 0 ? ` · ${formatOrdersCount(orderedCount)} этого блюда` : ""
      ] })
    ] }),
    reviewsLoading ? /* @__PURE__ */ jsx("div", { className: "site-product-review-empty", children: "Загружаем отзывы..." }) : visibleReviews.length ? /* @__PURE__ */ jsx("div", { className: "site-product-review-list", children: visibleReviews.map((review) => {
      var _a2;
      return /* @__PURE__ */ jsxs("article", { className: "site-product-review-card", children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("b", { children: review.customerName || "Гость" }),
            renderStars(review.rating)
          ] }),
          /* @__PURE__ */ jsx("time", { dateTime: review.createdAt, children: formatReviewDate(review.createdAt) })
        ] }),
        review.text ? /* @__PURE__ */ jsx("p", { children: review.text }) : null,
        ((_a2 = review.photos) == null ? void 0 : _a2.length) ? /* @__PURE__ */ jsx("div", { className: "site-product-review-photos", "aria-label": "Фотографии к отзыву", children: review.photos.map((photo) => /* @__PURE__ */ jsx(
          "button",
          {
            className: "site-product-review-photo-button",
            type: "button",
            onClick: () => setActiveReviewPhoto({
              url: photo.url,
              alt: photo.alt || `Фото отзыва ${review.customerName || "гостя"}`,
              customerName: review.customerName || "Гость"
            }),
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: photo.url,
                alt: photo.alt || `Фото отзыва ${review.customerName || "гостя"}`,
                loading: "lazy"
              }
            )
          },
          photo.id || photo.url
        )) }) : null
      ] }, review.id);
    }) }) : /* @__PURE__ */ jsx("div", { className: "site-product-review-empty", children: reviewDemoEnabled ? "Оставьте первый отзыв и помогите другим гостям выбрать блюдо." : "После заказа можно будет оставить первый отзыв и помочь другим гостям выбрать блюдо." }),
    /* @__PURE__ */ jsxs("form", { className: "site-product-review-form", onSubmit: submitReview, children: [
      /* @__PURE__ */ jsx("h3", { children: "Оставить отзыв" }),
      customer || reviewDemoEnabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
        !customer ? /* @__PURE__ */ jsx(
          "input",
          {
            className: "site-product-review-name",
            type: "text",
            value: reviewGuestName,
            onChange: (event) => setReviewGuestName(event.target.value),
            maxLength: 80,
            placeholder: "Ваше имя",
            required: true
          }
        ) : null,
        /* @__PURE__ */ jsx("div", { className: "site-product-review-stars is-input", role: "radiogroup", "aria-label": "Оценка", children: Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          return /* @__PURE__ */ jsx(
            "button",
            {
              className: value <= reviewRating ? "is-active" : "",
              type: "button",
              "aria-label": `${value} из 5`,
              "aria-checked": reviewRating === value,
              role: "radio",
              onClick: () => setReviewRating(value),
              children: /* @__PURE__ */ jsx(Star, { size: 17, fill: "currentColor", strokeWidth: 2.4 })
            },
            value
          );
        }) }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: reviewText,
            onChange: (event) => setReviewText(event.target.value),
            maxLength: 1e3,
            placeholder: "Что понравилось или что нужно улучшить?"
          }
        ),
        /* @__PURE__ */ jsxs("label", { className: "site-product-review-file", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(ImagePlus, { size: 17 }),
            "Фото к отзыву"
          ] }),
          /* @__PURE__ */ jsx("small", { children: reviewPhotos.length ? `${reviewPhotos.length}/3` : "до 3 фото" }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: handleReviewPhotoChange })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "site-product-review-note", children: reviewDemoEnabled && !customer ? "Демо-режим: вход и заказ не требуются. Отзыв появится только после модерации." : "Отзыв появится после модерации. Фото автоматически сожмём перед публикацией." }),
        reviewStatus ? /* @__PURE__ */ jsx("p", { className: "site-product-review-status", children: reviewStatus }) : null,
        reviewError ? /* @__PURE__ */ jsx("p", { className: "site-product-review-error", children: reviewError }) : null,
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: reviewSubmitting, children: reviewSubmitting ? "Отправляем..." : "Отправить на модерацию" })
      ] }) : /* @__PURE__ */ jsx("p", { className: "site-product-review-note", children: "Войдите в личный кабинет. Оставить отзыв можно после доставленного заказа с этим товаром." })
    ] })
  ] });
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
    return /* @__PURE__ */ jsxs("div", { className: `site-product-media-stage ${productVideoUrl ? "has-video" : "is-image-only"}`, children: [
      productVideoUrl ? /* @__PURE__ */ jsxs("div", { className: "site-product-media-tabs", role: "tablist", "aria-label": "Медиа товара", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: activeMedia === "image" ? "is-active" : "",
            type: "button",
            role: "tab",
            "aria-selected": activeMedia === "image",
            onClick: () => setActiveMedia("image"),
            children: "Изображение"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: activeMedia === "video" ? "is-active" : "",
            type: "button",
            role: "tab",
            "aria-selected": activeMedia === "video",
            onClick: () => setActiveMedia("video"),
            children: [
              /* @__PURE__ */ jsx(Video, { size: 15 }),
              "Видео"
            ]
          }
        )
      ] }) : null,
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `site-product-media-frame ${showVideo ? "is-video" : "is-image"} ${showVideo && !isProductVideoReady ? "is-loading" : ""}`,
          "aria-busy": showVideo && !isProductVideoReady ? "true" : void 0,
          children: showVideo ? /* @__PURE__ */ jsxs(Fragment, { children: [
            !isProductVideoReady ? /* @__PURE__ */ jsx("div", { className: "site-product-video-skeleton", "aria-hidden": "true" }) : null,
            /* @__PURE__ */ jsx(
              "video",
              {
                src: productVideoUrl,
                poster: imageUrl,
                muted: true,
                playsInline: true,
                autoPlay: true,
                loop: true,
                onLoadedData: () => setIsProductVideoReady(true),
                onCanPlay: () => setIsProductVideoReady(true),
                onPlaying: () => setIsProductVideoReady(true),
                onWaiting: () => setIsProductVideoReady(false),
                onError: () => setIsProductVideoReady(true)
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "site-product-video-fullscreen",
                type: "button",
                "aria-label": "Развернуть видео на весь экран",
                onClick: openProductVideoFullscreen,
                children: [
                  /* @__PURE__ */ jsx(Maximize2, { size: 18, strokeWidth: 2.4 }),
                  /* @__PURE__ */ jsx("span", { children: "На весь экран" })
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("img", { src: imageUrl, alt: "" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "site-product-video-fullscreen site-product-image-fullscreen",
                type: "button",
                "aria-label": "Развернуть изображение на весь экран",
                onClick: openProductImageFullscreen,
                children: [
                  /* @__PURE__ */ jsx(Maximize2, { size: 18, strokeWidth: 2.4 }),
                  /* @__PURE__ */ jsx("span", { children: "На весь экран" })
                ]
              }
            )
          ] })
        }
      )
    ] });
  };
  const renderReviewPhotoViewer = () => {
    if (!activeReviewPhoto) return null;
    return /* @__PURE__ */ jsx("div", { className: "site-product-review-photo-layer", role: "presentation", onClick: () => setActiveReviewPhoto(null), children: /* @__PURE__ */ jsxs(
      "section",
      {
        className: "site-product-review-photo-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Фото из отзыва",
        onClick: (event) => event.stopPropagation(),
        children: [
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Закрыть фото", onClick: () => setActiveReviewPhoto(null), children: /* @__PURE__ */ jsx(X, { size: 22, strokeWidth: 2.4 }) }),
          /* @__PURE__ */ jsx("img", { src: activeReviewPhoto.url, alt: activeReviewPhoto.alt }),
          /* @__PURE__ */ jsx("p", { children: activeReviewPhoto.customerName })
        ]
      }
    ) });
  };
  const renderProductVideoFullscreen = () => {
    if (!isProductVideoFullscreen || !productVideoUrl) return null;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: `site-product-video-layer ${isFullscreenVideoReady ? "is-ready" : "is-loading"}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Видео блюда ${product.name}`,
        "aria-busy": !isFullscreenVideoReady ? "true" : void 0,
        children: [
          !isFullscreenVideoReady ? /* @__PURE__ */ jsx("div", { className: "site-product-video-layer-skeleton", "aria-hidden": "true" }) : null,
          /* @__PURE__ */ jsx(
            "video",
            {
              src: productVideoUrl,
              poster: getProductImage(product),
              muted: true,
              playsInline: true,
              autoPlay: true,
              loop: true,
              onLoadedData: () => setIsFullscreenVideoReady(true),
              onCanPlay: () => setIsFullscreenVideoReady(true),
              onPlaying: () => setIsFullscreenVideoReady(true),
              onWaiting: () => setIsFullscreenVideoReady(false),
              onError: () => setIsFullscreenVideoReady(true)
            }
          ),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsProductVideoFullscreen(false), children: [
            /* @__PURE__ */ jsx(Minimize2, { size: 19, strokeWidth: 2.4 }),
            /* @__PURE__ */ jsx("span", { children: "Свернуть" })
          ] })
        ]
      }
    );
  };
  const renderProductImageFullscreen = () => {
    if (!isProductImageFullscreen) return null;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "site-product-image-layer",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Изображение блюда ${product.name}`,
        children: [
          /* @__PURE__ */ jsx("img", { src: getProductImage(product), alt: "" }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsProductImageFullscreen(false), children: [
            /* @__PURE__ */ jsx(Minimize2, { size: 19, strokeWidth: 2.4 }),
            /* @__PURE__ */ jsx("span", { children: "Свернуть" })
          ] })
        ]
      }
    );
  };
  const renderComboEditor = () => {
    if (!activeComboLine) {
      return /* @__PURE__ */ jsxs("div", { className: "site-product-combo-overview", children: [
        /* @__PURE__ */ jsx("img", { src: getProductImage(product), alt: "" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Готовый набор" }),
          /* @__PURE__ */ jsx("h3", { children: product.name }),
          /* @__PURE__ */ jsx("p", { children: product.description })
        ] })
      ] });
    }
    const lineProduct = activeComboLine.product;
    const lineIngredients = getProductIngredients(lineProduct);
    return /* @__PURE__ */ jsxs("div", { className: "site-product-combo-editor", children: [
      /* @__PURE__ */ jsxs("header", { className: "site-product-combo-editor-head", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveComboIndex(null), "aria-label": "Назад к набору", children: /* @__PURE__ */ jsx(ChevronLeft, { size: 28 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "Меняйте на свой вкус" }),
          /* @__PURE__ */ jsx("p", { children: lineProduct.name })
        ] })
      ] }),
      renderIngredientControls(activeComboLine.lineId, lineIngredients),
      renderAddonGrid(activeComboLine.lineId),
      /* @__PURE__ */ jsxs("div", { className: "site-product-combo-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveComboIndex(null), children: "Сохранить" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => resetLine(activeComboLine.lineId), children: "Сбросить" })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "site-product-modal-layer", role: "presentation", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "site-product-modal-scrim",
        "aria-label": "Закрыть товар",
        "aria-hidden": "true",
        onClick: onClose,
        onWheel: (event) => event.preventDefault(),
        onTouchMove: (event) => event.preventDefault()
      }
    ),
    /* @__PURE__ */ jsx("button", { className: "site-product-modal-close", type: "button", "aria-label": "Закрыть", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 28, strokeWidth: 2.4 }) }),
    /* @__PURE__ */ jsxs(
      "section",
      {
        className: `site-product-modal ${isCombo ? "is-combo" : ""} ${activeComboLine ? "is-editing-combo" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "site-product-modal-title",
        children: [
          /* @__PURE__ */ jsx("div", { className: "site-product-modal-visual", "aria-hidden": false, children: renderProductMedia() }),
          /* @__PURE__ */ jsxs("div", { className: "site-product-modal-panel", children: [
            /* @__PURE__ */ jsxs("div", { className: "site-product-modal-scroll", children: [
              /* @__PURE__ */ jsxs("header", { className: "site-product-modal-head", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { id: "site-product-modal-title", children: product.name }),
                  /* @__PURE__ */ jsx("p", { children: productMeta })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "site-product-nutrition", type: "button", "aria-label": "Пищевая ценность", children: [
                  /* @__PURE__ */ jsx(Info, { size: 18 }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Пищевая ценность на порцию" }),
                    nutrition ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsxs("small", { children: [
                        "Энерг. ценность ",
                        formatNutritionValue(nutrition.calories, "ккал")
                      ] }),
                      /* @__PURE__ */ jsxs("small", { children: [
                        "Белки ",
                        formatNutritionValue(nutrition.protein, "г")
                      ] }),
                      /* @__PURE__ */ jsxs("small", { children: [
                        "Жиры ",
                        formatNutritionValue(nutrition.fat, "г")
                      ] }),
                      /* @__PURE__ */ jsxs("small", { children: [
                        "Углеводы ",
                        formatNutritionValue(nutrition.carbs, "г")
                      ] })
                    ] }) : /* @__PURE__ */ jsx("small", { children: "КБЖУ уточняется" }),
                    /* @__PURE__ */ jsxs("small", { children: [
                      "Вес ",
                      productMeta
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "site-product-modal-tabs",
                  role: "tablist",
                  "aria-label": "Информация о товаре",
                  children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        className: activeTab === "details" ? "is-active" : "",
                        type: "button",
                        role: "tab",
                        "aria-selected": activeTab === "details",
                        onClick: () => setActiveTab("details"),
                        children: "Состав"
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        className: activeTab === "reviews" ? "is-active" : "",
                        type: "button",
                        role: "tab",
                        "aria-selected": activeTab === "reviews",
                        onClick: () => setActiveTab("reviews"),
                        children: [
                          "Отзывы",
                          reviewCount ? ` ${reviewCount}` : ""
                        ]
                      }
                    )
                  ]
                }
              ),
              reviewCount > 0 || orderedCount > 0 ? /* @__PURE__ */ jsxs("div", { className: "site-product-modal-proof", "aria-label": "Рейтинг и популярность товара", children: [
                reviewCount > 0 ? /* @__PURE__ */ jsxs("span", { className: "is-rated", children: [
                  /* @__PURE__ */ jsx(Star, { size: 15, strokeWidth: 2.4, fill: "currentColor" }),
                  reviewAverage.toFixed(1)
                ] }) : null,
                orderedCount > 0 ? /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(ShoppingBag, { size: 15, strokeWidth: 2.5 }),
                  formatOrdersCount(orderedCount),
                  " этого блюда"
                ] }) : null
              ] }) : null,
              activeTab === "reviews" ? renderReviewsPanel() : isCombo ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("p", { className: "site-product-composition", children: formatCompositionText(product.description) }),
                /* @__PURE__ */ jsx("section", { className: "site-combo-list", "aria-label": "Пиццы в наборе", children: comboLines.map((line, index) => {
                  const removed = getRemovedForLine(line.lineId, removedIngredients);
                  const addons = getSelectedAddons(line.lineId, addonCounts);
                  const hasChanges = removed.length || addons.length;
                  return /* @__PURE__ */ jsxs(
                    "article",
                    {
                      className: `site-combo-item-card ${activeComboIndex === index ? "is-active" : ""}`,
                      children: [
                        /* @__PURE__ */ jsx("img", { src: getProductImage(line.product), alt: "", loading: "lazy" }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("h3", { children: line.product.name }),
                          /* @__PURE__ */ jsx("span", { children: getProductMeta(line.product) }),
                          /* @__PURE__ */ jsx("p", { children: renderComboIngredientLine(line) }),
                          hasChanges ? /* @__PURE__ */ jsx("small", { children: "Есть изменения состава" }) : null,
                          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveComboIndex(index), children: "Изменить состав" })
                        ] })
                      ]
                    },
                    line.lineId
                  );
                }) })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("p", { className: "site-product-composition", children: formatCompositionText(composition) }),
                renderIngredientControls(BASE_LINE_ID, mainIngredients),
                renderAddonGrid(BASE_LINE_ID)
              ] })
            ] }),
            /* @__PURE__ */ jsx("footer", { className: "site-product-modal-footer", children: /* @__PURE__ */ jsxs("button", { type: "button", onClick: addToCart, children: [
              oldUnitPrice ? /* @__PURE__ */ jsxs("span", { className: "site-product-modal-old-price", children: [
                formatPrice(oldUnitPrice),
                " ₽"
              ] }) : null,
              /* @__PURE__ */ jsxs("span", { children: [
                "В корзину за ",
                formatPrice(unitPrice),
                " ₽"
              ] })
            ] }) })
          ] })
        ]
      }
    ),
    renderReviewPhotoViewer(),
    renderProductImageFullscreen(),
    renderProductVideoFullscreen()
  ] });
}
export {
  SiteProductModal
};
