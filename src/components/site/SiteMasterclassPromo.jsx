import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, ChefHat, Clock3, Heart, MapPin, X } from "lucide-react";
import { MASTERCLASS_EVENT } from "../../../shared/masterclass-events";
import { apiPath } from "../../utils/api";
import { getSitePagePath, pluralRu } from "./siteData";

const EVENT = MASTERCLASS_EVENT;
const PROMO_SEEN_KEY = `vv_masterclass_promo_seen:${EVENT.id}:v2`;
const AUTO_OPEN_DELAY_MS = 1400;
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

function hasSeenPromo() {
  try {
    return window.localStorage.getItem(PROMO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberPromoSeen() {
  try {
    window.localStorage.setItem(PROMO_SEEN_KEY, "1");
  } catch {
    // В приватном режиме localStorage может быть недоступен. Показ всё равно не блокируем.
  }
}

export function SiteMasterclassPromo({
  isDialogOpen,
  autoOpenAllowed,
  onDialogOpen,
  onDialogClose
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
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
    if (!autoOpenAllowed || isDialogOpen || !registrationOpen || hasSeenPromo()) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (hasSeenPromo()) return;
      rememberPromoSeen();
      onDialogOpen();
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [autoOpenAllowed, isDialogOpen, onDialogOpen, registrationOpen]);

  useEffect(() => {
    if (!isDialogOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector("button, a")?.focus();
    });

    const keepFocusInside = (event) => {
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );

      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInside);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keepFocusInside);
      previousFocusRef.current?.focus?.();
    };
  }, [isDialogOpen]);

  if (!registrationOpen) return null;

  return (
    <>
      <section className="site-masterclass-promo" aria-labelledby="site-masterclass-promo-title">
        <div className="site-masterclass-promo-card">
          <div className="site-masterclass-promo-photo">
            <img
              src="/assets/site/masterclass-real/masterclass-real-06.webp"
              alt="Дети на мастер-классе рядом с приготовленными пиццами"
              loading="eager"
            />
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
              Наденем фартуки, раскатаем тесто, выберем начинку и вместе с пиццайоло
              испечём свою пиццу.
            </p>

            <div className="site-masterclass-promo-meta" aria-label="Условия мастер-класса">
              <strong>900 ₽ <span>за участника</span></strong>
              <span className="site-masterclass-promo-places" aria-live="polite">
                <Heart size={18} fill="currentColor" />
                Уже {participantLabel}
              </span>
            </div>

            <a className="site-masterclass-promo-action" href={eventPath}>
              Записаться
              <ArrowRight size={19} />
            </a>
          </div>
        </div>
      </section>

      {isDialogOpen ? (
        <div
          className="site-masterclass-promo-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onDialogClose();
          }}
        >
          <section
            className="site-masterclass-promo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-masterclass-dialog-title"
            aria-describedby="site-masterclass-dialog-description"
            ref={dialogRef}
          >
            <button
              className="site-masterclass-promo-close"
              type="button"
              aria-label="Закрыть приглашение"
              onClick={onDialogClose}
            >
              <X size={22} />
            </button>

            <div className="site-masterclass-promo-dialog-photo">
              <img
                src="/assets/site/masterclass-real/masterclass-real-03.webp"
                alt="Дети готовят пиццу на мастер-классе"
              />
            </div>

            <div className="site-masterclass-promo-dialog-copy">
              <span className="site-masterclass-promo-dialog-kicker">
                {EVENT.shortDateLabel} · {EVENT.timeLabel}
              </span>
              <h2 id="site-masterclass-dialog-title">
                Приглашаем на мастер-класс {urgencyLabels.kicker.toLowerCase()}
              </h2>
              <p id="site-masterclass-dialog-description">
                Готовим настоящую итальянскую пиццу на итальянском тесте в настоящей
                итальянской печи вместе с нашим пиццайоло. Очень ждём вас!
              </p>

              <div className="site-masterclass-promo-dialog-facts">
                <span><Clock3 size={18} /> 11:00 · 900 ₽</span>
                <span className="site-masterclass-promo-places">
                  <Heart size={18} fill="currentColor" /> Уже {participantLabel}
                </span>
                <span><MapPin size={18} /> Пирогова, 1Т</span>
              </div>

              <a className="site-masterclass-promo-dialog-action" href={eventPath}>
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
