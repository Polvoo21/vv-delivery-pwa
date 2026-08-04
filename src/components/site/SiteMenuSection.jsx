import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ShoppingBag } from "lucide-react";

import { formatPrice, getProductOldPrice } from "../../utils/price";
import { apiPath } from "../../utils/api";
import { SiteProductCard } from "./SiteProductCard";
import {
  menuByCategory,
  TEST_CARD_IMAGE
} from "./siteData";

const HIGHLIGHT_TONES = ["blue", "green", "neutral"];
const fallbackMenuGroups = menuByCategory
  .map((category) => ({
    ...category,
    items: category.items.filter(
      (product) => product.image && product.image !== TEST_CARD_IMAGE
    )
  }))
  .filter((category) => category.items.length);
const FALLBACK_CATALOG_VIEW = {
  visibleCategories: fallbackMenuGroups.slice(0, 8),
  hiddenCategories: fallbackMenuGroups.slice(8),
  menuGroups: fallbackMenuGroups,
  highlights: []
};

function buildCatalogView(catalog) {
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];
  const products = Array.isArray(catalog?.products) ? catalog.products : [];

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

  const menuGroups = categories
    .filter((category) => category.id !== "combo")
    .map((category) => ({
      ...category,
      label: category.shortTitle || category.label || category.title,
      items: productsByCategory[category.id] || []
    }))
    .filter((category) => category.items.length);

  const comboProducts = productsByCategory.combo || [];
  const highlights = comboProducts.length
    ? comboProducts.slice(0, 3).map((product, index) => ({
        label: product.badges?.find(Boolean) || "",
        title: product.name,
        subtitle: product.description,
        price: product.price,
        image: product.image || TEST_CARD_IMAGE,
        product,
        tone: HIGHLIGHT_TONES[index % HIGHLIGHT_TONES.length],
        featured: index === 0
      }))
    : [];

  return {
    visibleCategories: menuGroups.slice(0, 8),
    hiddenCategories: menuGroups.slice(8),
    menuGroups,
    highlights
  };
}

export function SiteMenuSection({ onProductOpen }) {
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
    () => FALLBACK_CATALOG_VIEW.visibleCategories[0]?.id || ""
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
    (categoryId) =>
      visibleCategoryIds.has(categoryId) || isCategoryNavMobile ? categoryId : "more",
    [isCategoryNavMobile, visibleCategoryIds]
  );
  const productIds = useMemo(() => {
    const ids = new Set();
    menuGroups.forEach((group) => {
      group.items.forEach((product) => {
        if (product.id) ids.add(product.id);
      });
    });
    highlights.forEach((item) => {
      if (item.product?.id) ids.add(item.product.id);
    });
    return [...ids];
  }, [highlights, menuGroups]);
  const activeHighlightKey = getCategoryHighlightKey(activeCategoryId);

  useEffect(() => {
    let cancelled = false;

    fetch(apiPath("siteCatalog"))
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.ok === true) {
          setCatalogView(buildCatalogView(data.catalog));
        }
      })
      .catch(() => {
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
    if (typeof window === "undefined") return undefined;

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
      if (
        previousStyle.height === nextStyle.height &&
        previousStyle.opacity === nextStyle.opacity &&
        previousStyle.transform === nextStyle.transform &&
        previousStyle.width === nextStyle.width
      ) {
        return previousStyle;
      }

      return nextStyle;
    });
  }, [activeHighlightKey]);

  const scrollCategoryIntoView = useCallback((highlightKey = activeHighlightKey) => {
    const categoryBar = categoryBarRef.current;
    const activeItem = categoryItemRefs.current[highlightKey];

    if (!categoryBar || !activeItem || categoryBar.scrollWidth <= categoryBar.clientWidth + 1) {
      return;
    }

    const narrowScreen = isCategoryNavMobile;
    const firstCategoryId = allCategories[0]?.id || "";

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

    if (
      !narrowScreen &&
      activeLeft >= visibleLeft + sidePadding &&
      activeRight <= visibleRight - sidePadding
    ) {
      return;
    }

    const behavior = reducedMotion || narrowScreen ? "auto" : "smooth";
    const nextScrollLeft =
      activeLeft - Math.max(0, (categoryBar.clientWidth - itemRect.width) / 2);
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

      const sections = allCategories
        .map((category) => {
          const section = document.getElementById(category.id);

          if (!section) {
            return null;
          }

          return {
            id: category.id,
            top: section.getBoundingClientRect().top + window.scrollY
          };
        })
        .filter(Boolean);

      if (!sections.length) {
        return;
      }

      const probeY =
        window.scrollY + Math.min(280, Math.max(155, window.innerHeight * 0.24));
      let nextActiveId = sections[0].id;

      for (const section of sections) {
        if (section.top <= probeY) {
          nextActiveId = section.id;
        }
      }

      setActiveCategoryId((currentId) =>
        currentId === nextActiveId ? currentId : nextActiveId
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
    categoryBar?.addEventListener("scroll", updateHighlightOnCategoryScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener("resize", updateHighlight);
      categoryBar?.removeEventListener("scroll", updateHighlightOnCategoryScroll);
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
    if (!isMoreOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!categoryMoreRef.current?.contains(event.target)) {
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
    if (!productIds.length) return undefined;

    let cancelled = false;

    fetch(`${apiPath("reviewSummary")}?products=${encodeURIComponent(productIds.join(","))}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.ok !== false) {
          setReviewSummaries(data.summaries || {});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewSummaries({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productIds]);

  return (
    <section className="site-menu-section" id="menu">
      <div className="site-menu-head">
        <div>
          <p className="site-eyebrow">Меню</p>
          <h2>Пиццы, закуски и все меню пиццерии</h2>
          <p className="site-menu-intro">
            Начните с пиццы, а дальше выбирайте закуски, салаты, супы, горячее,
            пасту, детское меню, десерты и напитки.
          </p>
        </div>
        <a href={allCategories[0]?.id ? `#${allCategories[0].id}` : "#menu"}>
          <ShoppingBag size={18} />
          Собрать заказ
        </a>
      </div>

      <div className="site-menu-nav">
        <nav className="site-category-bar" aria-label="Категории меню" ref={categoryBarRef}>
          <span
            aria-hidden="true"
            className="site-category-active-highlight"
            style={highlightStyle}
          />
          {visibleCategories.map((category) => (
            <a
              className={category.id === activeCategoryId ? "is-active" : undefined}
              href={`#${category.id}`}
              key={category.id}
              onClick={() => selectCategory(category.id)}
              ref={setCategoryItemRef(category.id)}
            >
              {category.label}
            </a>
          ))}
          {hiddenCategories.map((category) => (
            <a
              className={`site-category-mobile-extra${category.id === activeCategoryId ? " is-active" : ""}`}
              href={`#${category.id}`}
              key={category.id}
              onClick={() => selectCategory(category.id)}
              ref={setCategoryItemRef(category.id)}
            >
              {category.label}
            </a>
          ))}
          {hiddenCategories.length ? (
            <div className={`site-category-more${isMoreOpen ? " is-open" : ""}`} ref={categoryMoreRef}>
              <button
                className={`site-category-more-button${
                  visibleCategoryIds.has(activeCategoryId) ? "" : " is-active"
                }`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                aria-label="Показать остальные категории меню"
                onClick={() => setIsMoreOpen((isOpen) => !isOpen)}
                ref={setCategoryItemRef("more")}
              >
                Ещё
                <ChevronDown size={15} />
              </button>
              <div className="site-category-more-menu" role="menu">
                {hiddenCategories.map((category) => (
                  <a
                    className={category.id === activeCategoryId ? "is-active" : undefined}
                    href={`#${category.id}`}
                    key={category.id}
                    onClick={() => selectCategory(category.id)}
                    role="menuitem"
                  >
                    {category.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </nav>

      </div>

      {highlights.length ? (
        <section className="site-menu-highlight-block" id="combo" aria-labelledby="site-combo-highlight-title">
          <div className="site-menu-highlight-heading">
            <h3 id="site-combo-highlight-title">Готовые наборы</h3>
            <p>Для семейного ужина, гостей и детского праздника.</p>
          </div>
          <div className="site-menu-highlight-row" aria-label="Готовые наборы">
            {highlights.map((item) => {
              const oldPrice = getProductOldPrice(item.product || item);
              const comboNames = Array.isArray(item.product?.comboItems)
                ? item.product.comboItems.map((comboItem) => comboItem?.name).filter(Boolean)
                : [];

              return (
                <button
                  className={`site-menu-highlight-card site-menu-highlight-${item.tone || "orange"}${
                    item.featured ? " is-featured" : ""
                  }`}
                  key={item.title}
                  type="button"
                  onClick={() => onProductOpen(item.product)}
                >
                  {item.label ? <span className="site-menu-highlight-badge">{item.label}</span> : null}
                  <img src={item.image} alt="" loading="lazy" />
                  <div className="site-menu-highlight-body">
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                    {comboNames.length ? (
                      <span className="site-menu-highlight-composition">
                        {comboNames.join(" + ")}
                      </span>
                    ) : null}
                    <b>
                      {oldPrice ? <span>{formatPrice(oldPrice)} ₽</span> : null}
                      <em>от {formatPrice(item.price)} ₽</em>
                    </b>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="site-menu-layout">
        <div className="site-products">
          {menuGroups.map((group) => (
            <section
              className={`site-product-group${group.id === "summer" ? " site-product-group-summer" : ""}`}
              id={group.id}
              key={group.id}
            >
              <div className="site-product-group-title">
                <h3>{group.title || group.label}</h3>
                <span>{group.items.length} позиций</span>
              </div>
              {group.description ? <p className="site-product-group-note">{group.description}</p> : null}
              <div className="site-product-grid">
                {group.items.map((product) => (
                  <SiteProductCard
                    product={product}
                    key={product.id}
                    onOpen={onProductOpen}
                    reviewSummary={reviewSummaries[product.id]}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
