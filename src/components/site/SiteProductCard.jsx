import { ShoppingBag, Star, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { formatPrice, getProductOldPrice } from "../../utils/price";
import { formatOrdersCount, getProductSocialProof } from "../../utils/socialProof";
import { TEST_CARD_IMAGE, getCategoryVisual } from "./siteData";

export function SiteProductCard({ product, onOpen, reviewSummary }) {
  const visual = getCategoryVisual(product.category);
  const badgeText = Array.isArray(product.badges) ? product.badges.find(Boolean) : "";
  const openProduct = () => onOpen?.(product);
  const { reviewAverage, reviewCount, orderedCount } = getProductSocialProof(product, reviewSummary);
  const hasSocialProof = reviewCount > 0 || orderedCount > 0;
  const oldPrice = getProductOldPrice(product);
  const productImage = product.image || product.visual?.image || TEST_CARD_IMAGE;
  const hasVideo = Boolean(product.videoUrl || product.video?.url);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [productImage]);

  return (
    <article className={`site-product-card site-product-${visual.tone}`} aria-label={product.name}>
      <button
        className={`site-product-visual ${imageLoaded ? "is-image-loaded" : "is-image-loading"}`}
        type="button"
        aria-label={`Открыть ${product.name}`}
        onClick={openProduct}
      >
        {!imageLoaded ? <span className="site-product-image-skeleton" aria-hidden="true" /> : null}
        {badgeText ? (
          <span className="site-product-badge-wrap" aria-hidden="true">
            <span className="site-product-badge-shadow" />
            <span className="site-product-badge">
              {badgeText}
            </span>
          </span>
        ) : null}
        {hasVideo ? (
          <span className="site-product-video-badge" aria-label="У блюда есть видео">
            <Video size={15} strokeWidth={2.5} />
          </span>
        ) : null}
        <img
          src={productImage}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      </button>
      <div className="site-product-body">
        <h4>{product.name}</h4>
        {hasSocialProof ? (
          <div className="site-product-social-proof" aria-label="Рейтинг и популярность товара">
            {reviewCount > 0 ? (
              <span className="site-product-rating is-rated">
                <Star size={13} strokeWidth={2.4} fill="currentColor" />
                {reviewAverage.toFixed(1)}
              </span>
            ) : null}
            {orderedCount > 0 ? (
              <span className="site-product-orders">
                <ShoppingBag size={13} strokeWidth={2.5} />
                {formatOrdersCount(orderedCount)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={`site-product-bottom ${oldPrice ? "has-discount" : ""}`}>
        {oldPrice ? <span className="site-product-old-price">{formatPrice(oldPrice)} ₽</span> : null}
        <button type="button" onClick={openProduct}>от {formatPrice(product.price)} ₽</button>
      </div>
    </article>
  );
}
