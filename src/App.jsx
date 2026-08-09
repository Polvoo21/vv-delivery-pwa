import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import MainSite from "./components/MainSite";
import { getLegalDocument } from "./components/site/legalData";
import { calculateCartTotals, formatPrice } from "./utils/price";
import { showLocalNotification } from "./utils/notifications";
import {
  getMasterclassEventByPath,
  INDIVIDUAL_MASTERCLASS_PAGE,
  INDIVIDUAL_MASTERCLASS_PATH,
  MASTERCLASSES_PATH,
  normalizeMasterclassPath
} from "../shared/masterclass-events";
import { isKnownFrontendPath, isPathWithin } from "../shared/site-routes.js";
import { getSiteSeoPage } from "../shared/site-seo.js";
import {
  clearAppData,
  hasOpenedBefore,
  initialAppData,
  loadAppData,
  markOpened,
  saveAppData
} from "./utils/storage";
import { syncSiteSeoHead } from "./utils/siteSeo";
import { METRIKA_GOALS, reachMetrikaGoal } from "./utils/analytics";

const AddressScreen = lazy(() => import("./components/AddressScreen"));
const AdminApp = lazy(() => import("./components/AdminApp"));
const CartSheet = lazy(() => import("./components/CartSheet"));
const CheckoutSheet = lazy(() => import("./components/CheckoutSheet"));
const HomeScreen = lazy(() => import("./components/HomeScreen"));
const InfoSheet = lazy(() => import("./components/InfoSheet"));
const ProductModal = lazy(() => import("./components/ProductModal"));
const ProfileSheet = lazy(() => import("./components/ProfileSheet"));
const PromoCodeSheet = lazy(() => import("./components/PromoCodeSheet"));
const PartnerApp = lazy(() => import("./components/PartnerApp"));
const SplashScreen = lazy(() => import("./components/SplashScreen"));
const Toast = lazy(() => import("./components/Toast"));

function lazyNamed(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}

const LegalPage = lazyNamed(() => import("./components/site/LegalPage"), "LegalPage");
const SiteCheckoutPage = lazyNamed(() => import("./components/site/SiteCheckoutPage"), "SiteCheckoutPage");
const SiteCustomerOrdersPage = lazyNamed(
  () => import("./components/site/SiteCustomerOrdersPage"),
  "SiteCustomerOrdersPage"
);
const SiteDeliveryPage = lazyNamed(() => import("./components/site/SiteDeliveryPage"), "SiteDeliveryPage");
const SiteDeliveryZonesPage = lazyNamed(
  () => import("./components/site/SiteDeliveryZonesPage"),
  "SiteDeliveryZonesPage"
);
const SiteGalleryPage = lazyNamed(() => import("./components/site/SiteGalleryPage"), "SiteGalleryPage");
const SiteLostItemsPage = lazyNamed(() => import("./components/site/SiteLostItemsPage"), "SiteLostItemsPage");
const SiteIndividualMasterclassPage = lazyNamed(
  () => import("./components/site/SiteIndividualMasterclassPage"),
  "SiteIndividualMasterclassPage"
);
const SiteMasterClassPage = lazyNamed(
  () => import("./components/site/SiteMasterClassPage"),
  "SiteMasterClassPage"
);
const SiteMasterclassesPage = lazyNamed(
  () => import("./components/site/SiteMasterclassesPage"),
  "SiteMasterclassesPage"
);
const SiteNoGlovesPage = lazyNamed(() => import("./components/site/SiteNoGlovesPage"), "SiteNoGlovesPage");
const SiteNotFoundPage = lazyNamed(() => import("./components/site/SiteNotFoundPage"), "SiteNotFoundPage");
const SitePaymentPage = lazyNamed(() => import("./components/site/SitePaymentPage"), "SitePaymentPage");

function RouteLoadingFallback() {
  return (
    <main className="route-loading-fallback" aria-live="polite" aria-busy="true">
      <span aria-hidden="true" />
      <p>Загружаем страницу…</p>
    </main>
  );
}

function cloneInitialData() {
  return JSON.parse(JSON.stringify(initialAppData));
}

function ClientApp() {
  const [data, setData] = useState(() => loadAppData());
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState(() => (loadAppData().fulfillment.address ? "home" : "address"));
  const [selectedCategory, setSelectedCategory] = useState("featured");
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [infoStory, setInfoStory] = useState(null);
  const [toast, setToast] = useState("");

  const totals = useMemo(
    () => calculateCartTotals(data.cart, data.promo),
    [data.cart, data.promo]
  );

  useEffect(() => {
    const delay = hasOpenedBefore() ? 1100 : 2400;
    const timer = setTimeout(() => {
      markOpened();
      setShowSplash(false);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message) {
    setToast(message);
  }

  function saveFulfillment(fulfillment) {
    setData((current) => ({
      ...current,
      fulfillment
    }));
    setScreen("home");
    showToast(fulfillment.mode === "pickup" ? "Самовывоз выбран" : "Адрес доставки сохранён");
  }

  function addToCart(item) {
    setData((current) => ({
      ...current,
      cart: [...current.cart, item]
    }));
    setActiveProduct(null);
    showToast("Добавлено в корзину");
    reachMetrikaGoal(METRIKA_GOALS.ADD_TO_CART, {
      product_id: item.productId || item.id || "",
      product_name: item.name || "",
      price: Number(item.unitPrice || item.price || 0),
      quantity: Number(item.qty || 1)
    });
  }

  function changeQty(uid, delta) {
    setData((current) => ({
      ...current,
      cart: current.cart
        .map((item) => (item.uid === uid ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    }));
  }

  function removeFromCart(uid) {
    setData((current) => ({
      ...current,
      cart: current.cart.filter((item) => item.uid !== uid)
    }));
  }

  function clearCart() {
    setData((current) => ({
      ...current,
      cart: []
    }));
    showToast("Корзина очищена");
  }

  function addUpsell(product) {
    addToCart({
      uid: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId: product.id,
      category: product.category,
      name: product.name,
      description: product.description,
      image: product.image,
      visual: product.visual,
      qty: 1,
      unitPrice: product.price,
      size: null,
      dough: null,
      addons: [],
      removed: []
    });
  }

  function applyPromo(promo) {
    setData((current) => ({
      ...current,
      promo
    }));
    showToast(`Промокод ${promo.code} применён`);
  }

  function openCheckout() {
    if (!data.cart.length) {
      showToast("Корзина пустая");
      return;
    }
    setActiveSheet("checkout");
  }

  function handleSuccessfulOrder(order, responseData = {}) {
    const orderTime = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    setData((current) => ({
      ...current,
      customer: {
        name: order.customerName,
        phone: order.customerPhone
      },
      cart: [],
      orders: [
        {
          id: responseData.orderId || String(Date.now()).slice(-6),
          time: orderTime,
          total: order.total,
          mode: order.mode,
          status: "Принят"
        },
        ...current.orders
      ].slice(0, 10)
    }));

    setActiveSheet(null);
    showToast("Заказ отправлен");

    if ("Notification" in window && Notification.permission === "granted") {
      showLocalNotification("Заказ отправлен", "Тестовый заказ ушёл администратору");
    }
  }

  async function testNotification() {
    const result = await showLocalNotification("Вместе Вкуснее", "Тестовое уведомление работает");
    showToast(result.message);
  }

  function clearAllData() {
    clearAppData();
    setData(cloneInitialData());
    setScreen("address");
    setSelectedCategory("featured");
    setActiveSheet(null);
    setActiveProduct(null);
    setInfoStory(null);
    showToast("Данные приложения очищены");
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  const shouldShowHome = screen === "home" && data.fulfillment.address;

  return (
    <>
      {shouldShowHome ? (
        <HomeScreen
          fulfillment={data.fulfillment}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenInfo={setInfoStory}
          onOpenProduct={setActiveProduct}
          onOpenProfile={() => setActiveSheet("profile")}
          onChangeAddress={() => setScreen("address")}
        />
      ) : (
        <AddressScreen fulfillment={data.fulfillment} onSave={saveFulfillment} onToast={showToast} />
      )}

      {data.cart.length && shouldShowHome ? (
        <button className="floating-cart" type="button" onClick={() => setActiveSheet("cart")}>
          <span>{data.cart.reduce((sum, item) => sum + item.qty, 0)}</span>
          <b>Корзина · {formatPrice(totals.total)} ₽</b>
        </button>
      ) : null}

      {activeProduct ? (
        <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} onAddToCart={addToCart} />
      ) : null}

      {activeSheet === "cart" ? (
        <CartSheet
          key="cart"
          cart={data.cart}
          promo={data.promo}
          onClose={() => setActiveSheet(null)}
          onQty={changeQty}
          onRemove={removeFromCart}
          onClear={clearCart}
          onAddUpsell={addUpsell}
          onOpenPromo={() => setActiveSheet("promo")}
          onCheckout={openCheckout}
        />
      ) : null}

      {activeSheet === "promo" ? (
        <PromoCodeSheet
          key="promo"
          promo={data.promo}
          onApply={applyPromo}
          onClose={() => setActiveSheet("cart")}
        />
      ) : null}

      {activeSheet === "checkout" ? (
        <CheckoutSheet
          key="checkout"
          cart={data.cart}
          promo={data.promo}
          fulfillment={data.fulfillment}
          customer={data.customer}
          onClose={() => setActiveSheet("cart")}
          onSubmit={handleSuccessfulOrder}
        />
      ) : null}

      {activeSheet === "profile" ? (
        <ProfileSheet
          key="profile"
          customer={data.customer}
          fulfillment={data.fulfillment}
          orders={data.orders}
          onClose={() => setActiveSheet(null)}
          onTestNotification={testNotification}
          onClearData={clearAllData}
        />
      ) : null}

      <InfoSheet key={infoStory?.id || "info"} story={infoStory} onClose={() => setInfoStory(null)} />
      <Toast message={toast} />
    </>
  );
}

export default function App() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const seoPage = useMemo(() => getSiteSeoPage(pathname), [pathname]);
  const isLegalPath = isPathWithin(pathname, "/legal");
  const legalDocument = isLegalPath ? getLegalDocument(pathname) : null;
  const isCheckoutPath = pathname === "/checkout" || pathname === "/dev/checkout";
  const isPaymentPath = pathname === "/payment" || pathname === "/dev/payment";
  const isCustomerOrdersPath =
    pathname === "/account/orders" ||
    pathname.startsWith("/account/orders/") ||
    pathname === "/dev/account/orders" ||
    pathname.startsWith("/dev/account/orders/");
  const isGalleryPath = pathname === "/gallery" || pathname === "/dev/gallery";
  const isDeliveryInfoPath = pathname === "/dostavka" || pathname === "/dev/dostavka";
  const isDeliveryZonesPath = pathname === "/delivery-zones" || pathname === "/dev/delivery-zones";
  const isLostPath = pathname === "/lost" || pathname === "/dev/lost" || pathname === "/poteryashki" || pathname === "/dev/poteryashki";
  const isNoGlovesPath = pathname === "/bez-perchatok" || pathname === "/dev/bez-perchatok";
  const normalizedMasterclassPath = normalizeMasterclassPath(pathname);
  const masterclassEvent = getMasterclassEventByPath(pathname);
  const isIndividualMasterclassPath =
    normalizedMasterclassPath === INDIVIDUAL_MASTERCLASS_PATH;
  const isMasterclassesPath = normalizedMasterclassPath === MASTERCLASSES_PATH;
  const isMasterClassPath = Boolean(masterclassEvent);
  const isSitePath =
    isPathWithin(pathname, "/site") ||
    isPathWithin(pathname, "/dev") ||
    isCheckoutPath ||
    isPaymentPath ||
    isCustomerOrdersPath ||
    isLegalPath ||
    isGalleryPath ||
    isDeliveryInfoPath ||
    isDeliveryZonesPath ||
    isLostPath ||
    isNoGlovesPath ||
    isIndividualMasterclassPath ||
    isMasterclassesPath ||
    isMasterClassPath;
  const isAdmin = hostname.startsWith("admin.") || isPathWithin(pathname, "/admin");
  const adminRoleHint = new URLSearchParams(window.location.search).get("role");
  const isPartner = hostname.startsWith("partners.") || isPathWithin(pathname, "/partners");
  const isDelivery =
    !isSitePath &&
    (hostname.startsWith("delivery.") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      isPathWithin(pathname, "/delivery"));
  const isSite =
    hostname === "vmestevkusnee.ru" ||
    hostname === "www.vmestevkusnee.ru" ||
    isSitePath;
  const supportsPublicNotFound =
    hostname === "vmestevkusnee.ru" ||
    hostname === "www.vmestevkusnee.ru" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";
  const isNotFoundPath =
    supportsPublicNotFound && !isAdmin && !isPartner && !isKnownFrontendPath(pathname);

  useEffect(() => {
    const manifest = document.querySelector('link[rel="manifest"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const theme = document.querySelector('meta[name="theme-color"]');

    if (isNotFoundPath) {
      document.title = "Страница не найдена | Вместе Вкуснее";
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f3f4f6");
    } else if (isAdmin) {
      const isStaff = adminRoleHint === "admin";
      document.title = isStaff
        ? "Вместе Вкуснее | Администратор"
        : "Вместе Вкуснее | Руководитель";
      manifest?.setAttribute(
        "href",
        isStaff ? "/admin-staff-manifest.json" : "/admin-manifest.json"
      );
      appleTitle?.setAttribute("content", isStaff ? "ВВ Администратор" : "ВВ Руководитель");
      theme?.setAttribute("content", "#f2f3f7");
    } else if (isPartner) {
      document.title = "Вместе Вкуснее | Партнёры";
      manifest?.setAttribute("href", "/partner-manifest.json");
      appleTitle?.setAttribute("content", "ВВ Партнёры");
      theme?.setAttribute("content", "#f2f3f7");
    } else if (isLegalPath) {
      document.title = `${legalDocument.title} | Вместе Вкуснее`;
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isGalleryPath) {
      document.title = "Галерея | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isDeliveryInfoPath) {
      document.title = "Доставка пиццы и еды в Чебоксарах | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isDeliveryZonesPath) {
      document.title = "Зоны доставки | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isLostPath) {
      document.title = "Потеряшки | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isNoGlovesPath) {
      document.title = "Почему мы готовим без перчаток | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isIndividualMasterclassPath) {
      document.title = INDIVIDUAL_MASTERCLASS_PAGE.seoTitle;
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f3f4f6");
    } else if (isMasterclassesPath) {
      document.title = "Кулинарные мастер-классы в Чебоксарах | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f3f4f6");
    } else if (isMasterClassPath) {
      document.title = masterclassEvent.seoTitle;
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f3f4f6");
    } else if (isCheckoutPath) {
      document.title = "Оформление заказа | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isPaymentPath) {
      document.title = "Оплата заказа | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isCustomerOrdersPath) {
      document.title = "Мои заказы | Вместе Вкуснее";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#f1f3f6");
    } else if (isSite && !isDelivery) {
      document.title = "Вместе Вкуснее | Семейная пиццерия";
      manifest?.setAttribute("href", "/site-manifest.json");
      appleTitle?.setAttribute("content", "Вместе Вкуснее");
      theme?.setAttribute("content", "#47633f");
    } else {
      document.title = "Вместе Вкуснее | Доставка";
      manifest?.setAttribute("href", "/manifest.json");
      appleTitle?.setAttribute("content", "ВВ Доставка");
      theme?.setAttribute("content", "#47633f");
    }

    if (seoPage && !isAdmin && !isPartner && !isDelivery && !isNotFoundPath) {
      syncSiteSeoHead(seoPage);
    }
  }, [
    isAdmin,
    isNotFoundPath,
    adminRoleHint,
    isPartner,
    isDelivery,
    isSite,
    isCheckoutPath,
    isPaymentPath,
    isCustomerOrdersPath,
    isLegalPath,
    isGalleryPath,
    isDeliveryInfoPath,
    isDeliveryZonesPath,
    isLostPath,
    isNoGlovesPath,
    isIndividualMasterclassPath,
    isMasterclassesPath,
    isMasterClassPath,
    masterclassEvent,
    legalDocument,
    seoPage
  ]);

  let route = <ClientApp />;

  if (isAdmin) route = <AdminApp />;
  else if (isPartner) route = <PartnerApp />;
  else if (isNotFoundPath) route = <SiteNotFoundPage />;
  else if (isCheckoutPath) route = <SiteCheckoutPage />;
  else if (isPaymentPath) route = <SitePaymentPage />;
  else if (isCustomerOrdersPath) route = <SiteCustomerOrdersPage />;
  else if (isLegalPath) route = <LegalPage />;
  else if (isDeliveryInfoPath) route = <SiteDeliveryPage />;
  else if (isDeliveryZonesPath) route = <SiteDeliveryZonesPage />;
  else if (isGalleryPath) route = <SiteGalleryPage />;
  else if (isLostPath) route = <SiteLostItemsPage />;
  else if (isNoGlovesPath) route = <SiteNoGlovesPage />;
  else if (isIndividualMasterclassPath) route = <SiteIndividualMasterclassPage />;
  else if (isMasterclassesPath) route = <SiteMasterclassesPage />;
  else if (isMasterClassPath) route = <SiteMasterClassPage event={masterclassEvent} />;
  else if (isSite && !isDelivery) route = <MainSite />;

  return <Suspense fallback={<RouteLoadingFallback />}>{route}</Suspense>;
}
