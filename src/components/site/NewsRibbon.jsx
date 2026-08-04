import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNewsRibbon } from "./hooks/useNewsRibbon";
import { newsRibbonItems } from "./siteData";

export function NewsRibbon() {
  const { newsTrackRef, newsArrowState, scrollNewsRibbon } = useNewsRibbon();

  return (
    <section className="site-news-ribbon" aria-label="Новости и предложения">
      <button
        className={`site-news-arrow site-news-arrow-left ${newsArrowState.left ? "" : "is-hidden"}`}
        type="button"
        aria-label="Листать новости назад"
        aria-hidden={!newsArrowState.left}
        disabled={!newsArrowState.left}
        onClick={() => scrollNewsRibbon(-1)}
      >
        <ChevronLeft size={30} strokeWidth={3} />
      </button>

      <div className="site-news-window">
        <div className="site-news-track" data-news-ribbon-track ref={newsTrackRef}>
          {newsRibbonItems.map((item, index) => (
            <a
              className={`site-news-tile ${item.tone ? `site-news-tile-${item.tone}` : ""}`}
              href={item.href}
              key={`${item.title}-${index}`}
              aria-label={item.title}
            >
              <span className="site-news-card">
                <img src={item.image} alt="" loading={index < 4 ? "eager" : "lazy"} />
                <span className="site-news-title">{item.title}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <button
        className={`site-news-arrow site-news-arrow-right ${newsArrowState.right ? "" : "is-hidden"}`}
        type="button"
        aria-label="Листать новости вперед"
        aria-hidden={!newsArrowState.right}
        disabled={!newsArrowState.right}
        onClick={() => scrollNewsRibbon(1)}
      >
        <ChevronRight size={30} strokeWidth={3} />
      </button>
    </section>
  );
}
