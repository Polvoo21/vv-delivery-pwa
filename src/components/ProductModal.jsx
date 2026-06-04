import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { PIZZA_ADDONS } from "../data/menu";
import { calculateItemPrice, formatPrice } from "../utils/price";

const PIZZA_SIZES = [25, 30, 35];
const DOUGH_TYPES = ["Традиционное", "Тонкое"];

export default function ProductModal({ product, onClose, onAddToCart }) {
  const isPizza = product?.category === "pizza";
  const [size, setSize] = useState(30);
  const [dough, setDough] = useState("Традиционное");
  const [addons, setAddons] = useState([]);
  const [removed, setRemoved] = useState([]);

  useEffect(() => {
    setSize(30);
    setDough("Традиционное");
    setAddons([]);
    setRemoved([]);
  }, [product?.id]);

  const unitPrice = useMemo(
    () => (product ? calculateItemPrice(product, { size, dough, addons }) : 0),
    [addons, dough, product, size]
  );

  if (!product) return null;

  function toggleAddon(addon) {
    setAddons((current) =>
      current.some((item) => item.id === addon.id)
        ? current.filter((item) => item.id !== addon.id)
        : [...current, addon]
    );
  }

  function toggleRemoved(name) {
    setRemoved((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  }

  function addToCart() {
    onAddToCart({
      uid: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId: product.id,
      category: product.category,
      name: product.name,
      description: product.description,
      image: product.image,
      visual: product.visual,
      qty: 1,
      unitPrice,
      size: isPizza ? size : null,
      dough: isPizza ? dough : null,
      addons: isPizza ? addons : [],
      removed
    });
  }

  return (
    <div className="product-modal" role="dialog" aria-modal="true" aria-label={product.name}>
      <button className="modal-round-close" type="button" onClick={onClose} aria-label="Закрыть">
        <X size={24} />
      </button>

      <div className="product-hero-screen">
        <div className={`product-hero-art ${product.image ? "with-image" : ""}`}>
          {product.image ? <img src={product.image} alt="" /> : <span>{product.visual}</span>}
        </div>
      </div>

      <section className="product-detail-card">
        <div className="sheet-grabber" />
        <div className="product-title-row">
          <div>
            <p className="eyebrow">{isPizza ? "Пицца" : "Меню"}</p>
            <h2>{product.name}</h2>
          </div>
          <strong>{formatPrice(unitPrice)} ₽</strong>
        </div>
        <p className="product-description">{product.description}</p>

        {isPizza ? (
          <>
            <div className="option-block">
              <h3>Размер</h3>
              <div className="segmented-control">
                {PIZZA_SIZES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={size === item ? "active" : ""}
                    onClick={() => setSize(item)}
                  >
                    {item} см
                  </button>
                ))}
              </div>
            </div>

            <div className="option-block">
              <h3>Тесто</h3>
              <div className="segmented-control">
                {DOUGH_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={dough === item ? "active" : ""}
                    onClick={() => setDough(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-block">
              <h3>Добавить к вкусу</h3>
              <div className="addon-grid">
                {PIZZA_ADDONS.map((addon) => {
                  const active = addons.some((item) => item.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      className={active ? "active" : ""}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                    >
                      <span>{active ? <Check size={16} /> : <Plus size={16} />}</span>
                      <b>{addon.name}</b>
                      <small>+{formatPrice(addon.price)} ₽</small>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <div className="option-block">
          <h3>Убрать ингредиенты</h3>
          <div className="remove-tags">
            {product.ingredients.map((ingredient) => {
              const active = removed.includes(ingredient);
              return (
                <button
                  key={ingredient}
                  className={active ? "active" : ""}
                  type="button"
                  onClick={() => toggleRemoved(ingredient)}
                >
                  {active ? <Minus size={15} /> : null}
                  {ingredient}
                </button>
              );
            })}
          </div>
        </div>

        <button className="sticky-add-button" type="button" onClick={addToCart}>
          <Plus size={20} />
          Добавить · {formatPrice(unitPrice)} ₽
        </button>
      </section>
    </div>
  );
}
