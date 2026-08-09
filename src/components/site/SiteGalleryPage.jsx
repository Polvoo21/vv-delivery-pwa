import { Play } from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { useSiteGalleryItems } from "./hooks/useSiteGalleryItems";

function getSiteHomeHref() {
  if (typeof window === "undefined") {
    return "/#gallery";
  }

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "/dev#gallery" : "/#gallery";
}

function getMediaShape(item) {
  if (item.orientation === "video") return "video";
  if (item.orientation === "portrait") return "portrait";
  if (item.orientation === "square") return "square";
  return "landscape";
}

export function SiteGalleryPage() {
  const { photos, videos } = useSiteGalleryItems();

  return (
    <SitePublicShell className="site-gallery-page-shell">
      <section className="site-section-v2 site-gallery-page-section" id="top" aria-labelledby="site-gallery-page-title">
        <div className="site-gallery-page-head">
          <a href={getSiteHomeHref()}>На главную</a>
          <p className="site-eyebrow">Галерея</p>
          <h1 id="site-gallery-page-title">Фотографии и видео пиццерии</h1>
          <p>
            Здесь соберем большой архив зала, детской зоны, блюд, праздников и коротких вертикальных видео.
          </p>
        </div>

        <div className="site-gallery-page-grid" aria-label="Фотографии и видео пиццерии">
          {videos.map((item, index) => (
            <article className={`site-gallery-page-video is-${getMediaShape(item)}`} key={item.id || item.title}>
              <img
                src={item.poster}
                alt=""
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
              <span>
                <Play size={20} fill="currentColor" />
              </span>
            </article>
          ))}

          {photos.map((item, index) => {
            const mediaIndex = videos.length + index;

            return (
            <article className={`site-gallery-page-photo is-${getMediaShape(item)}`} key={item.id || item.title}>
              <img
                src={item.image}
                alt={item.title}
                loading={mediaIndex < 4 ? "eager" : "lazy"}
                fetchPriority={mediaIndex === 0 ? "high" : "auto"}
                decoding="async"
              />
            </article>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
