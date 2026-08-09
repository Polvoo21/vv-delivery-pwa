import "../../styles/site/masterclass.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarX2,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Pizza,
  Plus,
  Share2,
  ShieldCheck,
  Users
} from "lucide-react";
import { apiPath } from "../../utils/api";
import { METRIKA_GOALS, reachMetrikaGoal } from "../../utils/analytics";
import {
  getNextMasterclassEvent,
  MASTERCLASSES_PATH,
  MASTERCLASS_EVENT as DEFAULT_MASTERCLASS_EVENT
} from "../../../shared/masterclass-events";
import { IndividualMasterclassPromo } from "./IndividualMasterclassPromo";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { PHONE, getSitePagePath, telHref } from "./siteData";

function createProcessSteps(event) {
  return [
  {
    icon: ChefHat,
    title: "Станем настоящими пиццайоло",
    text: "На время мастер-класса выдадим шефовский колпак и фартук. Получится тот самый образ «я на настоящей кухне», а одежда останется защищена от муки и соуса."
  },
  {
    icon: Pizza,
    title: "Почувствуем живое тесто",
    text: "Специально к встрече оно будет созревать 48 часов. Мягкое, эластичное и готовое слушаться маленьких рук.",
    href: "#dough-story",
    linkLabel: "Почему тесту нужно 48 часов"
  },
  {
    icon: CheckCircle2,
    title: "Соберём пиццу и смешаем лимонад",
    text: `${event.shortDateLabel} каждый участник приготовит ${event.pizzaAccusative} и освежающий лимонад. И детям, и взрослым всё покажем: пиццайоло будет рядом, подскажет и поможет.`
  },
  {
    icon: Flame,
    title: "Доверим пиццу итальянской печи",
    text: "Испечём её в профессиональной Marana Forni стоимостью больше 2 млн ₽. Такой финал дома не повторить.",
    href: "#oven-story",
    linkLabel: "Что особенного в этой печи"
  }
  ];
}

const MASTERCLASS_REAL_PHOTOS = [
  {
    src: "/assets/site/masterclass-real/masterclass-real-01.webp",
    alt: "Дети в красных колпаках пробуют приготовленные на мастер-классе пиццы"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-02.webp",
    alt: "Участники прошлого мастер-класса вместе с ведущими в зале пиццерии"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-03.webp",
    alt: "Дети самостоятельно распределяют соус по тесту для пиццы"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-04.webp",
    alt: "Две участницы мастер-класса показывают готовые пиццы"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-05.webp",
    alt: "Дети в форме пиццайоло вместе готовят за общим столом"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-06.webp",
    alt: "Юные пиццайоло рядом со своими пиццами до выпечки"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-07.webp",
    alt: "Два участника мастер-класса держат приготовленные ими пиццы"
  },
  {
    src: "/assets/site/masterclass-real/masterclass-real-08.webp",
    alt: "Процесс приготовления пицц на настоящей кухне ресторана"
  }
];

function createFaqItems(event) {
  return [
  {
    question: "Для кого этот мастер-класс?",
    answer:
      "Для детей и взрослых. В форме укажите возраст каждого участника младше 18 лет, чтобы команда заранее подготовила помощь и рабочие места."
  },
  {
    question: `Что входит в стоимость ${event.pricePerParticipant} ₽?`,
    answer:
      `Рабочее место, колпак и фартук на время мастер-класса, наше тесто, ингредиенты для пиццы и лимонада, помощь пиццайоло, ${event.finishedPizzaLabel} и приготовленный вами лимонад.`
  },
  {
    question: `Какую пиццу готовим ${event.shortDateLabel}?`,
    answer:
      `В этот день у мастер-класса одна пицца для всех: ${event.pizza.toLowerCase()}. На следующих встречах начинка может меняться, её всегда заранее укажем на странице.`
  },
  {
    question: "А если мы никогда не готовили пиццу?",
    answer:
      "Опыт не нужен. В зависимости от размера группы рядом будет один или два пиццайоло. Они покажут каждое движение, помогут справиться с тестом и подскажут, если что-то не получается."
  },
  {
    question: "Нужно ли брать специальную одежду?",
    answer:
      "Нет. На время мастер-класса каждому участнику выдадим шефовский колпак и фартук. Фартук поможет защитить одежду от муки и соуса, поэтому можно спокойно включаться в готовку."
  },
  {
    question: `Что будет, если запишутся меньше ${event.minimumParticipants} человек?`,
    answer:
      `Утром ${event.shortDateLabel} мы проверим число участников. Если будет меньше ${event.minimumParticipants}, отменим мастер-класс, свяжемся со всеми и вернём полную стоимость.`
  },
  {
    question: `Можно записаться, если уже набралось ${event.minimumParticipants} человек?`,
    answer:
      `Да. ${event.minimumParticipants} участников нужны только для запуска мастер-класса. Верхнего лимита для этой записи нет.`
  },
  {
    question: "Когда приходить?",
    answer:
      `Мастер-класс начнётся в ${event.dateLabel.toLowerCase()} в ${event.timeLabel}. Лучше прийти за 10-15 минут, чтобы спокойно подготовиться.`
  }
  ];
}

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function formatPhoneInput(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits && !digits.startsWith("7")) {
    digits = `7${digits}`;
  }

  digits = digits.slice(0, 11);
  const local = digits.startsWith("7") ? digits.slice(1) : digits;

  if (!local.length) return "";
  if (local.length <= 3) return `+7 (${local}`;
  if (local.length <= 6) return `+7 (${local.slice(0, 3)}) ${local.slice(3)}`;
  if (local.length <= 8) {
    return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8, 10)}`;
}

function participantWord(count) {
  const value = Math.abs(Number(count || 0));
  const lastTwo = value % 100;
  const last = value % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return "участников";
  if (last === 1) return "участник";
  if (last >= 2 && last <= 4) return "участника";
  return "участников";
}

const MASTERCLASS_PAYMENT_STORAGE_KEY = "vv_masterclass_pending_payment";

function savePendingMasterclassPayment(registration) {
  try {
    window.localStorage.setItem(MASTERCLASS_PAYMENT_STORAGE_KEY, JSON.stringify(registration));
  } catch {
    // Возврат из ЮKassa также содержит непредсказуемый UUID записи.
  }
}

function readPendingMasterclassPayment() {
  try {
    return JSON.parse(window.localStorage.getItem(MASTERCLASS_PAYMENT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function clearPendingMasterclassPayment() {
  try {
    window.localStorage.removeItem(MASTERCLASS_PAYMENT_STORAGE_KEY);
  } catch {
    // Недоступный localStorage не мешает завершить сценарий оплаты.
  }
}

async function readApiJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || "Не удалось выполнить запрос");
  }

  return data;
}

function CountField({ id, label, value, max, onChange }) {
  const setCount = (nextValue) => {
    const parsed = Number(nextValue);
    const safeValue = Number.isFinite(parsed) ? Math.max(0, Math.min(max, Math.trunc(parsed))) : 0;
    onChange(safeValue);
  };

  return (
    <div className="site-masterclass-count-field">
      <label htmlFor={id}>{label}</label>
      <div>
        <button
          type="button"
          aria-label={`Уменьшить: ${label.toLowerCase()}`}
          onClick={() => setCount(value - 1)}
          disabled={value <= 0}
        >
          <Minus size={18} />
        </button>
        <input
          id={id}
          type="number"
          min="0"
          max={max}
          inputMode="numeric"
          value={value}
          onChange={(event) => setCount(event.target.value)}
        />
        <button
          type="button"
          aria-label={`Увеличить: ${label.toLowerCase()}`}
          onClick={() => setCount(value + 1)}
          disabled={value >= max}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export function SiteMasterClassPage({ event = DEFAULT_MASTERCLASS_EVENT }) {
  const EVENT = event;
  const nextEvent = useMemo(() => getNextMasterclassEvent(EVENT), [EVENT]);
  const isCancelled = EVENT.status === "cancelled" || EVENT.pageMode === "archive";
  const PROCESS_STEPS = useMemo(() => createProcessSteps(EVENT), [EVENT]);
  const FAQ_ITEMS = useMemo(() => createFaqItems(EVENT), [EVENT]);
  const [eventState, setEventState] = useState({
    registeredParticipants: 0,
    minimumParticipants: EVENT.minimumParticipants,
    minimumReached: false,
    remainingParticipants: EVENT.minimumParticipants,
    registrationOpen: EVENT.pageMode === "registration"
  });
  const [shareStatus, setShareStatus] = useState("");
  const [shareSource, setShareSource] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [stage, setStage] = useState("form");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    adultsCount: 1,
    childrenCount: 0,
    childrenAges: [],
    privacyPolicyAccepted: false,
    personalDataConsent: false,
    marketingConsent: false
  });
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registeredParticipants = Number(eventState.registeredParticipants || 0);
  const minimumParticipants = Number(eventState.minimumParticipants || EVENT.minimumParticipants);
  const minimumReached = registeredParticipants >= minimumParticipants;
  const registrationOpen = eventState.registrationOpen === true && !isCancelled;
  const participantCount = form.adultsCount + form.childrenCount;
  const total = participantCount * EVENT.pricePerParticipant;

  const counterMessage = useMemo(() => {
    if (minimumReached) {
      return "Группа собралась. Мастер-класс состоится, будем готовить вместе!";
    }

    return `Для встречи нужно хотя бы ${minimumParticipants} участников. Если группа не соберётся, заранее напишем и полностью вернём оплату.`;
  }, [minimumReached, minimumParticipants]);

  const loadEvent = useCallback(async () => {
    try {
      const data = await fetch(`${apiPath("masterclassEvent")}/${EVENT.id}`, {
        headers: { Accept: "application/json" }
      }).then(readApiJson);

      setEventState(data.event);
    } catch {
      // Оставляем последнее известное значение: следующий запрос повторится автоматически.
    }
  }, [EVENT.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadEvent();

    const interval = window.setInterval(loadEvent, 20000);
    return () => window.clearInterval(interval);
  }, [loadEvent]);

  useEffect(() => {
    if (isCancelled) {
      setStage("form");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const returnedRegistrationId = params.get("registrationId") || "";
    const storedRegistration = readPendingMasterclassPayment();
    if (params.get("provider") !== "yookassa" || params.get("payment") !== "return" || !returnedRegistrationId) {
      if (storedRegistration?.eventId === EVENT.id && storedRegistration?.paymentStatus !== "paid") {
        setPendingRegistration(storedRegistration);
        setStage("payment");
      }
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    const registration = storedRegistration?.id === returnedRegistrationId
      ? storedRegistration
      : { id: returnedRegistrationId, eventId: EVENT.id };
    setPendingRegistration(registration);
    setStage("payment");
    checkMasterclassPayment(registration);
  }, [EVENT.id, isCancelled]);

  useEffect(() => {
    const description = EVENT.seoDescription;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute("content") || "";
    let canonical = document.querySelector('link[rel="canonical"]');
    const shouldRemoveCanonical = !canonical;
    const previousCanonical = canonical?.getAttribute("href") || "";

    descriptionMeta?.setAttribute("content", description);

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", EVENT.shareUrl);

    return () => {
      descriptionMeta?.setAttribute("content", previousDescription);

      if (shouldRemoveCanonical) {
        canonical?.remove();
      } else {
        canonical?.setAttribute("href", previousCanonical);
      }
    };
  }, [EVENT]);

  useEffect(() => {
    if (!shareStatus) return undefined;

    const timer = window.setTimeout(() => {
      setShareStatus("");
      setShareSource("");
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [shareStatus, shareSource]);

  const handleShare = async (source) => {
    setShareSource(source);
    setShareStatus("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable");
      }

      await navigator.clipboard.writeText(EVENT.shareUrl);
      setShareStatus("Ссылка скопирована в буфер. Можно отправить друзьям.");
    } catch {
      setShareStatus("Не удалось скопировать. Скопируйте адрес из строки браузера.");
    }
  };

  const setChildrenCount = (childrenCount) => {
    setForm((current) => ({
      ...current,
      childrenCount,
      childrenAges: Array.from(
        { length: childrenCount },
        (_, index) => current.childrenAges[index] ?? ""
      )
    }));
  };

  const setChildAge = (index, value) => {
    const age = value === "" ? "" : Math.max(0, Math.min(17, Number(value)));
    setForm((current) => ({
      ...current,
      childrenAges: current.childrenAges.map((currentAge, currentIndex) =>
        currentIndex === index ? age : currentAge
      )
    }));
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.privacyPolicyAccepted || !form.personalDataConsent) {
      setFormError("Для записи отметьте две обязательные галочки о персональных данных.");
      return;
    }

    if (form.childrenAges.some((age) => age === "")) {
      setFormError("Укажите возраст каждого ребёнка.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await fetch(`${apiPath("masterclassEvent")}/${EVENT.id}/registrations`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          adultsCount: form.adultsCount,
          childrenCount: form.childrenCount,
          childrenAges: form.childrenAges.map(Number),
          privacyPolicyAccepted: form.privacyPolicyAccepted,
          personalDataConsent: form.personalDataConsent,
          marketingConsent: form.marketingConsent
        })
      }).then(readApiJson);

      setPendingRegistration(data.registration);
      savePendingMasterclassPayment(data.registration);
      setStage("payment");
      reachMetrikaGoal(METRIKA_GOALS.MASTERCLASS_SIGNUP, {
        event_id: EVENT.id,
        registration_id: data.registration?.id || "",
        participants: participantCount,
        order_total: Number(total || 0)
      });
    } catch (error) {
      setFormError(error.message || "Не удалось сохранить запись. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startMasterclassPayment = async () => {
    if (!pendingRegistration?.id) return;

    setFormError("");
    setIsSubmitting(true);

    try {
      const data = await fetch(
        `${apiPath("masterclassEvent")}/${EVENT.id}/registrations/${pendingRegistration.id}/payment`,
        {
          method: "POST",
          headers: { Accept: "application/json" }
        }
      ).then(readApiJson);

      setPendingRegistration(data.registration);
      savePendingMasterclassPayment(data.registration);
      if (data.paid) {
        clearPendingMasterclassPayment();
        setStage("success");
        await loadEvent();
        return;
      }
      if (!data.paymentUrl) throw new Error("ЮKassa не вернула ссылку оплаты.");
      reachMetrikaGoal(METRIKA_GOALS.MASTERCLASS_PAYMENT, {
        event_id: EVENT.id,
        registration_id: data.registration?.id || pendingRegistration.id,
        participants: participantCount,
        order_total: Number(total || 0)
      });
      window.location.href = data.paymentUrl;
    } catch (error) {
      setFormError(error.message || "Не удалось перейти к оплате.");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function checkMasterclassPayment(registration = pendingRegistration) {
    if (!registration?.id) return;
    setFormError("Проверяем оплату в ЮKassa...");
    setIsSubmitting(true);
    try {
      const data = await fetch(
        `${apiPath("masterclassEvent")}/${EVENT.id}/registrations/${registration.id}/payment/status`,
        { headers: { Accept: "application/json" } }
      ).then(readApiJson);
      setPendingRegistration(data.registration);
      if (data.paid) {
        reachMetrikaGoal(METRIKA_GOALS.MASTERCLASS_PAID, {
          event_id: EVENT.id,
          registration_id: data.registration?.id || registration.id,
          order_total: Number(data.registration?.total || 0)
        });
        clearPendingMasterclassPayment();
        setEventState(data.event);
        setFormError("");
        setStage("success");
      } else {
        savePendingMasterclassPayment(data.registration);
        setFormError(
          data.paymentStatus === "canceled"
            ? "Платёж отменён. Можно попробовать оплатить ещё раз."
            : "ЮKassa ещё не подтвердила оплату. Проверьте статус через несколько секунд."
        );
      }
    } catch (error) {
      setFormError(error.message || "Не удалось проверить оплату.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SitePublicShell className="site-masterclass-page">
      <section className="site-masterclass-hero" aria-labelledby="site-masterclass-title">
        <div className="site-masterclass-hero-copy">
          <a className="site-masterclass-back" href={getSitePagePath(MASTERCLASSES_PATH)}>
            <ArrowLeft size={18} />
            Все мастер-классы
          </a>

          <p className="site-eyebrow">Воскресный мастер-класс</p>
          <h1 id="site-masterclass-title">
            {isCancelled
              ? `Мастер-класс ${EVENT.shortDateLabel} не состоялся`
              : "Мастер-класс по пицце для детей и взрослых"}
          </h1>

          <div className="site-masterclass-quick-facts" aria-label="Коротко о мастер-классе">
            <span>{EVENT.shortDateLabel} · {EVENT.timeLabel}</span>
            {isCancelled ? (
              <>
                <span>Встреча отменена</span>
                <span>Группа не набралась</span>
                <span>Оплата закрыта</span>
              </>
            ) : (
              <>
                <span>Детям и взрослым</span>
                <span>Пицца и лимонад</span>
                <span>Своя пицца с собой</span>
              </>
            )}
          </div>

          <p className="site-masterclass-hero-lead">
            {isCancelled
              ? `Мы планировали готовить ${EVENT.pizzaAccusative} и лимонад вместе с пиццайоло, но нужное число участников не собралось. Встречу отменили, а запись и оплату на эту дату закрыли.`
              : `Наденете колпак и фартук, поработаете с нашим тестом, соберёте ${EVENT.pizzaAccusative}, смешаете освежающий лимонад и испечёте пиццу вместе с пиццайоло в настоящей итальянской печи. А затем можно сразу попробовать горячую пиццу и запить лимонадом собственного приготовления.`}
          </p>

          {isCancelled ? (
            <div className="site-masterclass-cancelled-notice" role="status">
              <CalendarX2 size={22} />
              <div>
                <strong>Мастер-класс {EVENT.shortDateLabel} не состоялся</strong>
                <span>Группа не набралась, поэтому фотографий и видео с этой встречи не будет.</span>
              </div>
            </div>
          ) : null}

          <div className="site-masterclass-hero-offer" aria-label="Цена и условие проведения">
            {isCancelled ? (
              <>
                <div>
                  <strong>Оплата закрыта</strong>
                  <span>на прошедшую дату</span>
                </div>
                <div>
                  <strong>{nextEvent?.shortDateLabel || "Новая дата скоро"}</strong>
                  <span>ближайшая встреча</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong>{formatPrice(EVENT.pricePerParticipant)} ₽</strong>
                  <span>за одного участника</span>
                </div>
                <div>
                  <strong>от {EVENT.minimumParticipants} человек</strong>
                  <span>чтобы встреча состоялась</span>
                </div>
              </>
            )}
          </div>

          <div className="site-masterclass-hero-actions">
            {isCancelled ? (
              <>
                <button className="site-masterclass-primary is-disabled" type="button" disabled>
                  Оплата недоступна
                </button>
                {nextEvent ? (
                  <a className="site-masterclass-secondary is-next" href={getSitePagePath(nextEvent.path)}>
                    Следующий мастер-класс {nextEvent.shortDateLabel}
                    <ArrowRight size={18} />
                  </a>
                ) : null}
              </>
            ) : (
              <a className="site-masterclass-primary" href="#masterclass-registration-form">
                Записаться
              </a>
            )}
            <a className="site-masterclass-secondary" href={telHref(PHONE)}>
              <Phone size={18} />
              Позвонить
            </a>
            <div className="site-masterclass-hero-share-control">
              <button
                className="site-masterclass-hero-share"
                type="button"
                onClick={() => handleShare("hero")}
              >
                <Share2 size={18} />
                Позвать друзей
              </button>
              {shareSource === "hero" && shareStatus ? (
                <span className="site-masterclass-share-popover" role="status">
                  {shareStatus.startsWith("Ссылка") ? <Check size={15} /> : null}
                  {shareStatus}
                </span>
              ) : null}
            </div>
          </div>
          <p className="site-masterclass-phone-note">
            {isCancelled
              ? "Если вы успели оплатить участие, администратор свяжется с вами по возврату."
              : "Можно записаться по телефону: администратор добавит участников в список."}
          </p>

          <div className="site-masterclass-event-card" aria-label="Дата, время и место мастер-класса">
            <div className="site-masterclass-event-detail">
              <CalendarDays size={19} />
              <span>
                <small>Когда</small>
                <b>{EVENT.dateLabel}</b>
                <em>
                  <Clock3 size={15} />
                  Начало в {EVENT.timeLabel}
                </em>
              </span>
            </div>
            <div className="site-masterclass-event-detail">
              <MapPin size={19} />
              <span>
                <small>Где</small>
                <b>Пирогова, 1Т</b>
                <em>Чебоксары</em>
              </span>
            </div>
            <a
              className="site-masterclass-route"
              href={EVENT.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={17} />
              Как проехать
            </a>
          </div>
        </div>

        <div className="site-masterclass-hero-visual">
          <figure className="site-masterclass-hero-main-photo">
            <img
              src="/assets/site/masterclass-real/masterclass-real-03.webp"
              alt="Дети самостоятельно собирают пиццы на одном из наших мастер-классов"
              width="960"
              height="1280"
              fetchPriority="high"
            />
            <figcaption>
              Настоящий мастер-класс: каждый готовит собственную пиццу и лимонад
            </figcaption>
          </figure>
          <figure className="site-masterclass-hero-side-photo">
            <img
              src="/assets/site/masterclass-real/masterclass-real-04.webp"
              alt="Участницы прошлого мастер-класса с готовыми пиццами"
              width="960"
              height="1280"
            />
          </figure>
          <figure className="site-masterclass-hero-side-photo">
            <img
              src="/assets/site/masterclass-real/masterclass-real-01.webp"
              alt="Дети пробуют собственные пиццы после мастер-класса"
              width="960"
              height="1280"
            />
          </figure>
        </div>
      </section>

      {!isCancelled ? (
      <section className="site-masterclass-value" aria-labelledby="site-masterclass-value-title">
        <div>
          <p className="site-eyebrow">Впечатление, которое останется</p>
          <h2 id="site-masterclass-value-title">«Я сам приготовил пиццу и лимонад!»</h2>
          <p>
            Ребёнок почувствует себя настоящим пиццайоло, взрослые разделят его радость,
            а горячая пицца и освежающий лимонад станут вкусным финалом дня,
            который захочется вспоминать.
          </p>
        </div>
        <dl>
          <div>
            <dt>{formatPrice(EVENT.pricePerParticipant)} ₽</dt>
            <dd>за одного участника, всё включено</dd>
          </div>
          <div>
            <dt>Пицца + лимонад</dt>
            <dd>приготовит каждый участник</dd>
          </div>
          <div>
            <dt>{EVENT.minimumParticipants} человек</dt>
            <dd>собираем дружную компанию</dd>
            <a href="#minimum-group">Что это значит?</a>
          </div>
        </dl>
      </section>
      ) : null}

      <div className="site-masterclass-layout">
        <div className="site-masterclass-content">
          {isCancelled ? (
            <section className="site-masterclass-archive-summary" aria-labelledby="site-masterclass-archive-summary-title">
              <p className="site-eyebrow">Что дальше</p>
              <h2 id="site-masterclass-archive-summary-title">Приглашаем на следующую встречу</h2>
              <p>
                Мы продолжим проводить воскресные мастер-классы. Формат остаётся тем же:
                каждый участник приготовит собственную пиццу и лимонад вместе с пиццайоло.
              </p>
              {nextEvent ? (
                <a href={getSitePagePath(nextEvent.path)}>
                  Записаться на {nextEvent.shortDateLabel}
                  <ArrowRight size={18} />
                </a>
              ) : (
                <a href={getSitePagePath(MASTERCLASSES_PATH)}>
                  Все мастер-классы
                  <ArrowRight size={18} />
                </a>
              )}
            </section>
          ) : (
            <>
          <section className="site-masterclass-process" aria-labelledby="site-masterclass-process-title">
            <div className="site-masterclass-section-head">
              <p className="site-eyebrow">Как всё пройдёт</p>
              <h2 id="site-masterclass-process-title">
                <span className="site-masterclass-process-title-line">Четыре шага до</span>{" "}
                <span className="site-masterclass-process-title-line">«Я приготовил это сам!»</span>
              </h2>
            </div>
            <div className="site-masterclass-process-grid">
              {PROCESS_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={23} />
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    {step.href ? (
                      <a href={step.href}>
                        {step.linkLabel}
                        <ArrowRight size={16} />
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="site-masterclass-threshold"
            id="minimum-group"
            aria-labelledby="site-masterclass-threshold-title"
          >
            <div>
              <Users size={28} />
              <p className="site-eyebrow">Добрая воскресная традиция</p>
              <h2 id="site-masterclass-threshold-title">Будем собираться и готовить вместе</h2>
            </div>
            <div className="site-masterclass-threshold-copy">
              <p>
                Мы правда хотели бы проводить встречу даже для совсем маленькой компании.
                Но чтобы подготовить кухню, продукты и команду пиццайоло, нам важно собрать
                хотя бы 8 участников. Тогда мастер-класс получается живым, весёлым и комфортным для всех.
              </p>
              <p>
                Если {EVENT.shortDateLabel} группа пока не соберётся, пожалуйста, не расстраивайтесь.
                Мы заранее напишем и полностью вернём оплату. На этом всё не закончится:
                будем проводить мастер-классы по воскресеньям, чаще рассказывать о них
                и придумывать новые вкусные темы.
              </p>
              <button type="button" onClick={() => handleShare("threshold")}>
                <Share2 size={17} />
                Помочь группе собраться
              </button>
            </div>
          </section>

          <section
            className="site-masterclass-story site-masterclass-dough-story"
            id="dough-story"
            aria-labelledby="site-masterclass-dough-title"
          >
            <div className="site-masterclass-story-copy">
              <p className="site-eyebrow">Начинаем готовить за два дня до встречи</p>
              <h2 id="site-masterclass-dough-title">Тесто, которое два дня ждало ваших рук</h2>
              <p>
                Пока вы только планируете воскресенье, у нас уже начинается ваша пицца.
                Замесим тесто заранее и дадим ему 48 часов медленно набирать вкус.
                К встрече оно станет мягким, эластичным и ароматным.
              </p>
              <p>
                Вы сразу возьмёте в руки то самое тесто, из которого готовим в ресторане.
                Оно приятно тянется под ладонями и будто само подсказывает форму будущей пиццы.
              </p>
              <small>
                Долгая ферментация меняет структуру теста и снижает содержание части
                ферментируемых сахаров. Индивидуальная переносимость продуктов всегда различается.
              </small>
            </div>
            <div className="site-masterclass-dough-journey" aria-label="Как тесто созревает за 48 часов">
              <div className="site-masterclass-dough-journey-head">
                <Clock3 size={24} aria-hidden="true" />
                <div>
                  <strong>48 часов</strong>
                  <span>без спешки, специально к вашей встрече</span>
                </div>
              </div>
              <ol>
                <li>
                  <span>0 ч</span>
                  <div>
                    <strong>Замешиваем</strong>
                    <small>Начинается вкус</small>
                  </div>
                </li>
                <li>
                  <span>24 ч</span>
                  <div>
                    <strong>Даём созреть</strong>
                    <small>Появляются аромат и эластичность</small>
                  </div>
                </li>
                <li>
                  <span>48 ч</span>
                  <div>
                    <strong>Передаём вам</strong>
                    <small>Мягкое и готовое стать пиццей</small>
                  </div>
                </li>
              </ol>
              <p>Разницу вы почувствуете собственными ладонями.</p>
            </div>
          </section>

          <section
            className="site-masterclass-story site-masterclass-oven-story"
            id="oven-story"
            aria-labelledby="site-masterclass-oven-title"
          >
            <img
              src="/assets/site/concept-pizza-oven.jpg"
              alt="Пицца рядом с огнём профессиональной итальянской печи"
              loading="lazy"
            />
            <div className="site-masterclass-story-copy">
              <p className="site-eyebrow">Не учебная заготовка</p>
              <h2 id="site-masterclass-oven-title">
                Настоящая итальянская пицца. Только чуть меньше и полностью ваша
              </h2>
              <p>
                Вы сами растянете наше итальянское тесто 48-часовой ферментации,
                добавите соус, {EVENT.toppingsAccusative}, сформируете красивый борт.
                Пиццайоло всё время будет рядом, чтобы показать движение, подсказать
                и помочь получить результат, которым захочется гордиться.
              </p>
              <p>
                Затем пицца отправится в итальянскую Marana Forni стоимостью больше 2 млн ₽,
                ту самую профессиональную печь, в которой готовим для гостей ресторана.
                Отличие только в размере: пицца участника будет чуть меньше, чтобы каждый
                прошёл весь путь сам и получил собственную горячую пиццу.
              </p>
              <p>
                Пока печь делает своё дело, участники смешают освежающий лимонад.
                Его тоже приготовим своими руками и подадим к горячей пицце.
              </p>
              <strong className="site-masterclass-story-emotion">
                Такой опыт не закажешь с доставкой и не повторишь в обычной домашней духовке.
              </strong>
              <a
                href="https://www.maranaforni.com/who-we-are"
                target="_blank"
                rel="noreferrer"
              >
                Узнать больше о Marana Forni
                <ArrowRight size={16} />
              </a>
            </div>
          </section>

          <section className="site-masterclass-faq" aria-labelledby="site-masterclass-faq-title">
            <div className="site-masterclass-section-head">
              <p className="site-eyebrow">Коротко об условиях</p>
              <h2 id="site-masterclass-faq-title">Частые вопросы</h2>
            </div>
            <div>
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;
                const answerId = `site-masterclass-faq-answer-${index + 1}`;
                const buttonId = `site-masterclass-faq-button-${index + 1}`;

                return (
                  <article
                    className={`site-masterclass-faq-item ${isOpen ? "is-open" : ""}`}
                    key={item.question}
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenFaqIndex((current) => (current === index ? null : index))}
                    >
                      <span>{item.question}</span>
                      <Plus size={20} />
                    </button>
                    <div
                      className="site-masterclass-faq-answer"
                      id={answerId}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={!isOpen}
                    >
                      <div>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
            </>
          )}
        </div>

        <aside className="site-masterclass-signup" id="signup" aria-label="Запись на мастер-класс">
          {isCancelled ? (
            <section className="site-masterclass-cancelled-card" aria-labelledby="site-masterclass-cancelled-title">
              <span className="site-masterclass-cancelled-icon"><CalendarX2 size={30} /></span>
              <p className="site-eyebrow">Встреча отменена</p>
              <h2 id="site-masterclass-cancelled-title">Группа на {EVENT.shortDateLabel} не набралась</h2>
              <p>
                Мастер-класс не проводился, поэтому фотографий и видео с этой даты не будет.
                Оплатить участие на прошедшую встречу уже нельзя.
              </p>
              <button className="site-masterclass-submit" type="button" disabled>
                Оплата недоступна
              </button>
              {nextEvent ? (
                <a className="site-masterclass-next-event" href={getSitePagePath(nextEvent.path)}>
                  <span>
                    <small>Ближайший мастер-класс</small>
                    <strong>{nextEvent.dateLabel}, {nextEvent.timeLabel}</strong>
                  </span>
                  Записаться
                  <ArrowRight size={19} />
                </a>
              ) : (
                <a className="site-masterclass-next-event" href={getSitePagePath(MASTERCLASSES_PATH)}>
                  Посмотреть другие мастер-классы
                  <ArrowRight size={19} />
                </a>
              )}
              <small>
                Ссылка на этой архивной странице всегда ведёт на ближайшую встречу с открытой записью.
              </small>
            </section>
          ) : (
            <>
          <section
            className={`site-masterclass-counter ${minimumReached ? "is-reached" : ""}`}
            aria-live="polite"
          >
            <div className="site-masterclass-counter-top">
              <div className="site-masterclass-counter-count">
                <span>Записались</span>
                <strong>
                  {registeredParticipants} <small>из {minimumParticipants}</small>
                </strong>
              </div>
              <button
                type="button"
                className="site-masterclass-share"
                onClick={() => handleShare("counter")}
              >
                <Share2 size={16} />
                Позвать друзей
              </button>
            </div>
            <p>{counterMessage}</p>
            {shareSource === "counter" && shareStatus ? (
              <small className="site-masterclass-share-status" role="status">
                {shareStatus}
              </small>
            ) : null}
          </section>

          {stage === "form" ? (
            <form
              className="site-masterclass-form"
              id="masterclass-registration-form"
              onSubmit={submitRegistration}
            >
              <div className="site-masterclass-form-body">
                <div className="site-masterclass-form-head">
                  <p className="site-eyebrow">Запись на мастер-класс</p>
                  <h2 id="site-masterclass-signup-title">Кто будет готовить?</h2>
                  <p>{EVENT.dateLabel}, {EVENT.timeLabel}</p>
                </div>

                <label className="site-masterclass-text-field">
                  <span>Имя</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    minLength="2"
                    maxLength="80"
                    required
                    placeholder="Как к вам обращаться"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>

                <label className="site-masterclass-text-field">
                  <span>Телефон</span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: formatPhoneInput(event.target.value) }))
                    }
                  />
                </label>

                <label className="site-masterclass-text-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength="254"
                    placeholder="Для подтверждения и электронного чека"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>

                <div className="site-masterclass-counts">
                  <CountField
                    id="masterclass-adults"
                    label="Взрослых участников"
                    value={form.adultsCount}
                    max={100 - form.childrenCount}
                    onChange={(adultsCount) => setForm((current) => ({ ...current, adultsCount }))}
                  />
                  <CountField
                    id="masterclass-children"
                    label="Детей-участников"
                    value={form.childrenCount}
                    max={100 - form.adultsCount}
                    onChange={setChildrenCount}
                  />
                </div>

                {form.childrenCount > 0 ? (
                  <fieldset className="site-masterclass-ages">
                    <legend>Возраст детей</legend>
                    <div>
                      {form.childrenAges.map((age, index) => (
                        <label key={`child-age-${index + 1}`}>
                          <span>Ребёнок {index + 1}</span>
                          <input
                            type="number"
                            min="0"
                            max="17"
                            inputMode="numeric"
                            required
                            placeholder="Лет"
                            value={age}
                            onChange={(event) => setChildAge(index, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <small>Если ребёнку меньше года, укажите 0.</small>
                  </fieldset>
                ) : null}

                <div
                  className="site-masterclass-consents"
                  aria-label="Согласия на обработку данных"
                >
                  <label className="site-masterclass-consent">
                    <input
                      type="checkbox"
                      required
                      checked={form.privacyPolicyAccepted}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          privacyPolicyAccepted: event.target.checked
                        }))
                      }
                    />
                    <span>
                      Я ознакомлен(а) с{" "}
                      <a href="/legal/privacy" target="_blank" rel="noreferrer">
                        Политикой обработки персональных данных
                      </a>
                      .
                    </span>
                  </label>

                  <label className="site-masterclass-consent">
                    <input
                      type="checkbox"
                      required
                      checked={form.personalDataConsent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          personalDataConsent: event.target.checked
                        }))
                      }
                    />
                    <span>
                      Я даю{" "}
                      <a href="/legal/personal-data" target="_blank" rel="noreferrer">
                        согласие на обработку персональных данных
                      </a>
                      , необходимых для записи на мастер-класс.
                    </span>
                  </label>

                  <label className="site-masterclass-consent is-optional">
                    <input
                      type="checkbox"
                      checked={form.marketingConsent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          marketingConsent: event.target.checked
                        }))
                      }
                    />
                    <span>
                      Я согласен(на) получать рекламные и информационные сообщения.{" "}
                      <a href="/legal/advertising-consent" target="_blank" rel="noreferrer">
                        Условия согласия
                      </a>
                      . <em>Необязательно</em>
                    </span>
                  </label>
                </div>
              </div>

              <div className="site-masterclass-form-footer">
                <div className="site-masterclass-total">
                  <span>
                    {participantCount} {participantWord(participantCount)}
                  </span>
                  <strong>{formatPrice(total)} ₽</strong>
                </div>

                {formError ? <p className="site-masterclass-form-error" role="alert">{formError}</p> : null}

                <button
                  className="site-masterclass-submit"
                  type="submit"
                  disabled={isSubmitting || participantCount < 1 || !registrationOpen}
                >
                  {isSubmitting ? "Сохраняем..." : "Продолжить к оплате"}
                </button>
                <p className="site-masterclass-demo-note">
                  После подтверждения записи откроется защищённая страница ЮKassa.
                </p>
              </div>
            </form>
          ) : null}

          {stage === "payment" ? (
            <section className="site-masterclass-payment" aria-labelledby="site-masterclass-payment-title">
              <ShieldCheck size={30} />
              <p className="site-eyebrow">Онлайн-оплата</p>
              <h2 id="site-masterclass-payment-title">Оплатите участие</h2>
              <p>
                Оплата пройдёт на защищённой странице ЮKassa. Запись подтвердится только
                после серверного подтверждения платежа.
              </p>
              <dl>
                <div>
                  <dt>Участников</dt>
                  <dd>{pendingRegistration?.participantCount}</dd>
                </div>
                <div>
                  <dt>Сумма</dt>
                  <dd>{formatPrice(pendingRegistration?.amount)} ₽</dd>
                </div>
              </dl>
              {formError ? <p className="site-masterclass-form-error" role="alert">{formError}</p> : null}
              <button
                className="site-masterclass-submit"
                type="button"
                onClick={startMasterclassPayment}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Готовим оплату..."
                  : `Перейти к оплате ${formatPrice(pendingRegistration?.amount)} ₽`}
              </button>
              {pendingRegistration?.paymentId ? (
                <button
                  className="site-masterclass-payment-back"
                  type="button"
                  onClick={() => checkMasterclassPayment()}
                  disabled={isSubmitting}
                >
                  Проверить оплату
                </button>
              ) : null}
              <button className="site-masterclass-payment-back" type="button" onClick={() => setStage("form")}>
                Вернуться к форме
              </button>
            </section>
          ) : null}

          {stage === "success" ? (
            <section className="site-masterclass-success" aria-labelledby="site-masterclass-success-title">
              <span><Check size={32} /></span>
              <p className="site-eyebrow">Запись подтверждена</p>
              <h2 id="site-masterclass-success-title">Ждём вас {EVENT.shortDateLabel}</h2>
              <p>
                Оплата подтверждена. Записано {pendingRegistration?.participantCount}{" "}
                {participantWord(pendingRegistration?.participantCount)}. Счётчик уже обновлён.
              </p>
              <div>
                <CalendarDays size={20} />
                <span>{EVENT.dateLabel}, {EVENT.timeLabel}</span>
              </div>
              <div>
                <MapPin size={20} />
                <span>{EVENT.address}</span>
              </div>
              <button
                className="site-masterclass-share"
                type="button"
                onClick={() => handleShare("success")}
              >
                <Share2 size={18} />
                Позвать знакомых
              </button>
              <a className="site-masterclass-call" href={telHref(PHONE)}>
                <Phone size={18} />
                {PHONE}
              </a>
            </section>
          ) : null}
            </>
          )}
        </aside>
      </div>

      <section
        className="site-masterclass-real-gallery"
        aria-labelledby="site-masterclass-real-gallery-title"
      >
        <div className="site-masterclass-real-gallery-head">
          <p className="site-eyebrow">Так всё выглядит на самом деле</p>
          <h2 id="site-masterclass-real-gallery-title">
            Мука на столе, серьёзные лица и гордость за свою пиццу
          </h2>
          <p>
            Это кадры с одного из наших прошлых мастер-классов. Здесь настоящая кухня,
            наши колпаки и фартуки, много самостоятельности и тот самый финал:
            «Смотрите, я сам приготовил пиццу и лимонад!»
          </p>
        </div>
        <div className="site-masterclass-real-gallery-grid">
          {MASTERCLASS_REAL_PHOTOS.map((photo) => (
            <figure key={photo.src}>
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.src.endsWith("02.webp") ? "1280" : "960"}
                height={photo.src.endsWith("02.webp") ? "960" : "1280"}
                loading="lazy"
              />
            </figure>
          ))}
        </div>
        <small>
          {isCancelled
            ? `Это фотографии с других встреч. ${EVENT.shortDateLabel} мастер-класс не проводился, поэтому своих фото и видео у этой даты нет.`
            : `На встрече ${EVENT.shortDateLabel} каждый приготовит одну пиццу: ${EVENT.pizzaAccusative}, а ещё смешает освежающий лимонад.`}
        </small>
      </section>

      {!isCancelled && stage !== "success" ? (
        <div className="site-masterclass-mobile-action" aria-label="Быстрая запись на мастер-класс">
          <div aria-live="polite">
            <small>{stage === "payment" ? "К подтверждению" : `${participantCount} ${participantWord(participantCount)}`}</small>
            <strong>
              {formatPrice(stage === "payment" ? pendingRegistration?.amount : total)} ₽
            </strong>
          </div>
          {stage === "form" ? (
            <button
              type="submit"
              form="masterclass-registration-form"
              disabled={isSubmitting || participantCount < 1 || !registrationOpen}
            >
              {isSubmitting ? "Сохраняем..." : "Продолжить к оплате"}
            </button>
          ) : (
            <button type="button" onClick={startMasterclassPayment} disabled={isSubmitting}>
              {isSubmitting ? "Готовим оплату..." : "Перейти к оплате"}
            </button>
          )}
        </div>
      ) : null}

      <IndividualMasterclassPromo />

      <section className="site-masterclass-final" aria-labelledby="site-masterclass-final-title">
        <div>
          <p className="site-eyebrow">Вместе всегда вкуснее</p>
          <h2 id="site-masterclass-final-title">
            Вместе веселее готовить. И ещё вкуснее пробовать
          </h2>
          <p>
            С друзьями интереснее раскатывать тесто, сравнивать бортики и смеяться
            над тем, какими разными получились одинаковые пиццы. А потом вместе ждать,
            когда из печи появится каждая горячая красавица, и пробовать её
            с лимонадом собственного приготовления.
          </p>
        </div>
        <button type="button" onClick={() => handleShare("final")}>
          <Share2 size={19} />
          Поделиться с друзьями
        </button>
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
