import { useEffect, useRef } from "react";

const LOCK_SCROLL_ALLOW_SELECTOR = [
  ".site-product-modal-scroll",
  ".site-product-modal.is-combo .site-product-modal-visual",
  ".site-cart-drawer",
  ".site-address-panel",
  ".site-address-map",
  ".site-auth-modal",
  ".site-checkout-time-modal",
  ".site-gallery-lightbox",
  ".site-lost-contact-modal",
  ".site-lost-photo-modal",
  ".site-recent-orders-scroll"
].join(", ");

function getElementTarget(target) {
  if (target?.nodeType === 1) {
    return target;
  }

  return target?.parentElement || null;
}

function getAllowedScrollElement(target) {
  return getElementTarget(target)?.closest(LOCK_SCROLL_ALLOW_SELECTOR) || null;
}

function isFreeGestureElement(element) {
  return Boolean(
    element?.matches(".site-address-map, .site-product-modal.is-combo .site-product-modal-visual")
  );
}

function canScrollElement(element, deltaY) {
  if (!element || isFreeGestureElement(element)) {
    return true;
  }

  const maxScrollTop = element.scrollHeight - element.clientHeight;

  if (maxScrollTop <= 1) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  if (deltaY > 0) {
    return element.scrollTop < maxScrollTop - 1;
  }

  return true;
}

const LOCKED_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " "
]);

function scrollToLockedPosition(scrollY) {
  try {
    window.scrollTo({ left: 0, top: scrollY, behavior: "instant" });
  } catch {
    window.scrollTo(0, scrollY);
  }
}

export function useBodyScrollLock(isLocked, onEscape) {
  const onEscapeRef = useRef(onEscape);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return undefined;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || html.scrollTop || 0;
    const previousHtmlStyles = {
      height: html.style.height,
      overflow: html.style.overflow,
      overflowX: html.style.overflowX,
      overflowY: html.style.overflowY,
      overscrollBehavior: html.style.overscrollBehavior,
      scrollbarGutter: html.style.scrollbarGutter,
      scrollBehavior: html.style.scrollBehavior
    };
    const previousBodyStyles = {
      boxSizing: body.style.boxSizing,
      height: body.style.height,
      left: body.style.left,
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      right: body.style.right,
      scrollBehavior: body.style.scrollBehavior,
      top: body.style.top,
      width: body.style.width
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
      }

      const target = getElementTarget(event.target);
      const isEditable = target?.closest("input, textarea, select, [contenteditable='true']");

      if (
        LOCKED_SCROLL_KEYS.has(event.key) &&
        !isEditable &&
        !target?.closest(LOCK_SCROLL_ALLOW_SELECTOR)
      ) {
        event.preventDefault();
      }
    };
    const handleTouchStart = (event) => {
      touchStartYRef.current = event.touches?.[0]?.clientY || 0;
    };
    const handleLockedScroll = (event) => {
      const allowedScrollElement = getAllowedScrollElement(event.target);

      if (allowedScrollElement) {
        if (event.type === "wheel") {
          if (canScrollElement(allowedScrollElement, event.deltaY || 0)) {
            return;
          }

          event.preventDefault();
          return;
        }

        if (event.type === "touchmove") {
          const currentY = event.touches?.[0]?.clientY || touchStartYRef.current;
          const deltaY = touchStartYRef.current - currentY;

          if (canScrollElement(allowedScrollElement, deltaY)) {
            return;
          }

          event.preventDefault();
          return;
        }

        return;
      }

      event.preventDefault();
    };

    html.classList.add("site-cart-scroll-lock");
    body.classList.add("site-cart-scroll-lock");
    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    html.style.height = "100%";
    html.style.overflow = "hidden";
    html.style.overflowX = "hidden";
    html.style.overflowY = "hidden";
    html.style.overscrollBehavior = "none";
    html.style.scrollbarGutter = "stable";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.height = "auto";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.boxSizing = "border-box";
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    document.addEventListener("wheel", handleLockedScroll, { passive: false, capture: true });
    document.addEventListener("touchmove", handleLockedScroll, { passive: false, capture: true });

    return () => {
      html.classList.remove("site-cart-scroll-lock");
      body.classList.remove("site-cart-scroll-lock");
      html.style.height = previousHtmlStyles.height;
      html.style.overflow = previousHtmlStyles.overflow;
      html.style.overflowX = previousHtmlStyles.overflowX;
      html.style.overflowY = previousHtmlStyles.overflowY;
      html.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior;
      html.style.scrollbarGutter = previousHtmlStyles.scrollbarGutter;
      html.style.scrollBehavior = "auto";
      body.style.boxSizing = previousBodyStyles.boxSizing;
      body.style.height = previousBodyStyles.height;
      body.style.left = previousBodyStyles.left;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      body.style.position = previousBodyStyles.position;
      body.style.right = previousBodyStyles.right;
      body.style.scrollBehavior = "auto";
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      scrollToLockedPosition(scrollY);
      html.style.scrollBehavior = previousHtmlStyles.scrollBehavior;
      body.style.scrollBehavior = previousBodyStyles.scrollBehavior;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart, { capture: true });
      document.removeEventListener("wheel", handleLockedScroll, { capture: true });
      document.removeEventListener("touchmove", handleLockedScroll, { capture: true });
    };
  }, [isLocked]);
}
