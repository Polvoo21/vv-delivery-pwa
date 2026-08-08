import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Baby,
  CakeSlice,
  CalendarCheck,
  ChefHat,
  HeartHandshake,
  Truck,
} from "lucide-react";
import { CartDrawer } from "./site/CartDrawer";
import { SiteMasterclassPromo } from "./site/SiteMasterclassPromo";
import { SiteAboutSection } from "./site/SiteAboutSection";
import {
  SiteAddressModal,
  SiteAddressPrompt,
  readSiteFulfillment,
  saveSiteFulfillment
} from "./site/SiteAddressFlow";
import { SiteFooter } from "./site/SiteFooter";
import { SiteFaqSection } from "./site/SiteFaqSection";
import { SiteGallerySection } from "./site/SiteGallerySection";
import { SiteAuthModal } from "./site/SiteAuthModal";
import { SITE_ONBOARDING_DEMO_MODE, SiteContactPhoneModal } from "./site/SiteContactPhoneModal";
import { SiteHeader } from "./site/SiteHeader";
import { SiteMapSection } from "./site/SiteMapSection";
import { SiteMenuSection } from "./site/SiteMenuSection";
import { SiteMobileCartFab } from "./site/SiteMobileCartFab";
import { SiteProductModal } from "./site/SiteProductModal";
import { SiteRecentOrders } from "./site/SiteRecentOrders";
import { SiteSeoSection } from "./site/SiteSeoSection";
import {
  ASSET,
  DELIVERY_URL,
  RESTAURANT,
  eventCards,
  getSiteOrderPath,
  siteComboItems
} from "./site/siteData";
import { fetchCurrentSiteCustomer, forgetSiteCustomer, rememberSiteCustomer } from "./site/customerSession";
import { useBodyScrollLock } from "./site/hooks/useBodyScrollLock";
import { useCartDrawer } from "./site/hooks/useCartDrawer";
import { useCartSummary } from "./site/hooks/useCartSummary";
import { useDeliverySettings } from "./site/hooks/useDeliverySettings";
import { apiPath } from "../utils/api";
import { MENU } from "../data/menu";

const HEADER_COMPACT_ENTER_Y = 96;
const HEADER_COMPACT_EXIT_Y = 8;
const DEFAULT_SITE_STATS = {
  deliveredOrdersTotal: 0
};

function hasSelectedFulfillment(fulfillment) {
  return fulfillment?.mode === "pickup" || Boolean(fulfillment?.address);
}

async function readApiJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось выполнить запрос");
  }
  return data;
}

export default function MainSite() {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const isHeaderCompactRef = useRef(false);
  const isPageOverlayLockedRef = useRef(false);
  const [siteCustomer, setSiteCustomer] = useState(null);
  const [isOnboardingSessionComplete, setIsOnboardingSessionComplete] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [siteStats, setSiteStats] = useState(DEFAULT_SITE_STATS);
  const [siteRecentOrders, setSiteRecentOrders] = useState([]);
  const [siteFulfillment, setSiteFulfillment] = useState(() => readSiteFulfillment());
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [editingCartLine, setEditingCartLine] = useState(null);
  const [goToCheckoutAfterAuth, setGoToCheckoutAfterAuth] = useState(false);
  const [isAddressPromptOpen, setIsAddressPromptOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState("delivery");
  const [isMasterclassPromoOpen, setIsMasterclassPromoOpen] = useState(false);
  const openMasterclassPromo = useCallback(() => setIsMasterclassPromoOpen(true), []);
  const closeMasterclassPromo = useCallback(() => setIsMasterclassPromoOpen(false), []);
  const {
    cartSummary,
    cartItems,
    hasCartItems,
    cartItemsLabel,
    syncCartSummary,
    addCartItem,
    addCartItems,
    updateCartItemQty,
    removeCartItem,
    replaceCartItem,
    applyCartPromo
  } = useCartSummary();
  const { deliverySettings } = useDeliverySettings();
  const { isCartDrawerOpen, isCartDrawerVisible, isCartDrawerClosing, openCartDrawer, closeCartDrawer } =
    useCartDrawer(syncCartSummary);

  const editableProductById = useMemo(
    () => new Map([...MENU, ...siteComboItems].filter((product) => product?.id).map((product) => [product.id, product])),
    []
  );

  const closeProductModal = () => {
    setSelectedProduct(null);
    setEditingCartLine(null);
  };
  const hasRequiredOnboarding = Boolean(siteCustomer?.requiresOnboarding || siteCustomer?.requiresContactPhoneSetup);
  const showOnboardingDemo = Boolean(
    SITE_ONBOARDING_DEMO_MODE && siteCustomer?.id && !hasRequiredOnboarding && !isOnboardingSessionComplete
  );
  const needsOnboarding = hasRequiredOnboarding || showOnboardingDemo;
  const isPageOverlayLocked =
    Boolean(selectedProduct) ||
    isCartDrawerOpen ||
    isAddressPromptOpen ||
    isAddressModalOpen ||
    isAuthModalOpen ||
    needsOnboarding ||
    isRecentOrdersOpen ||
    isMasterclassPromoOpen;
  isPageOverlayLockedRef.current = isPageOverlayLocked;

  const cancelAddressSelection = () => {
    setIsAddressPromptOpen(false);
    setIsAddressModalOpen(false);
    setPendingCartItem(null);
  };

  useBodyScrollLock(
    isPageOverlayLocked,
    () => {
      if (needsOnboarding) {
        return;
      }

      if (isAddressModalOpen || isAddressPromptOpen) {
        cancelAddressSelection();
        return;
      }

      if (selectedProduct) {
        closeProductModal();
        return;
      }

      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }

      if (isRecentOrdersOpen) {
        setIsRecentOrdersOpen(false);
        return;
      }

      if (isMasterclassPromoOpen) {
        closeMasterclassPromo();
        return;
      }

      closeCartDrawer();
    }
  );

  useEffect(() => {
    let isCancelled = false;

    fetchCurrentSiteCustomer()
      .then((customer) => {
        if (!isCancelled) {
          setSiteCustomer(customer || null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSiteCustomer(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("authLink")) {
      setIsAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cart") !== "open") return;

    openCartDrawer();
    params.delete("cart");
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`
    );
  }, [openCartDrawer]);

  useEffect(() => {
    if (!window.location.hash) {
      return undefined;
    }

    let isCancelled = false;
    let frame = 0;
    const timers = [];

    const scrollToHashTarget = () => {
      if (isCancelled) {
        return;
      }

      const targetId = decodeURIComponent(window.location.hash.slice(1));
      const target = targetId ? document.getElementById(targetId) : null;

      if (target) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };

    frame = window.requestAnimationFrame(scrollToHashTarget);
    timers.push(window.setTimeout(scrollToHashTarget, 180));
    timers.push(window.setTimeout(scrollToHashTarget, 520));

    return () => {
      isCancelled = true;

      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    fetch(apiPath("siteStats"))
      .then(readApiJson)
      .then((data) => {
        if (!isCancelled) {
          setSiteStats({
            deliveredOrdersTotal: Number(data.deliveredOrdersTotal || 0)
          });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSiteStats(DEFAULT_SITE_STATS);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    fetch(apiPath("siteRecentOrders"))
      .then(readApiJson)
      .then((data) => {
        if (!isCancelled) {
          setSiteRecentOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSiteRecentOrders([]);
        }
      });

    return () => {
      isCancelled = true;
    };
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

  const finishAddingCartItem = (cartItem) => {
    if (editingCartLine) {
      replaceCartItem(editingCartLine.index, {
        ...cartItem,
        qty: Math.max(1, Number(editingCartLine.qty || 1))
      });
      setEditingCartLine(null);
    } else {
      addCartItem(cartItem);
    }

    setPendingCartItem(null);
    closeProductModal();
    openCartDrawer();
  };

  const addProductToCart = (cartItem) => {
    finishAddingCartItem(cartItem);
  };

  const addRecentOrderToCart = (order) => {
    const now = Date.now();
    const orderItems = (order?.items || []).map((item, index) => ({
      ...item,
      uid: `${item.productId || "recent"}-${order.id || "order"}-${now}-${index}`,
      qty: Math.max(1, Number(item.qty || 1)),
      unitPrice: Number(item.unitPrice || item.price || 0),
      image: item.image || item.visual || "",
      visual: item.visual || item.image || "",
      addons: Array.isArray(item.addons) ? item.addons : [],
      removed: Array.isArray(item.removed) ? item.removed : []
    }));

    if (!orderItems.length) {
      return;
    }

    addCartItems(orderItems);
    setIsRecentOrdersOpen(false);
    openCartDrawer();
  };

  const getEditableProductFromCartItem = (item) => {
    if (item?.productSnapshot?.id) {
      return item.productSnapshot;
    }

    const productId = item?.productId || item?.id;
    const knownProduct = productId ? editableProductById.get(productId) : null;

    if (knownProduct) {
      return knownProduct;
    }

    if (!item?.name) {
      return null;
    }

    const comboItems = Array.isArray(item.comboItems)
      ? item.comboItems.map((comboItem, index) => {
          const source = editableProductById.get(comboItem?.id);
          return (
            source || {
              id: comboItem?.id || `${productId || "combo"}-item-${index}`,
              category: "pizza",
              name: comboItem?.name || `Позиция ${index + 1}`,
              weight: comboItem?.weight || "",
              price: 0,
              image: item.image
            }
          );
        })
      : [];

    return {
      id: productId || item.uid || "cart-item",
      category: item.category || (comboItems.length ? "combo" : "pizza"),
      name: item.name,
      description: item.description || "",
      weight: item.weight || "",
      price: Number(item.unitPrice || item.price || 0),
      image: item.image,
      visual: item.visual,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      comboItems
    };
  };

  const editCartItem = (item, index) => {
    const productToEdit = getEditableProductFromCartItem(item);

    if (!productToEdit) {
      return;
    }

    setEditingCartLine({ index, qty: item.qty });
    closeCartDrawer();
    window.setTimeout(() => setSelectedProduct(productToEdit), 0);
  };

  const saveFulfillmentAndContinue = (fulfillment) => {
    const nextFulfillment = saveSiteFulfillment(fulfillment);
    setSiteFulfillment(nextFulfillment);
    setIsAddressPromptOpen(false);
    setIsAddressModalOpen(false);

    if (pendingCartItem) {
      finishAddingCartItem(pendingCartItem);
    }
  };

  const logoutCustomer = async () => {
    try {
      await fetch(apiPath("customerAuthLogout"), {
        method: "POST",
        credentials: "include"
      }).then(readApiJson);
    } catch {
      // The local preview can run without API. In that case just reset the UI state.
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

  return (
    <main className={`site-showcase ${isHeaderCompact ? "is-header-compact" : ""}`}>
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
        onEditItem={editCartItem}
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

      <SiteMasterclassPromo
        isDialogOpen={isMasterclassPromoOpen}
        autoOpenAllowed={
          !selectedProduct &&
          !isCartDrawerOpen &&
          !isAddressPromptOpen &&
          !isAddressModalOpen &&
          !isAuthModalOpen &&
          !needsOnboarding &&
          !isRecentOrdersOpen
        }
        onDialogOpen={openMasterclassPromo}
        onDialogClose={closeMasterclassPromo}
      />

      <SiteAboutSection
        deliveredOrdersTotal={siteStats.deliveredOrdersTotal}
        proofAddon={
          <SiteRecentOrders
            orders={siteRecentOrders}
            isOpen={isRecentOrdersOpen}
            onOpen={() => setIsRecentOrdersOpen(true)}
            onClose={() => setIsRecentOrdersOpen(false)}
            onAddOrder={addRecentOrderToCart}
          />
        }
      />

      <SiteMenuSection onProductOpen={setSelectedProduct} />

      <SiteProductModal
        product={selectedProduct}
        customer={siteCustomer}
        onClose={closeProductModal}
        onAddToCart={addProductToCart}
      />

      {isAddressPromptOpen ? (
        <SiteAddressPrompt
          onClose={cancelAddressSelection}
          onDelivery={() => {
            setAddressModalMode("delivery");
            setIsAddressPromptOpen(false);
            setIsAddressModalOpen(true);
          }}
          onPickup={() => {
            setAddressModalMode("pickup");
            setIsAddressPromptOpen(false);
            setIsAddressModalOpen(true);
          }}
          onLogin={() => {
            setIsAddressPromptOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      ) : null}

      {isAddressModalOpen ? (
        <SiteAddressModal
          initialFulfillment={{ ...siteFulfillment, mode: addressModalMode }}
          onClose={cancelAddressSelection}
          onSave={saveFulfillmentAndContinue}
        />
      ) : null}

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

      <section className="site-section-v2 site-family-feature" id="kids">
        <div className="site-family-photo site-family-photo-stack">
          <img src={`${ASSET}kids-zone-real.webp`} alt="Детская зона пиццерии Вместе Вкуснее" loading="lazy" />
          <div className="site-photo-caption">
            <Baby size={18} />
            Большая детская зона за стеклом
          </div>
        </div>
        <div className="site-family-panel">
          <p className="site-eyebrow">В зале</p>
          <h2>Родители отдыхают, дети играют рядом</h2>
          <p>
            Детская зона за стеклом помогает провести вечер спокойно:
            ребенок занят, а родители видят его из зала.
          </p>
          <div className="site-family-facts">
            <span>
              <Baby size={17} />
              Детская зона
            </span>
            <span>
              <ChefHat size={17} />
              Открытая кухня
            </span>
            <span>
              <CakeSlice size={17} />
              Праздники
            </span>
          </div>
          <div className="site-family-note">
            <HeartHandshake size={20} />
            <span>Подходит для семейного ужина, дня рождения и спокойного обеда после прогулки.</span>
          </div>
        </div>
      </section>

      <section className="site-section-v2 site-events-section" id="events">
        <div className="site-events-copy">
          <p className="site-eyebrow">Праздники и встречи</p>
          <h2>Можно прийти на ужин, а можно собрать событие</h2>
          <p>
            Для банкетов, детских дней рождения и семейных праздников поможем подобрать меню,
            время и формат посадки.
          </p>
          <div className="site-events-actions">
            <a className="site-primary-btn" href="#contacts">
              <CalendarCheck size={18} />
              Обсудить бронь
            </a>
            <a className="site-dark-btn" href={getSiteOrderPath()}>
              <Truck size={18} />
              Заказать домой
            </a>
          </div>
        </div>
        <div className="site-events-grid">
          {eventCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className="site-event-card" key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <SiteGallerySection />

      <SiteFaqSection />

      <SiteMapSection />

      <SiteSeoSection />

      <SiteFooter />

    </main>
  );
}
