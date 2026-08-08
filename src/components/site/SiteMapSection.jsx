import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { ASSET, PHONE, RESTAURANT, SOCIAL_LINKS, telHref } from "./siteData";

function getYandexMapWidgetUrl() {
  const { lat, lng } = RESTAURANT.coords;
  const params = new URLSearchParams({
    ll: `${lng},${lat}`,
    pt: `${lng},${lat},pm2rdm`,
    z: "16",
    l: "map"
  });

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

function getYandexRouteUrl() {
  const { lat, lng } = RESTAURANT.coords;
  const params = new URLSearchParams({
    rtext: `~${lat},${lng}`,
    rtt: "auto"
  });

  return `https://yandex.ru/maps/?${params.toString()}`;
}

export function SiteMapSection() {
  return (
    <section className="site-section-v2 site-map-section" id="map" aria-labelledby="site-map-title">
      <div className="site-map-copy">
        <p className="site-eyebrow">Как нас найти</p>
        <h2 id="site-map-title">Пирогова, 1Т</h2>
        <p>
          Семейная пиццерия, зал, самовывоз и доставка по Чебоксарам.
          Заезжайте на ужин, детский праздник или заберите заказ с собой.
        </p>

        <div className="site-map-facts">
          <span>
            <MapPin size={18} />
            {RESTAURANT.address}
          </span>
          <span>
            <Clock size={18} />
            Ежедневно {RESTAURANT.workHours}
          </span>
        </div>

        <div className="site-map-actions">
          <a className="site-primary-btn" href={getYandexRouteUrl()} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            Построить маршрут
          </a>
          <a className="site-dark-btn" href={telHref(PHONE)}>
            <Phone size={18} />
            Позвонить
          </a>
        </div>
      </div>

      <div className="site-map-frame">
        <iframe
          src={getYandexMapWidgetUrl()}
          title="Карта: Вместе Вкуснее, Пирогова, 1Т"
          loading="lazy"
          allowFullScreen
        />
        <a className="site-map-brand-card" href={SOCIAL_LINKS.yandexMaps} target="_blank" rel="noreferrer">
          <span>
            <img src={`${ASSET}vv-logo-full.svg`} alt="" />
          </span>
          <b>{RESTAURANT.name}</b>
          <small>{RESTAURANT.shortAddress}</small>
        </a>
      </div>
    </section>
  );
}
