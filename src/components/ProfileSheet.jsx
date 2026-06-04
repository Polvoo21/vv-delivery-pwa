import { Bell, History, LogOut, MapPin, Phone, Trash2, UserRound, X } from "lucide-react";
import { RESTAURANT } from "../data/config";
import { formatPrice } from "../utils/price";

export default function ProfileSheet({
  customer,
  fulfillment,
  orders,
  onClose,
  onTestNotification,
  onClearData
}) {
  const displayName = customer.name || "Гость";
  const displayPhone = customer.phone || "Телефон появится после заказа";

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Личный кабинет">
      <button className="sheet-dim" type="button" onClick={onClose} aria-label="Закрыть профиль" />
      <section className="bottom-sheet profile-sheet">
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Аккаунт</p>
            <h2>Личный кабинет</h2>
          </div>
          <button className="sheet-icon-close" type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="profile-person">
          <div className="profile-avatar">
            <UserRound size={30} />
          </div>
          <div>
            <b>{displayName}</b>
            <span>
              <Phone size={15} />
              {displayPhone}
            </span>
          </div>
        </div>

        <div className="profile-section">
          <h3>
            <MapPin size={18} />
            Мои адреса
          </h3>
          <div className="profile-card-line">
            <b>{fulfillment.mode === "pickup" ? RESTAURANT.address : fulfillment.address || "Адрес не выбран"}</b>
            <span>{fulfillment.mode === "pickup" ? "Самовывоз" : "Доставка"}</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>
            <History size={18} />
            История заказов
          </h3>
          {orders.length ? (
            <div className="orders-list">
              {orders.slice(0, 5).map((order) => (
                <article key={order.id}>
                  <div>
                    <b>Заказ #{order.id}</b>
                    <span>{order.time}</span>
                  </div>
                  <div>
                    <strong>{formatPrice(order.total)} ₽</strong>
                    <em>Отправлен</em>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-history">После успешной отправки заказы будут сохраняться здесь.</div>
          )}
        </div>

        <div className="profile-actions">
          <button type="button" onClick={onTestNotification}>
            <Bell size={18} />
            Отправить тестовое уведомление
          </button>
          <button type="button" onClick={onClearData}>
            <Trash2 size={18} />
            Очистить данные приложения
          </button>
          <button type="button" onClick={onClose}>
            <LogOut size={18} />
            Закрыть кабинет
          </button>
        </div>
      </section>
    </div>
  );
}
