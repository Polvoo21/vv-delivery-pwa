import {
  Baby,
  CakeSlice,
  ChefHat,
  Clock,
  Coffee,
  Flame,
  MapPin,
  Phone,
  Pizza,
  Salad,
  ShoppingBag,
  Sparkles,
  Star,
  Truck
} from "lucide-react";
import { RESTAURANT } from "../data/config";
import { MENU } from "../data/menu";
import { formatPrice } from "../utils/price";

const DELIVERY_URL = "https://delivery.vmestevkusnee.ru";
const PARTNERS_URL = "https://partners.vmestevkusnee.ru";
const PHONE = "+7 (8352) 66-77-77";

const categoryTabs = [
  { id: "pizza", label: "Пицца" },
  { id: "lunch", label: "Обеды" },
  { id: "dessert", label: "Десерты" },
  { id: "drink", label: "Напитки" }
];

const storyCards = [
  {
    title: "Итальянское тесто",
    text: "Готовим как в Италии",
    image: "/assets/site/feature-dough.webp"
  },
  {
    title: "Morello Forni",
    text: "Печь из Италии",
    image: "/assets/site/feature-oven.webp"
  },
  {
    title: "Детская за стеклом",
    text: "Видно из зала",
    image: "/assets/site/feature-kids.webp"
  },
  {
    title: "Завтраки и ланчи",
    text: "Вкусно весь день",
    image: "/assets/site/feature-breakfast.webp"
  }
];

const trustItems = [
  {
    icon: Pizza,
    title: "Пицца на правильном тесте",
    text: "Румяный край, мягкая середина и понятные сочетания для всей семьи."
  },
  {
    icon: Baby,
    title: "Большая детская зона",
    text: "Родители отдыхают за столом и видят ребёнка через стекло."
  },
  {
    icon: Coffee,
    title: "Завтраки, обеды, кофе",
    text: "Формат на каждый день: утром, в обед, вечером домой."
  }
];

const heroNews = [
  {
    title: "Летнее меню",
    text: "Салаты, напитки и сезонные десерты",
    image: "/assets/site/breakfast.webp"
  },
  {
    title: "Детские праздники",
    text: "Зал, пицца и игровая зона рядом",
    image: "/assets/site/kids-zone.webp"
  },
  {
    title: "Десерты к кофе",
    text: "Бенто, капкейки и сладкие подарки",
    image: "/assets/site/dessert.webp"
  }
];

const productImages = {
  pizza: "/assets/site/hero-pizza.webp",
  lunch: "/assets/site/breakfast.webp",
  dessert: "/assets/site/dessert.webp",
  drink: "/assets/site/feature-breakfast.webp"
};

const menuByCategory = categoryTabs.map((category) => ({
  ...category,
  items: MENU.filter((item) => item.category === category.id)
}));

function telHref(phone) {
  return `tel:${phone.replace(/\D/g, "")}`;
}

function productImage(product) {
  return product.image && product.category === "pizza" ? "/assets/site/hero-pizza.webp" : productImages[product.category];
}

export default function MainSite() {
  return (
    <main className="site-shell site-page">
      <header className="site-topbar">
        <nav className="site-nav-left" aria-label="Основные разделы">
          <a href="#about">О нас</a>
          <a href="#menu">Меню</a>
          <a href="#kids">Детская</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <a className="site-brand" href="#top" aria-label="Вместе Вкуснее">
          <img src="/assets/site/vv-logo.png" alt="" />
          <span>Вместе Вкуснее</span>
        </a>
        <div className="site-nav-right">
          <a href={telHref(PHONE)}>{PHONE}</a>
          <a href={PARTNERS_URL}>Личный кабинет</a>
          <a className="site-book-btn" href="#contacts">Забронировать</a>
        </div>
      </header>

      <section className="site-hero-v2" id="top">
        <div className="site-hero-bg" />
        <div className="site-hero-main">
          <div className="site-pizza-stage">
            <div className="site-note">
              <span>Печь Morello Forni</span>
              <b>Румяный край и живое тесто</b>
            </div>
            <img src="/assets/site/hero-pizza.webp" alt="Пицца Вместе Вкуснее" />
          </div>

          <div className="site-hero-copy">
            <div className="site-location-pill">
              <MapPin size={16} />
              Чебоксары, Пирогова 1Т
            </div>
            <p className="site-eyebrow">Семейная итальянская пиццерия</p>
            <h1 className="site-hero-title">
              <span className="site-title-desktop">Настоящая пицца</span>
              <span className="site-title-mobile">Настоящая</span>
              <span className="site-title-mobile">пицца</span>
              <span>для всей семьи</span>
            </h1>
            <p className="site-hero-lead">
              Пицца на правильном тесте, завтраки, обеды, праздники и большая детская зона за стеклом.
            </p>
            <div className="site-hero-actions-v2">
              <a className="site-primary-btn" href="#menu">
                <Salad size={19} />
                Посмотреть меню
              </a>
              <a className="site-secondary-btn" href={DELIVERY_URL}>
                <Truck size={19} />
                Оформить доставку
              </a>
            </div>
            <a className="site-dark-btn" href="#contacts">Забронировать стол</a>
          </div>

          <aside className="site-news-stack" aria-label="Последние новости">
            {heroNews.map((item) => (
              <a href="#menu" className="site-news-card" key={item.title}>
                <img src={item.image} alt="" loading="lazy" />
                <span>{item.title}</span>
                <b>{item.text}</b>
              </a>
            ))}
          </aside>
        </div>

        <div className="site-story-rail" aria-label="Особенности пиццерии">
          {storyCards.map((item) => (
            <article className="site-story-card" key={item.title}>
              <img src={item.image} alt="" loading="lazy" />
              <div>
                <b>{item.title}</b>
                <span>{item.text}</span>
              </div>
            </article>
          ))}
          <a className="site-story-more" href="#about">
            <Sparkles size={24} />
            Последние новости
          </a>
        </div>
      </section>

      <section className="site-section-v2 site-about" id="about">
        <div className="site-section-heading">
          <p className="site-eyebrow">Почему к нам возвращаются</p>
          <h2>Уютный семейный формат без ощущения фудкорта</h2>
        </div>
        <div className="site-trust-grid">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="site-trust-card" key={item.title}>
                <Icon size={25} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-menu-section" id="menu">
        <div className="site-menu-head">
          <div>
            <p className="site-eyebrow">Меню</p>
            <h2>Пицца, обеды, десерты и напитки</h2>
          </div>
          <a href={DELIVERY_URL}>
            <ShoppingBag size={18} />
            Открыть доставку
          </a>
        </div>

        <div className="site-category-bar" aria-label="Категории меню">
          {categoryTabs.map((category) => (
            <a href={`#${category.id}`} key={category.id}>{category.label}</a>
          ))}
        </div>

        <div className="site-products">
          {menuByCategory.map((group) => (
            <section className="site-product-group" id={group.id} key={group.id}>
              <div className="site-product-group-title">
                <h3>{group.label}</h3>
                <span>{group.items.length} позиций</span>
              </div>
              <div className="site-product-grid">
                {group.items.map((product) => (
                  <article className="site-product-card" key={product.id}>
                    <div className={`site-product-visual ${product.category === "pizza" ? "is-pizza" : ""}`}>
                      <img src={productImage(product)} alt="" loading="lazy" />
                      {product.featured ? (
                        <span className="site-product-badge">
                          <Flame size={14} />
                          Хит
                        </span>
                      ) : null}
                    </div>
                    <div className="site-product-body">
                      <h4>{product.name}</h4>
                      <p>{product.description}</p>
                    </div>
                    <div className="site-product-bottom">
                      <strong>от {formatPrice(product.price)} ₽</strong>
                      <a href={DELIVERY_URL}>Выбрать</a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="site-section-v2 site-family-feature" id="kids">
        <div className="site-family-photo">
          <img src="/assets/site/interior.webp" alt="Зал пиццерии Вместе Вкуснее" loading="lazy" />
        </div>
        <div className="site-family-panel">
          <p className="site-eyebrow">В зале</p>
          <h2>Родители отдыхают, дети играют рядом</h2>
          <p>
            Детская зона за стеклом помогает провести вечер спокойно: ребёнок занят, а родители видят его из зала.
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
        </div>
      </section>

      <section className="site-contacts-v2" id="contacts">
        <div>
          <p className="site-eyebrow">Контакты</p>
          <h2>{RESTAURANT.address}</h2>
          <span>
            <Clock size={17} />
            Ежедневно {RESTAURANT.workHours}
          </span>
        </div>
        <div className="site-contact-buttons">
          <a href={telHref(PHONE)}>
            <Phone size={18} />
            {PHONE}
          </a>
          <a href={DELIVERY_URL}>
            <ShoppingBag size={18} />
            Заказать доставку
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>Вместе Вкуснее</span>
        <span>Семейная пиццерия в Чебоксарах</span>
        <span>
          <Star size={15} />
          MVP-сервис доставки
        </span>
      </footer>
    </main>
  );
}
