import { useEffect, useRef, useState } from "react";
import { apiPath } from "../../utils/api";
import { CartDrawer } from "./CartDrawer";
import { SiteAuthModal } from "./SiteAuthModal";
import { SiteBreadcrumbs } from "./SiteBreadcrumbs";
import { SITE_ONBOARDING_DEMO_MODE, SiteContactPhoneModal } from "./SiteContactPhoneModal";
import { SiteHeader } from "./SiteHeader";
import { SiteMobileCartFab } from "./SiteMobileCartFab";
import { fetchCurrentSiteCustomer, forgetSiteCustomer, rememberSiteCustomer } from "./customerSession";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useCartDrawer } from "./hooks/useCartDrawer";
import { useCartSummary } from "./hooks/useCartSummary";
import { useDeliverySettings } from "./hooks/useDeliverySettings";
import { DELIVERY_URL } from "./siteData";
import { getSiteSeoPage } from "../../../shared/site-seo.js";

const HEADER_COMPACT_ENTER_Y = 96;
const HEADER_COMPACT_EXIT_Y = 8;

async function readApiJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось выполнить запрос");
  }
  return data;
}

export function SitePublicShell({ className = "", children, fallbackCustomer = null }) {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const isHeaderCompactRef = useRef(false);
  const isPageOverlayLockedRef = useRef(false);
  const [siteCustomer, setSiteCustomer] = useState(fallbackCustomer);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [isOnboardingSessionComplete, setIsOnboardingSessionComplete] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [goToCheckoutAfterAuth, setGoToCheckoutAfterAuth] = useState(false);
  const {
    cartSummary,
    cartItems,
    hasCartItems,
    cartItemsLabel,
    syncCartSummary,
    updateCartItemQty,
    removeCartItem,
    applyCartPromo
  } = useCartSummary();
  const { deliverySettings } = useDeliverySettings();
  const seoPage = typeof window === "undefined" ? null : getSiteSeoPage(window.location.pathname);
  const { isCartDrawerOpen, isCartDrawerVisible, isCartDrawerClosing, openCartDrawer, closeCartDrawer } =
    useCartDrawer(syncCartSummary);
  const hasRequiredOnboarding = Boolean(siteCustomer?.requiresOnboarding || siteCustomer?.requiresContactPhoneSetup);
  const showOnboardingDemo = Boolean(
    SITE_ONBOARDING_DEMO_MODE && siteCustomer?.id && !hasRequiredOnboarding && !isOnboardingSessionComplete
  );
  const needsOnboarding = hasRequiredOnboarding || showOnboardingDemo;
  const isPageOverlayLocked = isCartDrawerOpen || isAuthModalOpen || needsOnboarding;

  isPageOverlayLockedRef.current = isPageOverlayLocked;

  useBodyScrollLock(isPageOverlayLocked, () => {
    if (needsOnboarding) {
      return;
    }

    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return;
    }

    closeCartDrawer();
  });

  useEffect(() => {
    let isCancelled = false;

    fetchCurrentSiteCustomer()
      .then((customer) => {
        if (!isCancelled) {
          setSiteCustomer(customer || fallbackCustomer || null);
          setIsCustomerLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSiteCustomer(fallbackCustomer || null);
          setIsCustomerLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fallbackCustomer]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("authLink")) {
      setIsAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    let frame = 0;

    const syncHeaderState = () => {
      frame = 0;

      if (isPageOverlayLockedRef.current || document.body.classList.contains("site-cart-scroll-lock")) {
        return;
      }

      const current = isHeaderCompactRef.current;
      const scrollY = window.scrollY;

      if (!current && scrollY >= HEADER_COMPACT_ENTER_Y) {
        isHeaderCompactRef.current = true;
        setIsHeaderCompact(true);
        return;
      }

      if (current && scrollY <= HEADER_COMPACT_EXIT_Y) {
        isHeaderCompactRef.current = false;
        setIsHeaderCompact(false);
      }
    };

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(syncHeaderState);
    };

    syncHeaderState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const logoutCustomer = async () => {
    try {
      await fetch(apiPath("customerAuthLogout"), {
        method: "POST",
        credentials: "include"
      }).then(readApiJson);
    } catch {
      // Local preview can run without API. In that case just reset the UI state.
    }

    setSiteCustomer(null);
    setIsOnboardingSessionComplete(false);
    forgetSiteCustomer();
    setIsAuthModalOpen(false);
  };

  const handleAuthenticated = (customer) => {
    const nextCustomer = rememberSiteCustomer(customer);
    setSiteCustomer(nextCustomer);

    if (goToCheckoutAfterAuth) {
      setGoToCheckoutAfterAuth(false);
      window.location.href = DELIVERY_URL;
    }
  };

  const requestCheckout = () => {
    if (!hasCartItems) {
      return;
    }

    if (!siteCustomer?.id) {
      setGoToCheckoutAfterAuth(true);
      setIsAuthModalOpen(true);
      return;
    }

    window.location.href = DELIVERY_URL;
  };

  const classes = ["site-showcase", className, isHeaderCompact ? "is-header-compact" : ""].filter(Boolean).join(" ");

  return (
    <main className={classes}>
      <SiteHeader
        customer={siteCustomer}
        hasCartItems={hasCartItems}
        cartSummary={cartSummary}
        isCartDrawerOpen={isCartDrawerOpen}
        isCartDrawerClosing={isCartDrawerClosing}
        deliverySettings={deliverySettings}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onCartClick={openCartDrawer}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        isVisible={isCartDrawerVisible}
        isClosing={isCartDrawerClosing}
        hasItems={hasCartItems}
        cartItems={cartItems}
        cartItemsLabel={cartItemsLabel}
        cartSummary={cartSummary}
        onClose={closeCartDrawer}
        onRemoveItem={removeCartItem}
        onUpdateItemQty={updateCartItemQty}
        onApplyPromo={applyCartPromo}
        onCheckout={requestCheckout}
      />

      <SiteMobileCartFab
        hasCartItems={hasCartItems}
        cartSummary={cartSummary}
        isCartDrawerOpen={isCartDrawerOpen}
        isCartDrawerClosing={isCartDrawerClosing}
        onCartClick={openCartDrawer}
      />

      {isAuthModalOpen && !needsOnboarding ? (
        <SiteAuthModal
          customer={siteCustomer}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticated={handleAuthenticated}
          onLogout={logoutCustomer}
        />
      ) : null}

      {needsOnboarding ? (
        <SiteContactPhoneModal
          customer={siteCustomer}
          onSaved={handleAuthenticated}
          demoMode={showOnboardingDemo}
          onComplete={() => setIsOnboardingSessionComplete(true)}
        />
      ) : null}

      {seoPage?.breadcrumbs?.length ? <SiteBreadcrumbs items={seoPage.breadcrumbs} /> : null}

      {typeof children === "function"
        ? children({
            siteCustomer,
            isCustomerLoading,
            openAuthModal: () => setIsAuthModalOpen(true),
            syncCartSummary
          })
        : children}
    </main>
  );
}
