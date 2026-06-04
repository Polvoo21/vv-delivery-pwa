import { Minus, Plus, Trash2, X } from "lucide-react";
import { getUpsellProducts } from "../data/menu";
import { calculateCartTotals, formatPrice } from "../utils/price";
import { useSwipeDismiss } from "../utils/useSwipeDismiss";

function itemMeta(item) {
  const parts = [];
  if (item.size) parts.push(`${item.size} см`);
  if (item.dough) parts.push(item.dough);
  if (item.addons?.length) parts.push(`+ ${item.addons.map((addon) => addon.name).join(", ")}`);
  if (item.removed?.length) parts.push(`убрать: ${item.removed.join(", ")}`);
  return parts.join(" · ");
}

export default function CartSheet({
  cart,
  promo,
  offer,
  onClose,
  onQty,
  onRemove,
  onClear,
  onAddUpsell,
  onOpenPromo,
  onCheckout
}) {
  const totals = calculateCartTotals(cart, promo, offer);
  const upsell = getUpsellProducts();
  const swipe = useSwipeDismiss(onClose);

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Корзина">
      <button className="sheet-dim" type="button" onClick={onClose} aria-label="Закрыть корзину" />
      <section
        className={`bottom-sheet cart-sheet ${swipe.dragging ? "is-dragging" : ""}`}
        style={swipe.style}
        {...swipe.bind}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Ваш заказ</p>
            <h2>Корзина</h2>
          </div>
          <div className="sheet-actions">
            {cart.length ? (
              <button type="button" onClick={onClear} aria-label="Очистить корзину">
                <Trash2 size={18} />
              </button>
            ) : null}
            <button type="button" onClick={onClose} aria-label="Закрыть">
              <X size={20} />
            </button>
          </div>
        </div>

        {cart.length ? (
          <div className="cart-list">
            {cart.map((item) => (
              <article className="cart-item" key={item.uid}>
                <div className={`cart-item-visual ${item.image ? "has-image" : ""}`}>
                  {item.image ? <img src={item.image} alt="" /> : <span>{item.visual}</span>}
                </div>
                <div className="cart-item-copy">
                  <h3>{item.name}</h3>
                  <p>{itemMeta(item)}</p>
                  <button type="button" onClick={() => onRemove(item.uid)}>
                    Удалить
                  </button>
                </div>
                <div className="quantity-control">
                  <button type="button" onClick={() => onQty(item.uid, -1)} aria-label="Уменьшить">
                    <Minus size={16} />
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => onQty(item.uid, 1)} aria-label="Увеличить">
                    <Plus size={16} />
                  </button>
                  <strong>{formatPrice(item.unitPrice * item.qty)} ₽</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>🛒</span>
            <h3>Корзина пустая</h3>
            <p>Добавьте пиццу, десерт или напиток, и заказ появится здесь.</p>
          </div>
        )}

        <div className="upsell-block">
          <h3>К заказу</h3>
          <div className="upsell-row">
            {upsell.map((product) => (
              <button key={product.id} type="button" onClick={() => onAddUpsell(product)}>
                <span>{product.visual}</span>
                <b>{product.name}</b>
                <small>{formatPrice(product.price)} ₽</small>
              </button>
            ))}
          </div>
        </div>

        <button className="promo-button" type="button" onClick={onOpenPromo}>
          <span>{totals.discountState.active ? totals.discountState.label : "Введите промокод"}</span>
          <b>{totals.discountState.active ? `-${totals.discountState.percent}%` : "VV25"}</b>
        </button>

        <div className="total-card">
          <div>
            <span>Товары</span>
            <b>{formatPrice(totals.subtotal)} ₽</b>
          </div>
          {totals.discount ? (
            <div className="discount-line">
              <span>Скидка</span>
              <b>-{formatPrice(totals.discount)} ₽</b>
            </div>
          ) : null}
          <div className="total-line">
            <span>Итого</span>
            <b>{formatPrice(totals.total)} ₽</b>
          </div>
        </div>

        <button className="primary-action" type="button" onClick={onCheckout} disabled={!cart.length}>
          Перейти к оформлению
        </button>
      </section>
    </div>
  );
}
