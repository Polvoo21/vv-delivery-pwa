import { Bell, MapPin, ShoppingBag, UserRound } from "lucide-react";
import { CATEGORY_LIST, STORIES, RESTAURANT } from "../data/config";
import { MENU } from "../data/menu";
import { formatPrice } from "../utils/price";
import CategoryTabs from "./CategoryTabs";
import OfferBanner from "./OfferBanner";
import ProductCard from "./ProductCard";
import StoriesRow from "./StoriesRow";

export default function HomeScreen({
  fulfillment,
  selectedCategory,
  onSelectCategory,
  offer,
  onActivateOffer,
  onOpenInfo,
  onOpenProduct,
  onOpenProfile,
  onChangeAddress
}) {
  const products =
    selectedCategory === "featured"
      ? MENU.filter((product) => product.featured)
      : MENU.filter((product) => product.category === selectedCategory);

  const heroProduct = MENU.find((product) => product.id === "pear-gorgonzola");

  function goPizza() {
    onSelectCategory("pizza");
    setTimeout(() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }), 40);
  }

  return (
    <main className="app-shell">
      <header className="home-topbar">
        <button className="address-button" type="button" onClick={onChangeAddress}>
          <MapPin size={18} />
          <span>
            <b>{fulfillment.mode === "pickup" ? `Самовывоз: ${RESTAURANT.shortAddress}` : fulfillment.address}</b>
            <small>{fulfillment.mode === "pickup" ? RESTAURANT.pickupEta : RESTAURANT.deliveryEta}</small>
          </span>
        </button>
        <button className="icon-button" type="button" onClick={onOpenProfile} aria-label="Личный кабинет">
          <UserRound size={21} />
        </button>
      </header>

      <StoriesRow stories={STORIES} onOpen={onOpenInfo} />

      <section className="family-builder">
        <div>
          <p className="eyebrow">На вечер</p>
          <h1>Соберите ужин для семьи</h1>
          <span>Пицца, напитки и десерт в одном заказе</span>
        </div>
        <button type="button" onClick={goPizza}>
          <ShoppingBag size={18} />
          К пицце
        </button>
      </section>

      <OfferBanner offer={offer} onActivate={onActivateOffer} />

      <section className="hero-product">
        <div className="hero-copy">
          <span className="hero-badge">новинка</span>
          <h2>Пицца как дома, только быстрее</h2>
          <p>{heroProduct.description}</p>
          <button type="button" onClick={() => onOpenProduct(heroProduct)}>
            от {formatPrice(heroProduct.price)} ₽
          </button>
        </div>
        <img src="/assets/pizza-main.webp" alt="" />
      </section>

      <section className="notice-strip" aria-label="Уведомления приложения">
        <Bell size={18} />
        <span>После заказа покажем статус и сохраним историю на этом устройстве</span>
      </section>

      <section id="menu-section" className="menu-section">
        <CategoryTabs categories={CATEGORY_LIST} selected={selectedCategory} onSelect={onSelectCategory} />
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
          ))}
        </div>
      </section>
    </main>
  );
}
