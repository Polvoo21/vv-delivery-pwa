import "../../styles/site/masterclasses.css";
import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChefHat,
  Clock3,
  MapPin,
  Pizza,
  Users
} from "lucide-react";
import {
  MASTERCLASSES_PATH,
  MASTERCLASS_EVENTS,
  SITE_ORIGIN
} from "../../../shared/masterclass-events";
import { IndividualMasterclassPromo } from "./IndividualMasterclassPromo";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { getSiteHomePath, getSitePagePath } from "./siteData";

const PAGE_TITLE = "Куда сходить с ребёнком в Чебоксарах | Вместе Вкуснее";
const PAGE_DESCRIPTION =
  "Кулинарные мастер-классы для детей и взрослых в Чебоксарах. Готовим пиццу с пиццайоло: актуальные даты, стоимость и онлайн-запись.";
const PAGE_URL = `${SITE_ORIGIN}${MASTERCLASSES_PATH}`;

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function EventCard({ event, archived = false }) {
  return (
    <article className="site-masterclasses-event-card">
      <a
        className="site-masterclasses-event-image"
        href={getSitePagePath(event.path)}
        aria-label={`Открыть страницу: ${event.cardTitle}`}
      >
        <img
          src="/assets/site/masterclass-real/masterclass-real-03.webp"
          alt={`Мастер-класс «${event.cardTitle}» в семейной пиццерии «Вместе Вкуснее»`}
          width="960"
          height="1280"
          loading="lazy"
        />
      </a>
      <div className="site-masterclasses-event-copy">
        <span className="site-masterclasses-status">
          {archived ? "Как это было" : "Запись открыта"}
        </span>
        <h3>{event.cardTitle}</h3>
        <p>
          Каждый участник сам растянет тесто, соберёт пиццу и вместе с пиццайоло
          отправит её в настоящую итальянскую печь.
        </p>
        <dl>
          <div>
            <CalendarDays size={18} />
            <dt>Дата</dt>
            <dd>
              <time dateTime={event.startsAt}>{event.dateLabel}</time>
            </dd>
          </div>
          <div>
            <Clock3 size={18} />
            <dt>Начало</dt>
            <dd>{event.timeLabel}</dd>
          </div>
          <div>
            <MapPin size={18} />
            <dt>Место</dt>
            <dd>{event.shortAddress}</dd>
          </div>
        </dl>
        <div className="site-masterclasses-event-action">
          <strong>{formatPrice(event.pricePerParticipant)} ₽ за участника</strong>
          <a href={getSitePagePath(event.path)}>
            {archived ? "Посмотреть историю" : "Выбрать участников"}
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function SiteMasterclassesPage() {
  const registrationEvents = MASTERCLASS_EVENTS.filter(
    (event) => event.pageMode === "registration"
  ).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const archiveEvents = MASTERCLASS_EVENTS.filter(
    (event) => event.pageMode === "archive"
  ).sort((left, right) => new Date(right.startsAt) - new Date(left.startsAt));
  const nextEvent = registrationEvents[0] || null;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = PAGE_TITLE;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute("content") || "";
    let canonical = document.querySelector('link[rel="canonical"]');
    const shouldRemoveCanonical = !canonical;
    const previousCanonical = canonical?.getAttribute("href") || "";

    descriptionMeta?.setAttribute("content", PAGE_DESCRIPTION);

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", PAGE_URL);

    return () => {
      descriptionMeta?.setAttribute("content", previousDescription);

      if (shouldRemoveCanonical) {
        canonical?.remove();
      } else {
        canonical?.setAttribute("href", previousCanonical);
      }
    };
  }, []);

  return (
    <SitePublicShell className="site-masterclasses-page">
      <section className="site-masterclasses-hero" aria-labelledby="site-masterclasses-title">
        <div className="site-masterclasses-hero-copy">
          <a className="site-masterclasses-back" href={getSiteHomePath()}>
            <ArrowLeft size={18} />
            На главную
          </a>
          <p className="site-eyebrow">Воскресные мастер-классы</p>
          <h1 id="site-masterclasses-title">
            Кулинарные мастер-классы для детей и взрослых в Чебоксарах
          </h1>
          <p>
            Если ищете, чем заняться в Чебоксарах или куда сходить с ребёнком,
            приходите готовить на настоящей кухне «Вместе Вкуснее». Учимся у
            пиццайоло и уходим со своей горячей пиццей.
          </p>
          {nextEvent ? (
            <a className="site-masterclasses-primary" href={getSitePagePath(nextEvent.path)}>
              Записаться на {nextEvent.shortDateLabel}
              <ArrowRight size={18} />
            </a>
          ) : (
            <a className="site-masterclasses-primary" href="#archive">
              Посмотреть прошедшие встречи
              <ArrowRight size={18} />
            </a>
          )}
        </div>
        <figure className="site-masterclasses-hero-photo">
          <img
            src="/assets/site/masterclass-real/masterclass-real-02.webp"
            alt="Участники одного из прошлых мастер-классов вместе с ведущими"
            width="1280"
            height="960"
            fetchPriority="high"
          />
          <figcaption>Вместе готовить веселее. Вместе пробовать ещё вкуснее.</figcaption>
        </figure>
      </section>

      <section className="site-masterclasses-current" aria-labelledby="site-masterclasses-current-title">
        <div className="site-masterclasses-section-head">
          <p className="site-eyebrow">Ближайшая встреча</p>
          <h2 id="site-masterclasses-current-title">
            Выберите воскресенье для вкусного воспоминания
          </h2>
          <p>
            У каждой даты своя тема, начинка и отдельная страница с точными условиями.
            Так ничего не потеряется и всегда понятно, на какую встречу вы записываетесь.
          </p>
        </div>
        <div className="site-masterclasses-event-list">
          {registrationEvents.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      </section>

      <section className="site-masterclasses-features" aria-labelledby="site-masterclasses-features-title">
        <div className="site-masterclasses-section-head">
          <p className="site-eyebrow">Не просто занятие</p>
          <h2 id="site-masterclasses-features-title">
            Маленькое приключение на настоящей кухне
          </h2>
        </div>
        <div>
          <article>
            <ChefHat size={25} />
            <h3>В образе пиццайоло</h3>
            <p>
              Колпак, фартук и собственное рабочее место помогают почувствовать:
              сегодня здесь готовлю я.
            </p>
          </article>
          <article>
            <Pizza size={25} />
            <h3>Результат можно съесть</h3>
            <p>
              Каждый проходит путь от мягкого теста до горячей пиццы, которую особенно
              приятно разделить с близкими.
            </p>
          </article>
          <article>
            <Users size={25} />
            <h3>Вместе всегда вкуснее</h3>
            <p>
              Дети и взрослые готовят рядом, сравнивают бортики и забирают домой
              не только пиццу, но и общую историю.
            </p>
          </article>
        </div>
      </section>

      <IndividualMasterclassPromo />

      <section
        className="site-masterclasses-archive"
        id="archive"
        aria-labelledby="site-masterclasses-archive-title"
      >
        <div className="site-masterclasses-section-head">
          <p className="site-eyebrow">Архив встреч</p>
          <h2 id="site-masterclasses-archive-title">Каждый мастер-класс остаётся с нами</h2>
          <p>
            После встречи её страница не исчезнет. Добавим фотографии, расскажем,
            что готовили, и сохраним самые тёплые моменты. А для новой даты откроем
            новую страницу записи.
          </p>
        </div>

        {archiveEvents.length ? (
          <div className="site-masterclasses-event-list">
            {archiveEvents.map((event) => (
              <EventCard archived event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <div className="site-masterclasses-archive-empty">
            <Camera size={28} />
            <div>
              <h3>
                Первая история появится после встречи
                {nextEvent ? ` ${nextEvent.shortDateLabel}` : ""}
              </h3>
              <p>
                Здесь соберём фотографии, впечатления и ту самую пиццу,
                которую участники приготовят своими руками.
              </p>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
