import { Gift, Sparkles } from "lucide-react";

export default function OfferBanner({ offer, onActivate }) {
  return (
    <section className={`offer-banner ${offer.active ? "is-active" : ""}`}>
      <div className="offer-icon">
        <Gift size={22} />
      </div>
      <div>
        <p className="eyebrow">Личный оффер</p>
        <h2>-25% на первые 3 доставки</h2>
        <span>{offer.active ? "Скидка уже активна" : "Активируйте скидку для первого заказа"}</span>
      </div>
      <button type="button" onClick={onActivate} disabled={offer.active}>
        <Sparkles size={17} />
        {offer.active ? "Готово" : "Активировать"}
      </button>
    </section>
  );
}
