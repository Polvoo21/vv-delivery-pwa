import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Clock3, CopyPlus, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "../../utils/price";
import { pluralRu } from "./siteCoreData";

const INITIAL_VISIBLE_ORDERS = 3;
const MAX_VISIBLE_ORDERS = 10;
const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow"
});

function getOrderItemsLabel(count) {
  return `${count} ${pluralRu(count, "позиция", "позиции", "позиций")}`;
}

function formatOrderDate(value) {
  if (!value) {
    return "дата уточняется";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return ORDER_DATE_FORMATTER.format(date).replace(",", " в");
}

function getOrderTitle(order) {
  return `Заказ от ${formatOrderDate(order.createdAt)}`;
}

export function SiteRecentOrders({ orders = [], isOpen, onOpen, onClose, onAddOrder }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const visibleLimit = Math.min(MAX_VISIBLE_ORDERS, orders.length);
  const visibleOrders = useMemo(
    () => orders.slice(0, Math.min(visibleCount, visibleLimit)),
    [orders, visibleCount, visibleLimit]
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );
  const hiddenCount = Math.max(0, visibleLimit - visibleOrders.length);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVisibleCount(INITIAL_VISIBLE_ORDERS);
    setSelectedOrderId(null);
  }, [isOpen]);

  const addOrderToCart = (order) => {
    onAddOrder?.(order);
    onClose?.();
  };
  const hasOrders = visibleOrders.length > 0;

  return (
    <>
      <button className="site-recent-orders-trigger" type="button" onClick={onOpen}>
        <span className="site-recent-orders-kicker">
          <ShoppingBag size={17} />
          Не знаете, что выбрать?
        </span>
        <small>Посмотрите список из 10 последних заказов на сайте и закажите то же самое</small>
        <em>
          Посмотреть, что заказывали
          <ArrowRight size={16} />
        </em>
      </button>

      {isOpen ? (
        <div className="site-recent-orders-layer" role="presentation">
          <button
            className="site-recent-orders-scrim"
            type="button"
            aria-label="Закрыть последние заказы"
            onClick={onClose}
          />
          <section
            className="site-recent-orders-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-recent-orders-title"
          >
            <header className="site-recent-orders-header">
              {selectedOrder ? (
                <button
                  className="site-recent-orders-icon-btn"
                  type="button"
                  aria-label="Вернуться к списку заказов"
                  onClick={() => setSelectedOrderId(null)}
                >
                  <ArrowLeft size={20} />
                </button>
              ) : null}
              <div>
                <p>Последние заказы</p>
                <h2 id="site-recent-orders-title">
                  {selectedOrder ? getOrderTitle(selectedOrder) : "Что заказывают гости"}
                </h2>
              </div>
              <button
                className="site-recent-orders-close"
                type="button"
                aria-label="Закрыть"
                onClick={onClose}
              >
                <X size={24} />
              </button>
            </header>

            <div className="site-recent-orders-scroll">
              {selectedOrder ? (
                <div className="site-recent-order-detail">
                  <div className="site-recent-order-detail-head">
                    <span>
                      <Clock3 size={16} />
                      {formatOrderDate(selectedOrder.createdAt)}
                    </span>
                    <strong>{formatPrice(selectedOrder.total)} ₽</strong>
                  </div>
                  <div className="site-recent-order-lines">
                    {selectedOrder.items.map((item, index) => (
                      <article className="site-recent-order-line" key={`${selectedOrder.id}-${item.productId}-${index}`}>
                        <img src={item.image} alt="" loading="lazy" />
                        <div>
                          <h3>{item.name}</h3>
                          <p>
                            {item.qty > 1 ? `${item.qty} шт. · ` : ""}
                            {item.weight || "порция"}
                          </p>
                          {item.description ? <small>{item.description}</small> : null}
                        </div>
                        <b>{formatPrice(item.unitPrice * item.qty)} ₽</b>
                      </article>
                    ))}
                  </div>
                  <button
                    className="site-recent-orders-add"
                    type="button"
                    onClick={() => addOrderToCart(selectedOrder)}
                  >
                    <CopyPlus size={18} />
                    Добавить этот заказ в корзину
                  </button>
                </div>
              ) : (
                <>
                  <p className="site-recent-orders-note">
                    Здесь последние заказы на нашем сайте. Посмотрите, что выбрали другие гости, и добавьте такой же набор в корзину, если он вам подходит.
                  </p>
                  {hasOrders ? (
                    <div className="site-recent-orders-list">
                      {visibleOrders.map((order) => (
                        <article className="site-recent-order-card" key={order.id}>
                          <div className="site-recent-order-preview" aria-hidden="true">
                            {order.items.slice(0, 3).map((item, index) => (
                              <img
                                src={item.image}
                                alt=""
                                loading="lazy"
                                key={`${order.id}-${item.productId}-${index}`}
                              />
                            ))}
                          </div>
                          <div className="site-recent-order-copy">
                            <span>
                              <Clock3 size={15} />
                              {formatOrderDate(order.createdAt)}
                            </span>
                            <h3>{getOrderTitle(order)}</h3>
                            <p>Можно открыть состав или добавить такой же набор в корзину.</p>
                            <small>{getOrderItemsLabel(order.count)}</small>
                          </div>
                          <div className="site-recent-order-side">
                            <strong>{formatPrice(order.total)} ₽</strong>
                            <button type="button" onClick={() => setSelectedOrderId(order.id)}>
                              Посмотреть состав
                            </button>
                            <button type="button" onClick={() => addOrderToCart(order)}>
                              Добавить в корзину
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="site-recent-orders-empty">
                      <ShoppingBag size={22} />
                      <h3>Доставленных заказов пока нет</h3>
                      <p>Когда гости начнут оформлять заказы на сайте, здесь появятся последние наборы для вдохновения.</p>
                    </div>
                  )}

                  {hasOrders && hiddenCount > 0 ? (
                    <button
                      className="site-recent-orders-more"
                      type="button"
                      onClick={() => setVisibleCount(MAX_VISIBLE_ORDERS)}
                    >
                      Показать ещё {hiddenCount}
                      <ChevronDown size={18} />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
