import "../../styles/site/delivery.css";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShoppingBag, Truck } from "lucide-react";
import { DELIVERY_MIN_ORDER_AMOUNT } from "../../../shared/order-rules";
import { formatPrice } from "../../utils/price";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { RESTAURANT, getSiteOrderPath } from "./siteData";

const steps = [
  {
    title: "Выберите блюда",
    text: "Откройте меню, добавьте позиции в корзину и проверьте итоговую сумму."
  },
  {
    title: "Укажите способ получения",
    text: "Введите адрес доставки или выберите самовывоз с Пирогова, 1Т."
  },
  {
    title: "Подтвердите заказ",
    text: "Сайт покажет доступное время, состав заказа и окончательную стоимость до оплаты."
  }
];

export function SiteDeliveryPage() {
  return (
    <SitePublicShell className="site-delivery-page">
      <section className="site-delivery-hero" aria-labelledby="site-delivery-title">
        <div>
          <p className="site-eyebrow">Доставка и самовывоз</p>
          <h1 id="site-delivery-title">Доставка пиццы и еды в Чебоксарах</h1>
          <p>
            Доставка по доступной зоне бесплатна от {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после
            скидок. Самовывоз с Пирогова, 1Т доступен без минимальной суммы.
          </p>
          <div className="site-delivery-actions">
            <a className="site-delivery-primary" href={getSiteOrderPath()}>
              Открыть меню
              <ArrowRight size={18} />
            </a>
            <a className="site-delivery-secondary" href="/delivery-zones">
              Проверить зоны
            </a>
          </div>
        </div>
        <dl className="site-delivery-facts" aria-label="Условия доставки и самовывоза">
          <div>
            <Truck size={22} />
            <dt>Доставка</dt>
            <dd>Бесплатно от {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок</dd>
          </div>
          <div>
            <ShoppingBag size={22} />
            <dt>Самовывоз</dt>
            <dd>Без минимальной суммы</dd>
          </div>
          <div>
            <Clock3 size={22} />
            <dt>Часы работы</dt>
            <dd>Ежедневно {RESTAURANT.workHours}</dd>
          </div>
          <div>
            <MapPin size={22} />
            <dt>Адрес</dt>
            <dd>{RESTAURANT.address}</dd>
          </div>
        </dl>
      </section>

      <section className="site-delivery-steps" aria-labelledby="site-delivery-steps-title">
        <div className="site-delivery-section-head">
          <p className="site-eyebrow">Как заказать</p>
          <h2 id="site-delivery-steps-title">Три понятных шага</h2>
        </div>
        <ol>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="site-delivery-conditions" aria-labelledby="site-delivery-conditions-title">
        <div>
          <p className="site-eyebrow">Коротко об условиях</p>
          <h2 id="site-delivery-conditions-title">Что важно знать до заказа</h2>
        </div>
        <ul>
          <li><CheckCircle2 size={20} />Минимальная сумма считается после применения скидок.</li>
          <li><CheckCircle2 size={20} />Адрес проверяется по актуальной карте зон при оформлении.</li>
          <li><CheckCircle2 size={20} />Точное время зависит от адреса, загрузки кухни и дорожной обстановки.</li>
          <li><CheckCircle2 size={20} />Состав, цена и способ получения видны до подтверждения заказа.</li>
        </ul>
      </section>

      <section className="site-delivery-final" aria-labelledby="site-delivery-final-title">
        <div>
          <h2 id="site-delivery-final-title">Готовы выбрать блюда?</h2>
          <p>Актуальные позиции и цены загружаются из действующего каталога пиццерии.</p>
        </div>
        <a href={getSiteOrderPath()}>
          Перейти к меню
          <ArrowRight size={18} />
        </a>
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
