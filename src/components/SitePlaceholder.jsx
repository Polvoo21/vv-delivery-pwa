import { Clock, ExternalLink, MapPin, Phone, ShoppingBag } from "lucide-react";
import { RESTAURANT } from "../data/config";

const PHONE = "+7 (8352) 66-77-77";
const DELIVERY_URL = "https://delivery.vmestevkusnee.ru";
const DEV_URL = "/dev";

function telHref(phone) {
  return `tel:${phone.replace(/\D/g, "")}`;
}

export default function SitePlaceholder() {
  return (
    <main className="site-placeholder">
      <section className="site-placeholder-card" aria-labelledby="placeholder-title">
        <div className="site-placeholder-brand">
          <img src="/assets/site/vv-logo.png" alt="" />
          <span>Вместе Вкуснее</span>
        </div>

        <div className="site-placeholder-content">
          <p className="site-placeholder-kicker">Семейная пиццерия в Чебоксарах</p>
          <h1 id="placeholder-title">Сайт скоро откроется</h1>
          <p>
            Мы аккуратно переносим сайт на собственную платформу. Доставка и рабочая версия сервиса уже доступны.
          </p>
        </div>

        <div className="site-placeholder-actions" aria-label="Быстрые действия">
          <a className="site-placeholder-primary" href={DELIVERY_URL}>
            <ShoppingBag size={19} />
            Оформить доставку
          </a>
          <a href={telHref(PHONE)}>
            <Phone size={18} />
            Позвонить
          </a>
          <a href={DEV_URL}>
            <ExternalLink size={18} />
            Рабочая версия
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
            {PHONE}
          </span>
        </div>
      </section>
    </main>
  );
}
