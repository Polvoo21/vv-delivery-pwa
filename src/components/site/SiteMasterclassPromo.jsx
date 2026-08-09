import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, ChefHat, Clock, Heart, MapPin, X } from "lucide-react";
import {
  getActiveMasterclassEvent,
  MASTERCLASS_EVENT
} from "../../../shared/masterclass-events";
import { apiPath } from "../../utils/api";
import { getSitePagePath, pluralRu } from "./siteCoreData";

const EVENT = getActiveMasterclassEvent() || MASTERCLASS_EVENT;
const PROMO_SEEN_KEY = `vv_masterclass_promo_seen:${EVENT.id}:v1`;
const AUTO_OPEN_DELAY_MS = 1200;
const MOSCOW_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

async function readApiJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось загрузить данные мастер-класса");
  }

  return data;
}

function getUrgencyLabels() {
  const now = Date.now();
  const eventDateKey = MOSCOW_DATE_FORMATTER.format(new Date(EVENT.startsAt));
  const todayKey = MOSCOW_DATE_FORMATTER.format(new Date(now));
  const tomorrowKey = MOSCOW_DATE_FORMATTER.format(new Date(now + 24 * 60 * 60 * 1000));

  if (eventDateKey === todayKey) {
    return { date: `Сегодня, ${EVENT.shortDateLabel}`, kicker: "Уже сегодня" };
  }

  if (eventDateKey === tomorrowKey) {
    return { date: `Завтра, ${EVENT.shortDateLabel}`, kicker: "Уже завтра" };
  }

  return { date: EVENT.shortDateLabel, kicker: "Скоро" };
}

export function SiteMasterclassPromo({ isDialogOpen = false, onOpen, onClose }) {
  const dialogRef = useRef(null);
  const hasAutoOpenedRef = useRef(false);
  const [eventState, setEventState] = useState({
    registeredParticipants: 0,
    registrationOpen: EVENT.pageMode === "registration"
  });

  const eventPath = getSitePagePath(EVENT.path);
  const registeredParticipants = Math.max(0, Number(eventState.registeredParticipants || 0));
  const participantLabel = `${registeredParticipants} ${pluralRu(
    registeredParticipants,
    "участник",
    "участника",
    "участников"
  )}`;
  const urgencyLabels = getUrgencyLabels();
  const eventHasStarted = Date.now() >= new Date(EVENT.startsAt).getTime();
  const registrationOpen = eventState.registrationOpen !== false && !eventHasStarted;

  const loadEvent = useCallback(async () => {
    try {
      const data = await fetch(`${apiPath("masterclassEvent")}/${EVENT.id}`, {
        headers: { Accept: "application/json" }
      }).then(readApiJson);

      setEventState(data.event);
    } catch {
      // Статическое событие остаётся видимым и в локальном preview без API.
    }
  }, []);

  useEffect(() => {
    loadEvent();
    const interval = window.setInterval(loadEvent, 20000);
    return () => window.clearInterval(interval);
  }, [loadEvent]);

  useEffect(() => {
    if (!registrationOpen || hasAutoOpenedRef.current) return undefined;

    try {
      if (window.localStorage.getItem(PROMO_SEEN_KEY) === "1") {
        hasAutoOpenedRef.current = true;
        return undefined;
      }
    } catch {
      // Недоступный localStorage не мешает показать актуальное приглашение.
    }

    const timeout = window.setTimeout(() => {
      hasAutoOpenedRef.current = true;
      onOpen?.();
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [onOpen, registrationOpen]);

  useEffect(() => {
    if (!isDialogOpen) return;

    try {
      window.localStorage.setItem(PROMO_SEEN_KEY, "1");
    } catch {
      // Попап остаётся рабочим, даже если браузер запретил хранилище.
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) return undefined;

    const dialog = dialogRef.current;
    const previousActiveElement = document.activeElement;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = () => Array.from(dialog?.querySelectorAll(focusableSelector) || []);
    const frame = window.requestAnimationFrame(() => focusableElements()[0]?.focus());

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;

      const elements = focusableElements();
      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      dialog?.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [isDialogOpen]);

  if (!registrationOpen) return null;

  return (
    <>
      <section className="site-masterclass-promo" aria-labelledby="site-masterclass-promo-title">
        <div className="site-masterclass-promo-card">
          <div className="site-masterclass-promo-photo">
            <picture>
              <source
                type="image/avif"
                media="(max-width: 640px)"
                srcSet="/assets/site/masterclass-promo-hero-480.avif"
              />
              <source
                type="image/avif"
                srcSet="/assets/site/masterclass-promo-hero-480.avif 480w, /assets/site/masterclass-promo-hero-800.avif 800w"
                sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 860px) 40vw, 594px"
              />
              <source
                type="image/webp"
                media="(max-width: 640px)"
                srcSet="/assets/site/masterclass-promo-hero-480.webp"
              />
              <source
                type="image/webp"
                srcSet="/assets/site/masterclass-promo-hero-480.webp 480w, /assets/site/masterclass-promo-hero-800.webp 800w"
                sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 860px) 40vw, 594px"
              />
              <img
                src="/assets/site/masterclass-promo-hero-800.webp"
                alt="Дети на мастер-классе рядом с приготовленными пиццами"
                width="800"
                height="383"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="site-masterclass-promo-date">
              <CalendarDays size={18} />
              {urgencyLabels.date} · {EVENT.timeLabel}
            </span>
          </div>

          <div className="site-masterclass-promo-copy">
            <span className="site-masterclass-promo-eyebrow">
              <ChefHat size={18} />
              Мастер-класс для детей и взрослых
            </span>
            <h2 id="site-masterclass-promo-title">Приходите готовить пиццу вместе</h2>
            <p>
              {EVENT.shortDateLabel} наденем фартуки, раскатаем тесто и вместе с
              пиццайоло испечём настоящую итальянскую пиццу.
            </p>

            <div className="site-masterclass-promo-meta" aria-label="Условия мастер-класса">
              <strong>{EVENT.pricePerParticipant} ₽ <span>за участника</span></strong>
              <span className="site-masterclass-promo-places" aria-live="polite">
                <Heart size={18} fill="currentColor" />
                Уже {participantLabel}
              </span>
            </div>

            <a
              className="site-masterclass-promo-action"
              href={eventPath}
              data-metrika-goal="masterclass_open"
            >
              Записаться
              <ArrowRight size={19} />
            </a>
          </div>
        </div>
      </section>
      {isDialogOpen ? (
        <div
          className="site-masterclass-promo-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <section
            ref={dialogRef}
            className="site-masterclass-promo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-masterclass-dialog-title"
          >
            <button
              className="site-masterclass-promo-close"
              type="button"
              aria-label="Закрыть окно мастер-класса"
              onClick={onClose}
            >
              <X size={22} />
            </button>

            <div className="site-masterclass-promo-dialog-photo">
              <picture>
                <source
                  type="image/avif"
                  srcSet="/assets/site/masterclass-promo-hero-480.avif 480w, /assets/site/masterclass-promo-hero-800.avif 800w"
                  sizes="(max-width: 720px) calc(100vw - 24px), 52vw"
                />
                <source
                  type="image/webp"
                  srcSet="/assets/site/masterclass-promo-hero-480.webp 480w, /assets/site/masterclass-promo-hero-800.webp 800w"
                  sizes="(max-width: 720px) calc(100vw - 24px), 52vw"
                />
                <img
                  src="/assets/site/masterclass-promo-hero-800.webp"
                  alt="Дети готовят пиццу на мастер-классе во Вместе Вкуснее"
                  width="800"
                  height="383"
                  loading="eager"
                  fetchpriority="high"
                />
              </picture>
            </div>

            <div className="site-masterclass-promo-dialog-copy">
              <span className="site-masterclass-promo-dialog-kicker">
                <ChefHat size={18} />
                {urgencyLabels.kicker}
              </span>
              <h2 id="site-masterclass-dialog-title">Приходите готовить пиццу вместе</h2>
              <p>
                {EVENT.shortDateLabel} готовим настоящую итальянскую пиццу вместе с
                нашим пиццайоло и выпекаем её в итальянской печи.
              </p>
              <div className="site-masterclass-promo-dialog-facts">
                <span><CalendarDays size={18} />{urgencyLabels.date}</span>
                <span><Clock size={18} />{EVENT.timeLabel}</span>
                <span><MapPin size={18} />Пирогова, 1Т</span>
                <span className="site-masterclass-promo-places" aria-live="polite">
                  <Heart size={18} fill="currentColor" />
                  Уже {participantLabel}
                </span>
              </div>
              <div className="site-masterclass-promo-dialog-price">
                <strong>{EVENT.pricePerParticipant} ₽</strong>
                <span>за участника</span>
              </div>
              <a
                className="site-masterclass-promo-dialog-action"
                href={eventPath}
                data-metrika-goal="masterclass_open"
              >
                Записаться на мастер-класс
                <ArrowRight size={19} />
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
