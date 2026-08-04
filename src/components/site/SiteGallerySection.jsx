import { ArrowUpRight, ChevronLeft, ChevronRight, Images, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useSiteGalleryItems } from "./hooks/useSiteGalleryItems";

function getNextIndex(currentIndex, direction, total) {
  if (!total) return 0;
  return (currentIndex + direction + total) % total;
}

function getGalleryPageHref() {
  if (typeof window === "undefined") {
    return "/gallery";
  }

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "/dev/gallery" : "/gallery";
}

function getMediaShape(item) {
  if (item.type === "video" || item.orientation === "video") return "video";
  if (item.orientation === "portrait") return "portrait";
  if (item.orientation === "square") return "square";
  return "landscape";
}

export function SiteGallerySection() {
  const { items: galleryPreviewItems, photos } = useSiteGalleryItems();
  const [activeIndex, setActiveIndex] = useState(null);
  const activeItem = Number.isInteger(activeIndex) ? galleryPreviewItems[activeIndex] || null : null;

  const closeGallery = () => setActiveIndex(null);
  const showPrevious = () => setActiveIndex((current) => getNextIndex(current, -1, galleryPreviewItems.length));
  const showNext = () => setActiveIndex((current) => getNextIndex(current, 1, galleryPreviewItems.length));

  useBodyScrollLock(activeItem !== null, closeGallery);

  useEffect(() => {
    if (!activeItem) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => getNextIndex(current, -1, galleryPreviewItems.length));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) => getNextIndex(current, 1, galleryPreviewItems.length));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeItem, galleryPreviewItems.length]);

  return (
    <section className="site-section-v2 site-gallery-section" aria-labelledby="site-gallery-title">
      <div className="site-gallery-head">
        <div>
          <p className="site-eyebrow">Галерея</p>
          <h2 id="site-gallery-title">Наше настроение</h2>
          <p>
            Зал, детская зона, пицца из печи и моменты, ради которых к нам приходят всей семьей.
          </p>
        </div>
        <div className="site-gallery-actions">
          <span className="site-gallery-count">
            <Images size={18} />
            {photos.length} фото
          </span>
          <a className="site-gallery-more-link" href={getGalleryPageHref()}>
            Посмотреть все фотографии
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      <div className="site-gallery-grid" aria-label="Фотографии пиццерии">
        {galleryPreviewItems.map((item, index) => {
          if (item.type === "video") {
            const shape = getMediaShape(item);
            return (
              <button
                className={`site-gallery-video-card is-${shape}`}
                type="button"
                key={item.id || `video-${item.title}`}
                onClick={() => setActiveIndex(index)}
              >
                <img src={item.poster} alt="" loading="lazy" />
                <span className="site-gallery-video-play">
                  <Play size={18} fill="currentColor" />
                </span>
              </button>
            );
          }

          const shape = getMediaShape(item);
          return (
            <button
              className={`site-gallery-card is-${shape} ${index === 0 ? "is-large" : ""}`}
              type="button"
              key={item.id || item.title}
              onClick={() => setActiveIndex(index)}
            >
              <img src={item.image} alt={item.title} loading="lazy" />
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div className="site-gallery-lightbox-layer" role="presentation">
          <div className="site-gallery-lightbox-scrim" aria-hidden="true" onClick={closeGallery} />
          <section
            className={`site-gallery-lightbox is-${getMediaShape(activeItem)}`}
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр фотографии"
          >
            <button className="site-gallery-lightbox-close" type="button" aria-label="Закрыть галерею" onClick={closeGallery}>
              <X size={26} />
            </button>
            <button className="site-gallery-lightbox-arrow is-prev" type="button" aria-label="Предыдущее фото" onClick={showPrevious}>
              <ChevronLeft size={30} />
            </button>
            {activeItem.type === "video" && activeItem.videoUrl ? (
              <iframe
                src={activeItem.videoUrl}
                title={activeItem.title}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={activeItem.type === "video" ? activeItem.poster : activeItem.image}
                  alt={activeItem.type === "video" ? "" : activeItem.title}
                />
                {activeItem.type === "video" ? (
                  <span className="site-gallery-lightbox-play">
                    <Play size={22} fill="currentColor" />
                  </span>
                ) : null}
              </>
            )}
            <button className="site-gallery-lightbox-arrow is-next" type="button" aria-label="Следующее фото" onClick={showNext}>
              <ChevronRight size={30} />
            </button>
            <span className="site-gallery-lightbox-counter">
              {activeIndex + 1} / {galleryPreviewItems.length}
            </span>
          </section>
        </div>
      ) : null}
    </section>
  );
}
