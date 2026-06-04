import { useEffect, useState } from "react";
import { Bike, Clock, Phone, Store } from "lucide-react";
import MapPicker from "./MapPicker";
import { RESTAURANT } from "../data/config";

export default function AddressScreen({ fulfillment, onSave, onToast }) {
  const [draft, setDraft] = useState(fulfillment);

  useEffect(() => {
    setDraft(fulfillment);
  }, [fulfillment]);

  function updateField(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  function setMode(mode) {
    setDraft((current) => ({
      ...current,
      mode,
      address: mode === "pickup" ? RESTAURANT.address : current.address,
      coords: mode === "pickup" ? RESTAURANT.coords : current.coords || RESTAURANT.coords
    }));
  }

  function submitAddress() {
    if (draft.mode === "delivery" && !draft.address.trim()) {
      onToast("Введите адрес доставки или выберите точку на карте.");
      return;
    }

    onSave({
      ...draft,
      address: draft.mode === "pickup" ? RESTAURANT.address : draft.address.trim(),
      coords: draft.coords || RESTAURANT.coords
    });
  }

  return (
    <main className="address-screen">
      <header className="address-brand">
        <img src="/icons/icon-192.png" alt="" />
        <div>
          <b>{RESTAURANT.name}</b>
          <span>Пицца, завтраки, обеды и десерты</span>
        </div>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Тип заказа">
        <button
          type="button"
          className={draft.mode === "delivery" ? "active" : ""}
          onClick={() => setMode("delivery")}
        >
          <Bike size={18} />
          Доставка
        </button>
        <button
          type="button"
          className={draft.mode === "pickup" ? "active" : ""}
          onClick={() => setMode("pickup")}
        >
          <Store size={18} />
          Самовывоз
        </button>
      </div>

      <MapPicker
        mode={draft.mode}
        coords={draft.coords}
        onCoordsChange={(coords) => updateField("coords", coords)}
        onAddressChange={(address) => updateField("address", address)}
        onToast={onToast}
      />

      <section className="address-sheet">
        <div className="sheet-grabber" />
        {draft.mode === "delivery" ? (
          <>
            <div className="sheet-title-row">
              <div>
                <p className="eyebrow">Куда привезти</p>
                <h1>Выберите адрес</h1>
              </div>
              <span className="eta-pill">{RESTAURANT.deliveryEta}</span>
            </div>
            <label className="field">
              <span>Улица, дом</span>
              <input
                value={draft.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Например: ул. Пирогова, 1Т"
              />
            </label>
            <div className="field-grid">
              <label className="field">
                <span>Подъезд</span>
                <input
                  value={draft.entrance}
                  onChange={(event) => updateField("entrance", event.target.value)}
                  placeholder="1"
                />
              </label>
              <label className="field">
                <span>Квартира</span>
                <input
                  value={draft.flat}
                  onChange={(event) => updateField("flat", event.target.value)}
                  placeholder="12"
                />
              </label>
            </div>
            <label className="field">
              <span>Этаж/домофон</span>
              <input
                value={draft.floor}
                onChange={(event) => updateField("floor", event.target.value)}
                placeholder="3 этаж, домофон 12"
              />
            </label>
            <label className="field">
              <span>Комментарий курьеру</span>
              <input
                value={draft.addressComment}
                onChange={(event) => updateField("addressComment", event.target.value)}
                placeholder="Ориентир, шлагбаум, пожелания"
              />
            </label>
            <button className="primary-action" type="button" onClick={submitAddress}>
              Продолжить
            </button>
          </>
        ) : (
          <>
            <div className="sheet-title-row">
              <div>
                <p className="eyebrow">Забрать из пиццерии</p>
                <h1>Самовывоз</h1>
              </div>
              <span className="eta-pill">{RESTAURANT.pickupEta}</span>
            </div>
            <div className="pickup-card">
              <b>{RESTAURANT.address}</b>
              <span>
                <Clock size={16} /> Ежедневно {RESTAURANT.workHours}
              </span>
              <span>
                <Phone size={16} /> {RESTAURANT.phone}
              </span>
            </div>
            <button className="primary-action" type="button" onClick={submitAddress}>
              Выбрать самовывоз
            </button>
          </>
        )}
      </section>
    </main>
  );
}
