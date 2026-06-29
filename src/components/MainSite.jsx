import {
  Baby,
  Clock,
  Coffee,
  MapPin,
  Phone,
  Salad,
  Sparkles,
  Utensils
} from "lucide-react";
import { RESTAURANT } from "../data/config";
import { MENU } from "../data/menu";
import { formatPrice } from "../utils/price";

const DELIVERY_URL = "https://delivery.vmestevkusnee.ru";
const PHONE = "+7 (8352) 66-77-77";

const highlights = [
  {
    icon: Utensils,
    title: "Семейная пиццерия",
    text: "Пицца, горячие блюда, завтраки, десерты и напитки для спокойного семейного обеда."
  },
  {
    icon: Baby,
    title: "Детская зона",
    text: "Большая зона за стеклом: родители отдыхают за столом и видят ребёнка."
  },
  {
    icon: Coffee,
    title: "Завтраки и кофе",
    text: "Утро, выпечка, кофе и мягкий формат встреч без суеты."
  }
];

const menuPreview = MENU.filter((item) =>
  ["pepperoni-honey", "pear-gorgonzola", "caesar", "bento-cake", "berry-mors", "chicken-tomato"].includes(item.id)
);

export default function MainSite() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="site-logo" href="#top" aria-label="Вместе Вкуснее">
          <img src="/icons/icon-192.png" alt="" />
          <span>Вместе Вкуснее</span>
        </a>
        <nav className="site-nav" aria-label="Разделы сайта">
          <a href="#menu">Меню</a>
          <a href="#family">Семейный формат</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <a className="site-order-link" href={DELIVERY_URL}>
          Заказать
        </a>
      </header>

      <section className="site-hero" id="top">
        <img className="site-hero-image" src="/assets/pizza-main.webp" alt="" />
        <div className="site-hero-shade" />
        <div className="site-hero-content">
          <p>Семейная пиццерия в Чебоксарах</p>
          <h1>Вместе Вкуснее</h1>
          <span>
            Пицца, завтраки, обеды, десерты и уютный зал с детской зоной за стеклом.
          </span>
          <div className="site-hero-actions">
            <a href={DELIVERY_URL}>Заказать доставку</a>
            <a href={`tel:${PHONE.replace(/\D/g, "")}`}>Позвонить</a>
          </div>
        </div>
        <div className="site-hero-meta" aria-label="Адрес и график">
          <span>
            <MapPin size={16} />
            {RESTAURANT.address}
          </span>
          <span>
            <Clock size={16} />
            {RESTAURANT.workHours}
          </span>
        </div>
      </section>

      <section className="site-section site-intro" id="family">
        <div className="site-section-title">
          <p>Формат</p>
          <h2>Место для семейных встреч, быстрых обедов и домашней доставки</h2>
        </div>
        <div className="site-highlight-grid">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="site-highlight">
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-section site-feature-band">
        <div>
          <p>Доставка и самовывоз</p>
          <h2>Удобный заказ в отдельном приложении</h2>
          <span>
            Выберите адрес, добавьте блюда в корзину, примените промокод и отслеживайте статус заказа.
          </span>
        </div>
        <a href={DELIVERY_URL}>Открыть доставку</a>
      </section>

      <section className="site-section" id="menu">
        <div className="site-section-title">
          <p>Меню</p>
          <h2>Пицца, обеды и десерты на каждый день</h2>
        </div>
        <div className="site-menu-grid">
          {menuPreview.map((item) => (
            <article className="site-menu-card" key={item.id}>
              <div className={`site-menu-visual ${item.image ? "has-image" : ""}`}>
                {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span>{item.visual}</span>}
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <strong>от {formatPrice(item.price)} ₽</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-family-row">
        <div className="site-family-copy">
          <p>В зале</p>
          <h2>Детская зона за стеклом</h2>
          <span>
            Родители могут спокойно поесть, а ребёнок остаётся в поле зрения. Формат для семейных ужинов,
            дней рождения и встреч после прогулки.
          </span>
        </div>
        <div className="site-family-card">
          <Sparkles size={28} />
          <b>Уютно, современно, по-домашнему</b>
          <span>Молочные оттенки, зелёные акценты, горячая пицца и спокойное семейное настроение.</span>
        </div>
      </section>

      <section className="site-section site-contacts" id="contacts">
        <div>
          <p>Контакты</p>
          <h2>Чебоксары, ул. Пирогова, 1Т</h2>
          <span>Работаем ежедневно {RESTAURANT.workHours}</span>
        </div>
        <div className="site-contact-actions">
          <a href={`tel:${PHONE.replace(/\D/g, "")}`}>
            <Phone size={18} />
            {PHONE}
          </a>
          <a href={DELIVERY_URL}>
            <Salad size={18} />
            Заказать доставку
          </a>
        </div>
      </section>
    </main>
  );
}
