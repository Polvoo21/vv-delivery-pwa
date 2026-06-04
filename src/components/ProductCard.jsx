import { Plus } from "lucide-react";
import { formatPrice } from "../utils/price";

export default function ProductCard({ product, onOpen }) {
  const hasImage = Boolean(product.image);

  return (
    <button className="product-card" type="button" onClick={() => onOpen(product)}>
      <div className={`product-visual ${hasImage ? "has-image" : ""}`}>
        {hasImage ? <img src={product.image} alt="" loading="lazy" /> : <span>{product.visual}</span>}
        {product.badges?.[0] ? <em>{product.badges[0]}</em> : null}
      </div>
      <div className="product-copy">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <div className="product-bottom">
        <strong>от {formatPrice(product.price)} ₽</strong>
        <span>
          <Plus size={16} />
        </span>
      </div>
    </button>
  );
}
