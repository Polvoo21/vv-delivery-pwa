import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, MessageCircle, Phone, Send, X } from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { PHONE, pluralRu, telHref } from "./siteData";
import { getLostItemDeadline, lostItemContactLinks, siteLostItems } from "./siteLostItemsData";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { apiPath } from "../../utils/api";

const DAY_MS = 24 * 60 * 60 * 1000;
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric"
});
const compactDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit"
});

function getSiteHomeHref() {
  if (typeof window === "undefined") {
    return "/";
  }

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "/dev" : "/";
}

function formatDate(dateLike) {
  return dateFormatter.format(new Date(`${dateLike}T12:00:00`));
}

function formatCompactDate(dateLike) {
  return compactDateFormatter.format(dateLike instanceof Date ? dateLike : new Date(`${dateLike}T12:00:00`));
}

function formatLostItemNumber(item) {
  const number = Number(item?.itemNumber || 0);
  return number > 0 ? `#${String(number).padStart(3, "0")}` : "#---";
}

function getStorageState(item, now) {
  const addedAt = new Date(`${item.addedAt}T12:00:00`);
  const deadline = getLostItemDeadline(item.addedAt);
  const totalMs = Math.max(deadline.getTime() - addedAt.getTime(), DAY_MS);
  const leftMs = deadline.getTime() - now;
  const daysLeft = Math.max(0, Math.ceil(leftMs / DAY_MS));
  const progress = Math.max(0, Math.min(100, Math.round((leftMs / totalMs) * 100)));

  return {
    deadline,
    daysLeft,
    progress,
    expired: leftMs <= 0
  };
}

function normalizeLostItem(item) {
  return {
    id: item.id,
    itemNumber: Number(item.itemNumber || item.item_number || 0),
    addedAt: item.addedAt || item.added_at,
    image: item.image || item.imageUrl || item.url
  };
}

function mergeLostItems(uploadedItems) {
  const normalizedUploaded = Array.isArray(uploadedItems)
    ? uploadedItems.map(normalizeLostItem).filter((item) => item.id && item.addedAt && item.image)
    : [];
  const seen = new Set(normalizedUploaded.map((item) => item.id));
  const staticItems = siteLostItems.filter((item) => !seen.has(item.id));

  return [...normalizedUploaded, ...staticItems];
}

function LostItemCard({ item, now, onClaim }) {
  const storage = getStorageState(item, now);
  const daysLabel = pluralRu(storage.daysLeft, "день", "дня", "дней");

  return (
    <button
      className={`site-lost-card ${storage.expired ? "is-expired" : ""}`}
      type="button"
      onClick={() => onClaim(item)}
      aria-label={`Открыть потеряшку ${formatLostItemNumber(item)}`}
    >
      <span className="site-lost-photo">
        <img src={item.image} alt="Забытая вещь" loading="lazy" />
        <span className="site-lost-number-badge">Потеряшка {formatLostItemNumber(item)}</span>
      </span>
      <div className="site-lost-card-body">
        <div className="site-lost-meta" aria-label="Срок хранения">
          <span>
            <CalendarDays size={15} />
            Добавили {formatCompactDate(item.addedAt)}
          </span>
          <i aria-hidden="true" />
          <span>
            <Clock3 size={15} />
            До {formatCompactDate(storage.deadline)}
          </span>
        </div>

        <div className="site-lost-timer" aria-label={storage.expired ? "Срок хранения истек" : "Срок хранения"}>
          <div>
            <span>{storage.expired ? "Срок хранения истек" : `Осталось ${storage.daysLeft} ${daysLabel}`}</span>
          </div>
          <i>
            <em style={{ width: `${storage.progress}%` }} />
          </i>
        </div>

        <span className="site-lost-card-cta">Это мое</span>
      </div>
    </button>
  );
}

function LostItemPhotoModal({ item, onClose, onClaim }) {
  if (!item) return null;

  return (
    <div className="site-lost-photo-layer" role="presentation">
      <button className="site-lost-photo-scrim" type="button" aria-label="Закрыть фото" onClick={onClose} />
      <section className="site-lost-photo-modal" role="dialog" aria-modal="true" aria-label="Фото забытой вещи">
        <button className="site-lost-photo-close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="site-lost-photo-actions">
          <div className="site-lost-photo-number">Потеряшка {formatLostItemNumber(item)}</div>
          <button className="site-lost-photo-claim" type="button" onClick={() => onClaim(item)}>
            Это мое
          </button>
        </div>
        <img src={item.image} alt="Забытая вещь в полном размере" />
      </section>
    </div>
  );
}

function LostItemContactModal({ item, onClose, onOpenPhoto }) {
  if (!item) return null;

  const storage = getStorageState(item, Date.now());

  return (
    <div className="site-lost-contact-layer" role="presentation">
      <button className="site-lost-contact-scrim" type="button" aria-label="Закрыть окно" onClick={onClose} />
      <section
        className="site-lost-contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-lost-contact-title"
      >
        <button className="site-lost-contact-close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X size={24} />
        </button>
        <span className="site-lost-contact-kicker">Это моя вещь</span>
        <h2 id="site-lost-contact-title">Потеряшка {formatLostItemNumber(item)}</h2>
        <p>Назовите этот номер, чтобы мы быстро нашли вещь у себя.</p>

        <button
          className="site-lost-contact-photo"
          type="button"
          onClick={() => onOpenPhoto(item)}
          aria-label="Открыть фото в полном размере"
        >
          <img src={item.image} alt="Забытая вещь" />
        </button>

        <div className="site-lost-contact-note">
          <span>
            <small>Добавили</small>
            <b>{formatDate(item.addedAt)}</b>
          </span>
          <span>
            <small>Храним до</small>
            <b>{dateFormatter.format(storage.deadline)}</b>
          </span>
        </div>

        <div className="site-lost-contact-actions">
          <a className="site-lost-contact-primary" href={telHref(PHONE)}>
            <Phone size={19} />
            Позвонить
          </a>
          <a href={lostItemContactLinks.vk} target="_blank" rel="noreferrer">
            <MessageCircle size={19} />
            Написать в VK
          </a>
          <a href={lostItemContactLinks.telegram} target="_blank" rel="noreferrer">
            <Send size={19} />
            Написать в TG
          </a>
        </div>
      </section>
    </div>
  );
}

export function SiteLostItemsPage() {
  const [activeItem, setActiveItem] = useState(null);
  const [photoItem, setPhotoItem] = useState(null);
  const [lostItems, setLostItems] = useState(siteLostItems);
  const [now, setNow] = useState(() => Date.now());
  const storageStats = useMemo(() => {
    const active = lostItems.filter((item) => !getStorageState(item, now).expired).length;
    return {
      active,
      label: pluralRu(active, "вещь", "вещи", "вещей")
    };
  }, [lostItems, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    fetch(apiPath("siteLostItems"))
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("lost-items unavailable"))))
      .then((data) => {
        if (!isCancelled && data.ok !== false) {
          setLostItems(mergeLostItems(data.items));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLostItems(siteLostItems);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useBodyScrollLock(Boolean(activeItem) || Boolean(photoItem), () => {
    if (photoItem) {
      setPhotoItem(null);
      return;
    }
    if (activeItem) {
      setActiveItem(null);
      return;
    }
  });

  const claimPhotoItem = (item) => {
    setPhotoItem(null);
    setActiveItem(item);
  };

  return (
    <SitePublicShell className="site-lost-page-shell">
      <section className="site-section-v2 site-lost-hero" id="top" aria-labelledby="site-lost-title">
        <div className="site-lost-hero-copy">
          <a className="site-lost-back" href={getSiteHomeHref()}>
            <ArrowLeft size={18} />
            На главную
          </a>
          <p className="site-eyebrow">Потеряшки</p>
          <h1 id="site-lost-title">Забытые вещи в пиццерии</h1>
          <p>
            Мы бережно храним забытые вещи три месяца с даты публикации. Если за это время владелец не
            найдется, нам придется убрать вещь из хранения: места для долгого хранения, к сожалению, нет.
          </p>
        </div>

        <aside className="site-lost-hero-card" aria-label="Правила хранения">
          <span>Сейчас на странице</span>
          <b>{storageStats.active} {storageStats.label}</b>
          <p>Смотрите фото, дату добавления и срок хранения. Если узнали вещь, нажмите “Это мое”.</p>
        </aside>
      </section>

      <section className="site-section-v2 site-lost-section" aria-label="Забытые вещи">
        <div className="site-lost-section-head">
          <div>
            <p className="site-eyebrow">Нашли у нас</p>
            <h2>Вещи ждут владельцев</h2>
          </div>
          <span>Храним 3 месяца</span>
        </div>

        <div className="site-lost-grid">
          {lostItems.map((item) => (
            <LostItemCard item={item} key={item.id} now={now} onClaim={setActiveItem} />
          ))}
        </div>
      </section>

      <LostItemPhotoModal item={photoItem} onClose={() => setPhotoItem(null)} onClaim={claimPhotoItem} />
      <LostItemContactModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onOpenPhoto={setPhotoItem}
      />
      <SiteFooter />
    </SitePublicShell>
  );
}
