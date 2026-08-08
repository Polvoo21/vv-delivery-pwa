import { useState } from "react";
import { Percent, X } from "lucide-react";
import { useSwipeDismiss } from "../utils/useSwipeDismiss";
import { apiPath } from "../utils/api";

export default function PromoCodeSheet({ promo, onApply, onClose }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const swipe = useSwipeDismiss(onClose);

  async function fetchPartnerPromo(code) {
    const response = await fetch(`${apiPath("promoCodes")}/${encodeURIComponent(code)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return null;
    }

    return data.promo || null;
  }

  async function applyPromo() {
    const normalized = value.trim().toUpperCase().replace("ВВ", "VV");
    setLoading(true);
    setStatus("");

    try {
      const match = await fetchPartnerPromo(normalized);

      if (!match) {
        setStatus("Промокод не найден. Проверьте правильность кода.");
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
      setStatus(`Промокод применён. Скидка ${match.percent}% появится в корзине.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`sheet-overlay ${swipe.closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Промокод"
    >
      <button className="sheet-dim" type="button" onClick={swipe.close} aria-label="Закрыть промокод" />
      <section
        className={`bottom-sheet compact-sheet ${swipe.dragging ? "is-dragging" : ""} ${
          swipe.closing ? "is-closing" : ""
        }`}
        style={swipe.style}
        {...swipe.bind}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Скидка</p>
            <h2>Промокод</h2>
          </div>
          <button className="sheet-icon-close" type="button" onClick={swipe.close} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="promo-hero">
          <Percent size={28} />
          <span>Если у вас есть промокод</span>
          <b>Введите его ниже</b>
        </div>
        <label className="field">
          <span>Введите промокод</span>
          <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Промокод" />
        </label>
        <button className="primary-action" type="button" onClick={applyPromo} disabled={loading}>
          {loading ? "Проверяем..." : "Применить"}
        </button>
        {status ? <p className="sheet-status">{status}</p> : null}
      </section>
    </div>
  );
}
