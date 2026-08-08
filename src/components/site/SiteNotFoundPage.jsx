import { ArrowRight, Home, MapPin } from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";

export function SiteNotFoundPage() {
  return (
    <SitePublicShell className="site-not-found-page">
      <section className="site-not-found-card" aria-labelledby="site-not-found-title">
        <p className="site-eyebrow">Ошибка 404</p>
        <h1 id="site-not-found-title">Страница не найдена</h1>
        <p>
          Возможно, адрес изменился или в ссылке есть ошибка. Вернитесь на главную,
          откройте меню или проверьте зоны доставки.
        </p>
        <nav className="site-not-found-actions" aria-label="Полезные ссылки">
          <a className="site-primary-btn" href="/">
            <Home size={18} />
            На главную
          </a>
          <a className="site-secondary-btn" href="/#menu">
            Посмотреть меню
            <ArrowRight size={18} />
          </a>
          <a className="site-dark-btn" href="/delivery-zones">
            <MapPin size={18} />
            Зоны доставки
          </a>
        </nav>
      </section>
      <SiteFooter />
    </SitePublicShell>
  );
}

