import { useState } from "react";
import { Percent, X } from "lucide-react";
import { PROMO_CODES } from "../data/config";

export default function PromoCodeSheet({ promo, offer, onApply, onClose }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");

  function applyPromo() {
    const normalized = value.trim().toUpperCase().replace("ВВ", "VV");
    const match = PROMO_CODES[normalized];

    if (!match) {
      setStatus("Промокод не найден. Для теста используйте VV25.");
      return;
    }

    if (promo?.active && promo.code === match.code) {
      setStatus("Промокод уже применён.");
      return;
    }

    onApply({
      ...match,
      active: true
    });
    setStatus(
      offer?.active
        ? "Промокод сохранён. Скидка останется 25%, без повторного удвоения."
        : "Промокод применён. Скидка 25% появится в корзине."
    );
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Промокод">
      <button className="sheet-dim" type="button" onClick={onClose} aria-label="Закрыть промокод" />
      <section className="bottom-sheet compact-sheet">
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Скидка</p>
            <h2>Промокод</h2>
          </div>
          <button className="sheet-icon-close" type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="promo-hero">
          <Percent size={28} />
          <span>Тестовый код</span>
          <b>VV25</b>
        </div>
        <label className="field">
          <span>Введите промокод</span>
          <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="VV25" />
        </label>
        <button className="primary-action" type="button" onClick={applyPromo}>
          Применить
        </button>
        {status ? <p className="sheet-status">{status}</p> : null}
      </section>
    </div>
  );
}
