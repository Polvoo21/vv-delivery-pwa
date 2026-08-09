import { Baby, CalendarCheck, ChefHat, CheckCircle2, Clock, Pizza, Truck, Utensils } from "lucide-react";
import { ASSET, PHONE, RESTAURANT, getSiteOrderPath, telHref } from "./siteCoreData";

const aboutCards = [
  {
    icon: Pizza,
    title: "Итальянское тесто",
    text: "Долгая ферментация, воздушный борт и честные начинки."
  },
  {
    icon: ChefHat,
    title: "Печь Morello Forni",
    text: "Стабильный жар, румяная корочка и вкус живой пиццерии."
  },
  {
    icon: Baby,
    title: "Детская за стеклом",
    text: "Родители отдыхают в зале и видят ребенка рядом."
  },
  {
    icon: Utensils,
    title: "Завтраки и ланчи",
    text: "Работаем каждый день: завтрак, обед, ужин и самовывоз."
  }
];

export function SiteAboutSection({ deliveredOrdersTotal = 0, proofAddon = null }) {
  const formattedDeliveredOrders = new Intl.NumberFormat("ru-RU").format(
    Math.max(0, Number(deliveredOrdersTotal) || 0)
  );

  return (
    <section
      className="site-section-v2 site-about site-about-seo site-about-hero"
      id="top"
      aria-labelledby="site-about-title"
    >
      <span className="site-anchor" id="about" aria-hidden="true" />
      <div className="site-about-copy">
        <p className="site-eyebrow">О пиццерии</p>
        <h1 id="site-about-title">Семейная итальянская пиццерия в Чебоксарах</h1>
        <p>
          «Вместе Вкуснее» на Пирогова, 1Т - это семейная пиццерия с итальянской пиццей,
          завтраками, бизнес-ланчами, обедами, праздниками и доставкой по Чебоксарам.
          Пиццу готовим в печи Morello Forni, а для семей с детьми сделали большую
          игровую зону за стеклом.
        </p>
        <div className="site-about-actions">
          <a className="site-primary-btn" href="#summer">
            <Pizza size={18} />
            Посмотреть меню
          </a>
          <a className="site-secondary-btn" href={getSiteOrderPath()}>
            <Truck size={18} />
            Оформить доставку
          </a>
          <a className="site-dark-btn" href={telHref(PHONE)}>
            <CalendarCheck size={18} />
            Забронировать стол
          </a>
        </div>
        <div className="site-about-proof-row">
          <div className="site-about-proof" aria-label="Сколько заказов доставили за всё время">
            <span className="site-about-proof-kicker">
              <CheckCircle2 size={17} />
              Всего доставили
            </span>
            <div className="site-about-proof-value">
              <b>{formattedDeliveredOrders}</b>
              <small>заказов</small>
            </div>
            <p>Спасибо, что выбираете нас. С каждым заказом растём и становимся лучше.</p>
          </div>
          {proofAddon}
        </div>
      </div>

      <div className="site-about-visual" aria-hidden="true">
        <picture>
          <source
            type="image/avif"
            srcSet={`${ASSET}interior-window-hero-480.avif 480w, ${ASSET}interior-window-hero-720.avif 720w`}
            sizes="(max-width: 768px) calc(100vw - 52px), 360px"
          />
          <source
            type="image/webp"
            srcSet={`${ASSET}interior-window-hero-480.webp 480w, ${ASSET}interior-window-hero-720.webp 720w`}
            sizes="(max-width: 768px) calc(100vw - 52px), 360px"
          />
          <img
            src={`${ASSET}interior-window-hero-720.webp`}
            alt=""
            width="720"
            height="636"
            loading="eager"
            fetchpriority="high"
          />
        </picture>
        <div>
          <Clock size={18} />
          <span>Ежедневно</span>
          <b>{RESTAURANT.workHours}</b>
        </div>
      </div>

      <div className="site-about-card-grid" aria-label="Почему к нам приходят">
        {aboutCards.map((item) => {
          const Icon = item.icon;

          return (
            <article className="site-about-card" key={item.title}>
              <Icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
