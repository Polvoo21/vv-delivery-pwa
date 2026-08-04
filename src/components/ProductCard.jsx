import { Plus } from "lucide-react";
import { formatPrice, getProductOldPrice } from "../utils/price";
import { getProductInitials } from "../utils/productVisual";

export default function ProductCard({ product, onOpen }) {
  const hasImage = Boolean(product.image);
  const primaryBadge = product.badges?.[0];
  const fallbackLabel = getProductInitials(product);
  const oldPrice = getProductOldPrice(product);

  return (
    <button
      className={`product-card product-card-${product.category}`}
      type="button"
      data-category={product.category}
      onClick={() => onOpen(product)}
      aria-label={`Открыть ${product.name}`}
    >
      <div className={`product-visual ${hasImage ? "has-image" : ""}`}>
        {hasImage ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <span className="product-placeholder" aria-hidden="true">{fallbackLabel || "VV"}</span>
        )}
        {primaryBadge ? <em>{primaryBadge}</em> : null}
      </div>
      <div className="product-copy">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <div className={`product-bottom ${oldPrice ? "has-discount" : ""}`}>
        <strong>
          {oldPrice ? <em>{formatPrice(oldPrice)} ₽</em> : null}
          <span>от {formatPrice(product.price)} ₽</span>
        </strong>
        <span>
          <Plus size={16} />
        </span>
      </div>
    </button>
  );
}
