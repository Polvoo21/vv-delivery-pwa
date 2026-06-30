import { Clock, MapPin, Phone } from "lucide-react";
import { RESTAURANT } from "../data/config";

function telHref(phone) {
  return `tel:${phone.replace(/\D/g, "")}`;
}

function mapHref() {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(RESTAURANT.address)}`;
}

export default function SitePlaceholder({ kind = "site" }) {
  const isDelivery = kind === "delivery";
  const title = isDelivery ? "Доставка скоро откроется" : "Сайт скоро откроется";
  const text = isDelivery
    ? "Мы готовим сервис доставки к запуску и проверяем все технические сценарии. Пока заказы принимаем только по телефону."
    : "Мы переносим сайт на собственную платформу и готовим аккуратный запуск. По вопросам брони, меню и заказов можно позвонить нам.";

  return (
    <main className="site-placeholder">
      <section className="site-placeholder-card" aria-labelledby="placeholder-title">
        <div className="site-placeholder-brand">
          <img src="/assets/site/vv-logo.png" alt="" />
          <span>Вместе Вкуснее</span>
        </div>

        <div className="site-placeholder-content">
          <p className="site-placeholder-kicker">Семейная пиццерия в Чебоксарах</p>
          <h1 id="placeholder-title">{title}</h1>
          <p>{text}</p>
        </div>

        <div className="site-placeholder-actions" aria-label="Быстрые действия">
          <a className="site-placeholder-primary" href={telHref(RESTAURANT.phone)}>
            <Phone size={18} />
            Позвонить
          </a>
          <a href={mapHref()} target="_blank" rel="noreferrer">
            <MapPin size={18} />
            Адрес на карте
          </a>
        </div>

        <div className="site-placeholder-info">
          <span>
            <MapPin size={17} />
            {RESTAURANT.address}
          </span>
          <span>
            <Clock size={17} />
            Ежедневно {RESTAURANT.workHours}
          </span>
          <span>
            <Phone size={17} />
            {RESTAURANT.phone}
          </span>
        </div>
      </section>
    </main>
  );
}
