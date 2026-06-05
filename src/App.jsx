import { useEffect, useMemo, useState } from "react";
import AddressScreen from "./components/AddressScreen";
import AdminApp from "./components/AdminApp";
import CartSheet from "./components/CartSheet";
import CheckoutSheet from "./components/CheckoutSheet";
import HomeScreen from "./components/HomeScreen";
import InfoSheet from "./components/InfoSheet";
import ProductModal from "./components/ProductModal";
import ProfileSheet from "./components/ProfileSheet";
import PromoCodeSheet from "./components/PromoCodeSheet";
import SplashScreen from "./components/SplashScreen";
import Toast from "./components/Toast";
import { OFFER_DISCOUNT } from "./data/config";
import { calculateCartTotals, formatPrice } from "./utils/price";
import { showLocalNotification } from "./utils/notifications";
import {
  clearAppData,
  hasOpenedBefore,
  initialAppData,
  loadAppData,
  markOpened,
  saveAppData
} from "./utils/storage";

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
    () => calculateCartTotals(data.cart, data.promo, data.offer),
    [data.cart, data.offer, data.promo]
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

  function activateOffer() {
    setData((current) => ({
      ...current,
      offer: {
        ...OFFER_DISCOUNT,
        active: true
      }
    }));
    showToast("Скидка 25% активирована");
  }

  function addToCart(item) {
    setData((current) => ({
      ...current,
      cart: [...current.cart, item]
    }));
    setActiveProduct(null);
    showToast("Добавлено в корзину");
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
    showToast("Промокод VV25 применён");
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
          offer={data.offer}
          onActivateOffer={activateOffer}
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
          cart={data.cart}
          promo={data.promo}
          offer={data.offer}
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
          promo={data.promo}
          offer={data.offer}
          onApply={applyPromo}
          onClose={() => setActiveSheet("cart")}
        />
      ) : null}

      {activeSheet === "checkout" ? (
        <CheckoutSheet
          cart={data.cart}
          promo={data.promo}
          offer={data.offer}
          fulfillment={data.fulfillment}
          customer={data.customer}
          onClose={() => setActiveSheet("cart")}
          onSubmit={handleSuccessfulOrder}
        />
      ) : null}

      {activeSheet === "profile" ? (
        <ProfileSheet
          customer={data.customer}
          fulfillment={data.fulfillment}
          orders={data.orders}
          onClose={() => setActiveSheet(null)}
          onTestNotification={testNotification}
          onClearData={clearAllData}
        />
      ) : null}

      <InfoSheet story={infoStory} onClose={() => setInfoStory(null)} />
      <Toast message={toast} />
    </>
  );
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const manifest = document.querySelector('link[rel="manifest"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const theme = document.querySelector('meta[name="theme-color"]');

    if (isAdmin) {
      document.title = "Вместе Вкуснее | Админка";
      manifest?.setAttribute("href", "/admin-manifest.json");
      appleTitle?.setAttribute("content", "ВВ Админ");
      theme?.setAttribute("content", "#11130f");
    } else {
      document.title = "Вместе Вкуснее | Доставка";
      manifest?.setAttribute("href", "/manifest.json");
      appleTitle?.setAttribute("content", "ВВ Доставка");
      theme?.setAttribute("content", "#47633f");
    }
  }, [isAdmin]);

  return isAdmin ? <AdminApp /> : <ClientApp />;
}
