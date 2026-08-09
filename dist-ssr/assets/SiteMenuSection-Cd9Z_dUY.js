import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Video, Star, ShoppingBag, ChevronDown } from "lucide-react";
import { c as getProductOldPrice, f as formatPrice, b as apiPath } from "../home-ssr.js";
import { i as isPublicMenuCategory } from "./config-DkuDoHBX.js";
import { g as getProductSocialProof, f as formatOrdersCount } from "./socialProof-DMleontK.js";
import { a as getCategoryVisual, T as TEST_CARD_IMAGE, m as menuByCategory } from "./siteData-Bg885p-K.js";
import "react-dom/server";
function SiteProductCard({ product, onOpen, reviewSummary }) {
  var _a, _b;
  const visual = getCategoryVisual(product.category);
  const badgeText = Array.isArray(product.badges) ? product.badges.find(Boolean) : "";
  const openProduct = () => onOpen == null ? void 0 : onOpen(product);
  const { reviewAverage, reviewCount, orderedCount } = getProductSocialProof(product, reviewSummary);
  const hasSocialProof = reviewCount > 0 || orderedCount > 0;
  const oldPrice = getProductOldPrice(product);
  const productImage = product.image || ((_a = product.visual) == null ? void 0 : _a.image) || TEST_CARD_IMAGE;
  const hasVideo = Boolean(product.videoUrl || ((_b = product.video) == null ? void 0 : _b.url));
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
  }, [productImage]);
  return /* @__PURE__ */ jsxs("article", { className: `site-product-card site-product-${visual.tone}`, "aria-label": product.name, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        className: `site-product-visual ${imageLoaded ? "is-image-loaded" : "is-image-loading"}`,
        type: "button",
        "aria-label": `Открыть ${product.name}`,
        onClick: openProduct,
        children: [
          !imageLoaded ? /* @__PURE__ */ jsx("span", { className: "site-product-image-skeleton", "aria-hidden": "true" }) : null,
          badgeText ? /* @__PURE__ */ jsxs("span", { className: "site-product-badge-wrap", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx("span", { className: "site-product-badge-shadow" }),
            /* @__PURE__ */ jsx("span", { className: "site-product-badge", children: badgeText })
          ] }) : null,
          hasVideo ? /* @__PURE__ */ jsx("span", { className: "site-product-video-badge", "aria-label": "У блюда есть видео", children: /* @__PURE__ */ jsx(Video, { size: 15, strokeWidth: 2.5 }) }) : null,
          /* @__PURE__ */ jsx(
            "img",
            {
              src: productImage,
              alt: "",
              loading: "lazy",
              decoding: "async",
              onLoad: () => setImageLoaded(true),
              onError: () => setImageLoaded(true)
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "site-product-body", children: [
      /* @__PURE__ */ jsx("h4", { children: product.name }),
      hasSocialProof ? /* @__PURE__ */ jsxs("div", { className: "site-product-social-proof", "aria-label": "Рейтинг и популярность товара", children: [
        reviewCount > 0 ? /* @__PURE__ */ jsxs("span", { className: "site-product-rating is-rated", children: [
          /* @__PURE__ */ jsx(Star, { size: 13, strokeWidth: 2.4, fill: "currentColor" }),
          reviewAverage.toFixed(1)
        ] }) : null,
        orderedCount > 0 ? /* @__PURE__ */ jsxs("span", { className: "site-product-orders", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { size: 13, strokeWidth: 2.5 }),
          formatOrdersCount(orderedCount)
        ] }) : null
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `site-product-bottom ${oldPrice ? "has-discount" : ""}`, children: [
      oldPrice ? /* @__PURE__ */ jsxs("span", { className: "site-product-old-price", children: [
        formatPrice(oldPrice),
        " ₽"
      ] }) : null,
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: openProduct, children: [
        "от ",
        formatPrice(product.price),
        " ₽"
      ] })
    ] })
  ] });
}
const HIGHLIGHT_TONES = ["blue", "green", "neutral"];
const fallbackMenuGroups = menuByCategory.map((category) => ({
  ...category,
  items: category.items.filter(
    (product) => product.image && product.image !== TEST_CARD_IMAGE
  )
})).filter((category) => category.items.length);
const FALLBACK_CATALOG_VIEW = {
  visibleCategories: fallbackMenuGroups.slice(0, 8),
  hiddenCategories: fallbackMenuGroups.slice(8),
  menuGroups: fallbackMenuGroups,
  highlights: []
};
function buildCatalogView(catalog) {
  const categories = Array.isArray(catalog == null ? void 0 : catalog.categories) ? catalog.categories : [];
  const products = Array.isArray(catalog == null ? void 0 : catalog.products) ? catalog.products : [];
  if (!categories.length || !products.length) {
    return FALLBACK_CATALOG_VIEW;
  }
  const productsByCategory = products.reduce((acc, product) => {
    const key = product.category || product.categoryId;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});
  const menuGroups = categories.filter((category) => category.id !== "combo" && isPublicMenuCategory(category.id)).map((category) => ({
    ...category,
    label: category.shortTitle || category.label || category.title,
    items: productsByCategory[category.id] || []
  })).filter((category) => category.items.length);
  const comboProducts = productsByCategory.combo || [];
  const highlights = comboProducts.length ? comboProducts.slice(0, 3).map((product, index) => {
    var _a;
    return {
      label: ((_a = product.badges) == null ? void 0 : _a.find(Boolean)) || "",
      title: product.name,
      subtitle: product.description,
      price: product.price,
      image: product.image || TEST_CARD_IMAGE,
      product,
      tone: HIGHLIGHT_TONES[index % HIGHLIGHT_TONES.length],
      featured: index === 0
    };
  }) : [];
  return {
    visibleCategories: menuGroups.slice(0, 8),
    hiddenCategories: menuGroups.slice(8),
    menuGroups,
    highlights
  };
}
function SiteMenuSection({ onProductOpen }) {
  var _a;
  const [catalogView, setCatalogView] = useState(FALLBACK_CATALOG_VIEW);
  const { visibleCategories, hiddenCategories, menuGroups, highlights } = catalogView;
  const [isCategoryNavMobile, setIsCategoryNavMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );
  const allCategories = useMemo(
    () => [...visibleCategories, ...hiddenCategories],
    [hiddenCategories, visibleCategories]
  );
  const visibleCategoryIds = useMemo(
    () => new Set(visibleCategories.map((category) => category.id)),
    [visibleCategories]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    () => {
      var _a2;
      return ((_a2 = FALLBACK_CATALOG_VIEW.visibleCategories[0]) == null ? void 0 : _a2.id) || "";
    }
  );
  const [highlightStyle, setHighlightStyle] = useState({
    height: "38px",
    opacity: 0,
    transform: "translateX(0px) translateY(-50%)",
    width: "0px"
  });
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});
  const categoryBarRef = useRef(null);
  const categoryItemRefs = useRef({});
  const categoryMoreRef = useRef(null);
  const getCategoryHighlightKey = useCallback(
    (categoryId) => visibleCategoryIds.has(categoryId) || isCategoryNavMobile ? categoryId : "more",
    [isCategoryNavMobile, visibleCategoryIds]
  );
  const productIds = useMemo(() => {
    const ids = /* @__PURE__ */ new Set();
    menuGroups.forEach((group) => {
      group.items.forEach((product) => {
        if (product.id) ids.add(product.id);
      });
    });
    highlights.forEach((item) => {
      var _a2;
      if ((_a2 = item.product) == null ? void 0 : _a2.id) ids.add(item.product.id);
    });
    return [...ids];
  }, [highlights, menuGroups]);
  const activeHighlightKey = getCategoryHighlightKey(activeCategoryId);
  useEffect(() => {
    let cancelled = false;
    fetch(apiPath("siteCatalog")).then((response) => response.json()).then((data) => {
      if (!cancelled && (data == null ? void 0 : data.ok) === true) {
        setCatalogView(buildCatalogView(data.catalog));
      }
    }).catch(() => {
      if (!cancelled) {
        setCatalogView(FALLBACK_CATALOG_VIEW);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!allCategories.length) return;
    if (!allCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(allCategories[0].id);
    }
  }, [activeCategoryId, allCategories]);
  useEffect(() => {
    if (typeof window === "undefined") return void 0;
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncCategoryNavMode = () => setIsCategoryNavMobile(mobileQuery.matches);
    syncCategoryNavMode();
    mobileQuery.addEventListener("change", syncCategoryNavMode);
    return () => {
      mobileQuery.removeEventListener("change", syncCategoryNavMode);
    };
  }, []);
  const setCategoryItemRef = useCallback(
    (id) => (node) => {
      if (node) {
        categoryItemRefs.current[id] = node;
        return;
      }
      delete categoryItemRefs.current[id];
    },
    []
  );
  const updateHighlight = useCallback((highlightKey = activeHighlightKey) => {
    const categoryBar = categoryBarRef.current;
    const activeItem = categoryItemRefs.current[highlightKey];
    if (!categoryBar || !activeItem) {
      setHighlightStyle((previousStyle) => ({
        ...previousStyle,
        opacity: 0
      }));
      return;
    }
    const barRect = categoryBar.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const nextLeft = Math.round(itemRect.left - barRect.left + categoryBar.scrollLeft);
    const nextWidth = Math.round(itemRect.width);
    const nextHeight = Math.round(itemRect.height);
    const nextStyle = {
      height: `${nextHeight}px`,
      opacity: 1,
      transform: `translateX(${nextLeft}px) translateY(-50%)`,
      width: `${nextWidth}px`
    };
    setHighlightStyle((previousStyle) => {
      if (previousStyle.height === nextStyle.height && previousStyle.opacity === nextStyle.opacity && previousStyle.transform === nextStyle.transform && previousStyle.width === nextStyle.width) {
        return previousStyle;
      }
      return nextStyle;
    });
  }, [activeHighlightKey]);
  const scrollCategoryIntoView = useCallback((highlightKey = activeHighlightKey) => {
    var _a2;
    const categoryBar = categoryBarRef.current;
    const activeItem = categoryItemRefs.current[highlightKey];
    if (!categoryBar || !activeItem || categoryBar.scrollWidth <= categoryBar.clientWidth + 1) {
      return;
    }
    const narrowScreen = isCategoryNavMobile;
    const firstCategoryId = ((_a2 = allCategories[0]) == null ? void 0 : _a2.id) || "";
    if (narrowScreen && highlightKey === firstCategoryId) {
      categoryBar.scrollLeft = 0;
      updateHighlight(highlightKey);
      window.requestAnimationFrame(() => updateHighlight(highlightKey));
      return;
    }
    const barRect = categoryBar.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const activeLeft = itemRect.left - barRect.left + categoryBar.scrollLeft;
    const activeRight = activeLeft + itemRect.width;
    const visibleLeft = categoryBar.scrollLeft;
    const visibleRight = visibleLeft + categoryBar.clientWidth;
    const sidePadding = 24;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!narrowScreen && activeLeft >= visibleLeft + sidePadding && activeRight <= visibleRight - sidePadding) {
      return;
    }
    const behavior = reducedMotion || narrowScreen ? "auto" : "smooth";
    const nextScrollLeft = activeLeft - Math.max(0, (categoryBar.clientWidth - itemRect.width) / 2);
    const maxScrollLeft = Math.max(0, categoryBar.scrollWidth - categoryBar.clientWidth);
    const clampedScrollLeft = Math.min(Math.max(0, nextScrollLeft), maxScrollLeft);
    if (narrowScreen) {
      categoryBar.scrollLeft = clampedScrollLeft;
      updateHighlight(highlightKey);
      window.requestAnimationFrame(() => updateHighlight(highlightKey));
      return;
    }
    try {
      categoryBar.scrollTo({
        left: clampedScrollLeft,
        behavior
      });
    } catch {
      categoryBar.scrollLeft = clampedScrollLeft;
      updateHighlight(highlightKey);
    }
  }, [activeHighlightKey, allCategories, isCategoryNavMobile, updateHighlight]);
  useEffect(() => {
    let frame = 0;
    const updateActiveCategory = () => {
      frame = 0;
      const sections = allCategories.map((category) => {
        const section = document.getElementById(category.id);
        if (!section) {
          return null;
        }
        return {
          id: category.id,
          top: section.getBoundingClientRect().top + window.scrollY
        };
      }).filter(Boolean);
      if (!sections.length) {
        return;
      }
      const probeY = window.scrollY + Math.min(280, Math.max(155, window.innerHeight * 0.24));
      let nextActiveId = sections[0].id;
      for (const section of sections) {
        if (section.top <= probeY) {
          nextActiveId = section.id;
        }
      }
      setActiveCategoryId(
        (currentId) => currentId === nextActiveId ? currentId : nextActiveId
      );
      const nextHighlightKey = getCategoryHighlightKey(nextActiveId);
      window.requestAnimationFrame(() => {
        scrollCategoryIntoView(nextHighlightKey);
        window.requestAnimationFrame(() => updateHighlight(nextHighlightKey));
      });
    };
    const requestActiveCategoryUpdate = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateActiveCategory);
    };
    requestActiveCategoryUpdate();
    window.addEventListener("scroll", requestActiveCategoryUpdate, { passive: true });
    window.addEventListener("resize", requestActiveCategoryUpdate);
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestActiveCategoryUpdate);
      window.removeEventListener("resize", requestActiveCategoryUpdate);
    };
  }, [allCategories, getCategoryHighlightKey, scrollCategoryIntoView, updateHighlight]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(updateHighlight);
    const categoryBar = categoryBarRef.current;
    let scrollFrame = 0;
    const updateHighlightOnCategoryScroll = () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateHighlight();
      });
    };
    window.addEventListener("resize", updateHighlight);
    categoryBar == null ? void 0 : categoryBar.addEventListener("scroll", updateHighlightOnCategoryScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener("resize", updateHighlight);
      categoryBar == null ? void 0 : categoryBar.removeEventListener("scroll", updateHighlightOnCategoryScroll);
    };
  }, [updateHighlight]);
  useEffect(() => {
    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      scrollCategoryIntoView();
      updateHighlight();
      timeout = window.setTimeout(updateHighlight, 180);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [scrollCategoryIntoView, updateHighlight]);
  useEffect(() => {
    const nextHighlightKey = getCategoryHighlightKey(activeCategoryId);
    let secondFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      scrollCategoryIntoView(nextHighlightKey);
      secondFrame = window.requestAnimationFrame(() => updateHighlight(nextHighlightKey));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [activeCategoryId, getCategoryHighlightKey, scrollCategoryIntoView, updateHighlight]);
  useEffect(() => {
    if (!isMoreOpen) return void 0;
    const closeOnOutsideClick = (event) => {
      var _a2;
      if (!((_a2 = categoryMoreRef.current) == null ? void 0 : _a2.contains(event.target))) {
        setIsMoreOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMoreOpen]);
  const selectCategory = useCallback((categoryId) => {
    setActiveCategoryId(categoryId);
    setIsMoreOpen(false);
    const nextHighlightKey = getCategoryHighlightKey(categoryId);
    window.requestAnimationFrame(() => {
      scrollCategoryIntoView(nextHighlightKey);
      window.requestAnimationFrame(() => updateHighlight(nextHighlightKey));
    });
  }, [getCategoryHighlightKey, scrollCategoryIntoView, updateHighlight]);
  useEffect(() => {
    if (!productIds.length) return void 0;
    let cancelled = false;
    fetch(`${apiPath("reviewSummary")}?products=${encodeURIComponent(productIds.join(","))}`).then((response) => response.json()).then((data) => {
      if (!cancelled && (data == null ? void 0 : data.ok) !== false) {
        setReviewSummaries(data.summaries || {});
      }
    }).catch(() => {
      if (!cancelled) {
        setReviewSummaries({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productIds]);
  return /* @__PURE__ */ jsxs("section", { className: "site-menu-section", id: "menu", children: [
    /* @__PURE__ */ jsxs("div", { className: "site-menu-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "site-eyebrow", children: "Меню" }),
        /* @__PURE__ */ jsx("h2", { children: "Пиццы, закуски и все меню пиццерии" }),
        /* @__PURE__ */ jsx("p", { className: "site-menu-intro", children: "Начните с пиццы, а дальше выбирайте закуски, салаты, супы, горячее, пасту, детское меню, десерты и напитки." })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: ((_a = allCategories[0]) == null ? void 0 : _a.id) ? `#${allCategories[0].id}` : "#menu", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { size: 18 }),
        "Собрать заказ"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "site-menu-nav", children: /* @__PURE__ */ jsxs("nav", { className: "site-category-bar", "aria-label": "Категории меню", ref: categoryBarRef, children: [
      /* @__PURE__ */ jsx(
        "span",
        {
          "aria-hidden": "true",
          className: "site-category-active-highlight",
          style: highlightStyle
        }
      ),
      visibleCategories.map((category) => /* @__PURE__ */ jsx(
        "a",
        {
          className: category.id === activeCategoryId ? "is-active" : void 0,
          href: `#${category.id}`,
          onClick: () => selectCategory(category.id),
          ref: setCategoryItemRef(category.id),
          children: category.label
        },
        category.id
      )),
      hiddenCategories.map((category) => /* @__PURE__ */ jsx(
        "a",
        {
          className: `site-category-mobile-extra${category.id === activeCategoryId ? " is-active" : ""}`,
          href: `#${category.id}`,
          onClick: () => selectCategory(category.id),
          ref: setCategoryItemRef(category.id),
          children: category.label
        },
        category.id
      )),
      hiddenCategories.length ? /* @__PURE__ */ jsxs("div", { className: `site-category-more${isMoreOpen ? " is-open" : ""}`, ref: categoryMoreRef, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `site-category-more-button${visibleCategoryIds.has(activeCategoryId) ? "" : " is-active"}`,
            type: "button",
            "aria-haspopup": "menu",
            "aria-expanded": isMoreOpen,
            "aria-label": "Показать остальные категории меню",
            onClick: () => setIsMoreOpen((isOpen) => !isOpen),
            ref: setCategoryItemRef("more"),
            children: [
              "Ещё",
              /* @__PURE__ */ jsx(ChevronDown, { size: 15 })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "site-category-more-menu", role: "menu", children: hiddenCategories.map((category) => /* @__PURE__ */ jsx(
          "a",
          {
            className: category.id === activeCategoryId ? "is-active" : void 0,
            href: `#${category.id}`,
            onClick: () => selectCategory(category.id),
            role: "menuitem",
            children: category.label
          },
          category.id
        )) })
      ] }) : null
    ] }) }),
    highlights.length ? /* @__PURE__ */ jsxs("section", { className: "site-menu-highlight-block", id: "combo", "aria-labelledby": "site-combo-highlight-title", children: [
      /* @__PURE__ */ jsxs("div", { className: "site-menu-highlight-heading", children: [
        /* @__PURE__ */ jsx("h3", { id: "site-combo-highlight-title", children: "Готовые наборы" }),
        /* @__PURE__ */ jsx("p", { children: "Для семейного ужина, гостей и детского праздника." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "site-menu-highlight-row", "aria-label": "Готовые наборы", children: highlights.map((item) => {
        var _a2;
        const oldPrice = getProductOldPrice(item.product || item);
        const comboNames = Array.isArray((_a2 = item.product) == null ? void 0 : _a2.comboItems) ? item.product.comboItems.map((comboItem) => comboItem == null ? void 0 : comboItem.name).filter(Boolean) : [];
        return /* @__PURE__ */ jsxs(
          "button",
          {
            className: `site-menu-highlight-card site-menu-highlight-${item.tone || "orange"}${item.featured ? " is-featured" : ""}`,
            type: "button",
            onClick: () => onProductOpen(item.product),
            children: [
              item.label ? /* @__PURE__ */ jsx("span", { className: "site-menu-highlight-badge", children: item.label }) : null,
              /* @__PURE__ */ jsx("img", { src: item.image, alt: "", loading: "lazy" }),
              /* @__PURE__ */ jsxs("div", { className: "site-menu-highlight-body", children: [
                /* @__PURE__ */ jsx("h4", { children: item.title }),
                /* @__PURE__ */ jsx("p", { children: item.subtitle }),
                comboNames.length ? /* @__PURE__ */ jsx("span", { className: "site-menu-highlight-composition", children: comboNames.join(" + ") }) : null,
                /* @__PURE__ */ jsxs("b", { children: [
                  oldPrice ? /* @__PURE__ */ jsxs("span", { children: [
                    formatPrice(oldPrice),
                    " ₽"
                  ] }) : null,
                  /* @__PURE__ */ jsxs("em", { children: [
                    "от ",
                    formatPrice(item.price),
                    " ₽"
                  ] })
                ] })
              ] })
            ]
          },
          item.title
        );
      }) })
    ] }) : null,
    /* @__PURE__ */ jsx("div", { className: "site-menu-layout", children: /* @__PURE__ */ jsx("div", { className: "site-products", children: menuGroups.map((group) => /* @__PURE__ */ jsxs(
      "section",
      {
        className: `site-product-group${group.id === "summer" ? " site-product-group-summer" : ""}`,
        id: group.id,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "site-product-group-title", children: [
            /* @__PURE__ */ jsx("h3", { children: group.title || group.label }),
            /* @__PURE__ */ jsxs("span", { children: [
              group.items.length,
              " позиций"
            ] })
          ] }),
          group.description ? /* @__PURE__ */ jsx("p", { className: "site-product-group-note", children: group.description }) : null,
          /* @__PURE__ */ jsx("div", { className: "site-product-grid", children: group.items.map((product) => /* @__PURE__ */ jsx(
            SiteProductCard,
            {
              product,
              onOpen: onProductOpen,
              reviewSummary: reviewSummaries[product.id]
            },
            product.id
          )) })
        ]
      },
      group.id
    )) }) })
  ] });
}
export {
  SiteMenuSection
};
