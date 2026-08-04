import { CheckCircle2, Clock, MapPin, Phone, Salad, Truck } from "lucide-react";
import { ASSET, PHONE, RESTAURANT, getSiteOrderPath, storyCards, telHref } from "./siteData";

const deliveredOrdersCount = 1248;

export function SiteHero() {
  const formattedDeliveredOrders = new Intl.NumberFormat("ru-RU").format(deliveredOrdersCount);

  return (
    <section className="site-hero-v2" id="top">
      <div className="site-hero-main">
        <div className="site-pizza-stage" aria-label="Пицца из печи">
          <div className="site-note">
            <span>Morello Forni</span>
            <b>Итальянская печь для настоящей корочки</b>
          </div>
          <img src={`${ASSET}concept-pizza-hero.png`} alt="Итальянская пицца Вместе Вкуснее" />
          <div className="site-hero-mini-card">
            <Clock size={18} />
            <span>Ежедневно</span>
            <b>{RESTAURANT.workHours}</b>
          </div>
        </div>

        <div className="site-hero-copy">
          <div className="site-location-pill">
            <MapPin size={16} />
            Чебоксары, Пирогова 1Т
          </div>
          <p className="site-eyebrow">Семейная итальянская пиццерия</p>
          <h1 className="site-hero-title">
            Итальянская пицца в Чебоксарах для всей семьи
          </h1>
          <p className="site-hero-subtitle">
            Настоящее тесто, живая печь и спокойный семейный зал
          </p>
          <p className="site-hero-lead">
            Готовим пиццу в профессиональной печи Morello Forni, подаем завтраки,
            бизнес-ланчи и обеды, принимаем семейные праздники и держим большую
            детскую зону за стеклом.
          </p>
          <div className="site-hero-cta-group" aria-label="Основные действия">
            <div className="site-hero-actions-v2">
              <a className="site-primary-btn" href="#summer">
                <Salad size={19} />
                Посмотреть меню
              </a>
              <a className="site-secondary-btn" href={getSiteOrderPath()}>
                <Truck size={19} />
                Оформить доставку
              </a>
            </div>
            <a className="site-dark-btn" href={telHref(PHONE)}>
              <Phone size={18} />
              Забронировать стол
            </a>
          </div>
          <div className="site-hero-order-counter" aria-label="Доставлено заказов на сегодня">
            <span>
              <CheckCircle2 size={18} />
              На сегодня доставлено
            </span>
            <b>{formattedDeliveredOrders}</b>
            <small>заказов</small>
          </div>
        </div>
      </div>

      <div className="site-hero-benefits" aria-label="Особенности пиццерии">
        {storyCards.map((item) => {
          const Icon = item.icon;

          return (
            <article className="site-hero-benefit" key={item.title}>
              <img src={item.image} alt="" loading="lazy" />
              <div>
                <Icon size={18} />
                <b>{item.title}</b>
                <span>{item.text}</span>
              </div>
            </article>
          );
        })}
        <a className="site-hero-benefit site-hero-benefit-news" href="#summer">
          Полное меню
        </a>
      </div>
    </section>
  );
}
