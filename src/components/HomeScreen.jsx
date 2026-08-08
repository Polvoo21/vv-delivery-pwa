import { Bell, ChefHat, Clock3, MapPin, ShoppingBag, Sparkles, Store, UserRound } from "lucide-react";
import { CATEGORY_LIST, STORIES, RESTAURANT } from "../data/config";
import { MENU } from "../data/menu";
import { formatPrice } from "../utils/price";
import { getProductInitials } from "../utils/productVisual";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import StoriesRow from "./StoriesRow";

export default function HomeScreen({
  fulfillment,
  selectedCategory,
  onSelectCategory,
  onOpenInfo,
  onOpenProduct,
  onOpenProfile,
  onChangeAddress
}) {
  const products =
    selectedCategory === "featured"
      ? MENU.filter((product) => product.featured)
      : MENU.filter((product) => product.category === selectedCategory);

  const heroProduct = MENU.find((product) => product.id === "pear-dor-blue") || MENU.find((product) => product.featured);
  const quickProducts = [
    MENU.find((product) => product.id === "pepperoni"),
    MENU.find((product) => product.id === "bento-cake"),
    MENU.find((product) => product.id === "berry-mors")
  ].filter(Boolean);
  const selectedCategoryTitle =
    CATEGORY_LIST.find((category) => category.id === selectedCategory)?.title || "Меню";
  const fulfillmentLabel =
    fulfillment.mode === "pickup" ? `Самовывоз: ${RESTAURANT.shortAddress}` : fulfillment.address;
  const fulfillmentEta = fulfillment.mode === "pickup" ? RESTAURANT.pickupEta : RESTAURANT.deliveryEta;

  function goPizza() {
    onSelectCategory("pizza");
    setTimeout(() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }), 40);
  }

  return (
    <main className="app-shell delivery-app">
      <header className="home-topbar">
        <div className="delivery-brand-lockup" aria-label="Вместе Вкуснее">
          <img src="/icons/icon-192.png" alt="" />
          <span>
            <b>Вместе Вкуснее</b>
            <small>Пицца, обеды, самовывоз</small>
          </span>
        </div>
        <button className="address-button" type="button" onClick={onChangeAddress}>
          <MapPin size={18} />
          <span>
            <b>{fulfillmentLabel}</b>
            <small>{fulfillmentEta}</small>
          </span>
        </button>
        <button className="icon-button" type="button" onClick={onOpenProfile} aria-label="Личный кабинет">
          <UserRound size={21} />
        </button>
      </header>

      <div className="delivery-workspace">
        <div className="delivery-main-column">
          <StoriesRow stories={STORIES} onOpen={onOpenInfo} />

          <section className="delivery-quick-picks" aria-label="Быстрый выбор">
            {quickProducts.map((product, index) => (
              <button
                key={product.id}
                className={index === 0 ? "quick-pick-card quick-pick-card-featured" : "quick-pick-card"}
                type="button"
                onClick={() => onOpenProduct(product)}
              >
                <span className="quick-pick-visual">
                  {product.image ? (
                    <img src={product.image} alt="" />
                  ) : (
                    <span className="product-placeholder" aria-hidden="true">
                      {getProductInitials(product)}
                    </span>
                  )}
                </span>
                <span className="quick-pick-copy">
                  <b>{product.name}</b>
                  <small>от {formatPrice(product.price)} ₽</small>
                </span>
              </button>
            ))}
          </section>

          <section id="menu-section" className="menu-section">
            <div className="catalog-heading">
              <div>
                <p className="eyebrow">Меню</p>
                <h2>{selectedCategoryTitle}</h2>
              </div>
              <span>{products.length} позиций</span>
            </div>
            <CategoryTabs categories={CATEGORY_LIST} selected={selectedCategory} onSelect={onSelectCategory} />
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
              ))}
            </div>
          </section>

          <section className="family-builder">
            <div>
              <p className="eyebrow">На вечер</p>
              <h2>Соберите ужин для семьи</h2>
              <span>Пицца, напитки и десерт в одном заказе</span>
            </div>
            <button type="button" onClick={goPizza}>
              <ShoppingBag size={18} />
              К пицце
            </button>
          </section>

          <section className="notice-strip" aria-label="Уведомления приложения">
            <Bell size={18} />
            <span>После заказа покажем статус и сохраним историю на этом устройстве</span>
          </section>
        </div>

        <aside className="delivery-side-panel" aria-label="Информация о заказе">
          <section className="delivery-side-card">
            <span className="side-icon">
              <Store size={20} />
            </span>
            <p className="eyebrow">Пиццерия</p>
            <h3>Пирогова, 1Т</h3>
            <p>Самовывоз за 15–20 минут. Детская зона за стеклом, завтраки и обеды каждый день.</p>
          </section>

          <section className="hero-product">
            <div className="hero-copy">
              <span className="hero-badge">новинка</span>
              <h2>Пицца с грушей и горгонзолой</h2>
              <p>{heroProduct.description}</p>
              <button type="button" onClick={() => onOpenProduct(heroProduct)}>
                от {formatPrice(heroProduct.price)} ₽
              </button>
            </div>
            <img src="/assets/pizza-main.webp" alt="" />
          </section>

          <section className="delivery-side-card delivery-side-card-dark">
            <span className="side-icon">
              <Sparkles size={20} />
            </span>
            <h3>Статус заказа в приложении</h3>
            <p>После отправки администратор увидит заказ, а вы получите обновления статуса.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
