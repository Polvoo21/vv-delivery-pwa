import "../../styles/site/individual-masterclass.css";
import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CakeSlice,
  ChefHat,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Pizza,
  Users
} from "lucide-react";
import {
  INDIVIDUAL_MASTERCLASS_PAGE,
  MASTERCLASSES_PATH
} from "../../../shared/masterclass-events";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import {
  PHONE,
  RESTAURANT,
  SOCIAL_LINKS,
  getSitePagePath,
  telHref
} from "./siteData";

const FORMAT_STEPS = [
  {
    icon: Phone,
    title: "Расскажите о празднике",
    text: "Позвоните администратору: назовите желаемый день, примерное время, количество гостей и возраст детей."
  },
  {
    icon: CalendarCheck,
    title: "Согласуем ваш формат",
    text: "Проверим свободное время, обсудим программу и честно рассчитаем стоимость именно для вашей компании."
  },
  {
    icon: ChefHat,
    title: "Подготовим настоящую кухню",
    text: "К встрече подготовим созревшее тесто, продукты, рабочие места, колпаки и фартуки."
  },
  {
    icon: Pizza,
    title: "Приготовим пиццу и лимонад",
    text: "Пиццайоло поможет каждому пройти путь от теста до горячей пиццы, а затем участники смешают освежающий лимонад и попробуют всё вместе."
  }
];

const FAQ_ITEMS = [
  {
    question: "Можно выбрать любой день?",
    answer:
      "Да, индивидуальный мастер-класс можно провести не только в воскресенье. Конкретную дату и время нужно заранее согласовать с администратором: он проверит кухню и команду."
  },
  {
    question: "Это только для детского дня рождения?",
    answer:
      "Нет. Формат подходит для детских и семейных праздников, встреч друзей и небольших компаний. Состав и возраст участников лучше сразу назвать администратору."
  },
  {
    question: "Что будут готовить гости?",
    answer:
      "Каждый участник приготовит собственную пиццу под присмотром пиццайоло и вместе с остальными смешает освежающий лимонад. В финале всё можно сразу попробовать."
  },
  {
    question: "Сколько стоит индивидуальный мастер-класс?",
    answer:
      "Стоимость зависит от даты, количества участников и выбранной программы. Мы не показываем придуманную цену: администратор уточнит детали и назовёт точную сумму до подтверждения."
  },
  {
    question: "Где проходит мастер-класс?",
    answer:
      "В семейной пиццерии «Вместе Вкуснее» в Чебоксарах по адресу: Пирогова, 1Т. Участники готовят пиццу и лимонад на нашей настоящей кухне вместе с пиццайоло."
  }
];

export function SiteIndividualMasterclassPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = INDIVIDUAL_MASTERCLASS_PAGE.seoTitle;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute("content") || "";
    let canonical = document.querySelector('link[rel="canonical"]');
    const shouldRemoveCanonical = !canonical;
    const previousCanonical = canonical?.getAttribute("href") || "";

    descriptionMeta?.setAttribute(
      "content",
      INDIVIDUAL_MASTERCLASS_PAGE.seoDescription
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", INDIVIDUAL_MASTERCLASS_PAGE.shareUrl);

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
    <SitePublicShell className="site-individual-masterclass-page">
      <section
        className="site-individual-masterclass-hero"
        aria-labelledby="site-individual-masterclass-title"
      >
        <div className="site-individual-masterclass-hero-copy">
          <a
            className="site-individual-masterclass-back"
            href={getSitePagePath(MASTERCLASSES_PATH)}
          >
            <ArrowLeft size={18} />
            Все мастер-классы
          </a>
          <p className="site-eyebrow">Праздник только для вашей компании</p>
          <h1 id="site-individual-masterclass-title">
            Мастер-класс по пицце на день рождения в Чебоксарах
          </h1>
          <p>
            Выберите удобный день, соберите близких и приходите готовить.
            Дети и взрослые наденут колпаки и фартуки, поработают с настоящим тестом
            и вместе с пиццайоло испекут собственные пиццы в итальянской печи.
            А ещё сами смешают освежающий лимонад.
          </p>
          <div className="site-individual-masterclass-hero-actions">
            <a className="is-primary" href={telHref(PHONE)}>
              <Phone size={19} />
              Позвонить администратору
            </a>
            <a href={getSitePagePath(MASTERCLASSES_PATH)}>
              Посмотреть воскресные встречи
              <ArrowRight size={18} />
            </a>
          </div>
          <div className="site-individual-masterclass-contact">
            <span>
              Администратор поможет подобрать дату и программу
            </span>
            <a href={telHref(PHONE)}>{PHONE}</a>
          </div>
        </div>

        <figure className="site-individual-masterclass-hero-photo">
          <img
            src="/assets/site/masterclass-real/masterclass-real-03.webp"
            alt="Дети самостоятельно готовят пиццы на одном из наших мастер-классов"
            width="960"
            height="1280"
            fetchPriority="high"
          />
          <figcaption>
            Не смотреть, как развлекают другие, а самому приготовить пиццу и лимонад
          </figcaption>
        </figure>
      </section>

      <section
        className="site-individual-masterclass-answer"
        aria-labelledby="site-individual-masterclass-answer-title"
      >
        <div>
          <p className="site-eyebrow">Можно не ждать общей даты</p>
          <h2 id="site-individual-masterclass-answer-title">
            Ваш день, ваши гости, своя пицца и лимонад
          </h2>
          <p>
            Индивидуальный формат проводим по предварительному заказу в любой удобный
            день, если свободны кухня и команда. Это может быть детский день рождения,
            семейный праздник или встреча друзей. Пиццу и лимонад гости приготовят
            сами, а пиццайоло будет рядом на каждом этапе.
          </p>
        </div>
        <dl>
          <div>
            <CalendarCheck size={23} />
            <dt>Своя дата</dt>
            <dd>подберём вместе с администратором</dd>
          </div>
          <div>
            <Users size={23} />
            <dt>Своя компания</dt>
            <dd>дети и взрослые готовят рядом</dd>
          </div>
          <div>
            <ChefHat size={23} />
            <dt>Пиццайоло рядом</dt>
            <dd>покажет, подскажет и поможет</dd>
          </div>
        </dl>
      </section>

      <section
        className="site-individual-masterclass-process"
        aria-labelledby="site-individual-masterclass-process-title"
      >
        <div className="site-individual-masterclass-section-head">
          <p className="site-eyebrow">От звонка до пиццы и свежего лимонада</p>
          <h2 id="site-individual-masterclass-process-title">
            Организуем праздник спокойно и понятно
          </h2>
          <p>
            Сначала согласуем всё важное, а в день встречи команда уже будет знать,
            кого встречает и как помочь каждому участнику.
          </p>
        </div>
        <div className="site-individual-masterclass-process-grid">
          {FORMAT_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title}>
                <div>
                  <Icon size={23} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="site-individual-masterclass-emotion"
        aria-labelledby="site-individual-masterclass-emotion-title"
      >
        <figure>
          <img
            src="/assets/site/masterclass-real/masterclass-real-04.webp"
            alt="Участницы мастер-класса показывают приготовленные своими руками пиццы"
            width="960"
            height="1280"
            loading="lazy"
          />
        </figure>
        <div>
          <p className="site-eyebrow">Вместо обычной анимации</p>
          <h2 id="site-individual-masterclass-emotion-title">
            Праздник, где каждый может сказать: «Я сделал это сам»
          </h2>
          <p>
            Здесь не нужно сидеть и ждать своей очереди на развлечение. Гости вместе
            трогают мягкое тесто, учатся формировать бортик, сравнивают свои пиццы
            и ждут, чья первой появится из печи. А ещё смешивают лимонад,
            который потом попробуют всей компанией.
          </p>
          <p>
            В финале у каждого остаётся собственная горячая пицца, приготовленный
            вместе лимонад и общее воспоминание, которое ещё долго будут обсуждать
            после праздника.
          </p>
        </div>
      </section>

      <section
        className="site-individual-masterclass-details"
        aria-labelledby="site-individual-masterclass-details-title"
      >
        <div className="site-individual-masterclass-section-head">
          <p className="site-eyebrow">Без сюрпризов в организации</p>
          <h2 id="site-individual-masterclass-details-title">
            Что уже понятно, а что согласуем лично
          </h2>
        </div>
        <div className="site-individual-masterclass-details-grid">
          <article>
            <Pizza size={26} />
            <h3>На мастер-классе</h3>
            <ul>
              <li>каждому подготовим рабочее место;</li>
              <li>выдадим колпак и фартук;</li>
              <li>пиццайоло покажет все основные движения;</li>
              <li>пиццу испечём на настоящей кухне пиццерии;</li>
              <li>лимонад участники смешают сами и попробуют вместе с пиццей.</li>
            </ul>
          </article>
          <article>
            <Clock3 size={26} />
            <h3>До подтверждения</h3>
            <ul>
              <li>проверим свободную дату и время;</li>
              <li>уточним количество и возраст участников;</li>
              <li>обсудим подходящий формат программы;</li>
              <li>назовём точную стоимость вашего праздника.</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        className="site-individual-masterclass-faq"
        aria-labelledby="site-individual-masterclass-faq-title"
      >
        <div className="site-individual-masterclass-section-head">
          <p className="site-eyebrow">Коротко о главном</p>
          <h2 id="site-individual-masterclass-faq-title">Частые вопросы</h2>
        </div>
        <div className="site-individual-masterclass-faq-list">
          {FAQ_ITEMS.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="site-individual-masterclass-final"
        aria-labelledby="site-individual-masterclass-final-title"
      >
        <div>
          <CakeSlice size={30} />
          <p className="site-eyebrow">Давайте придумаем ваш праздник</p>
          <h2 id="site-individual-masterclass-final-title">
            Расскажите администратору, кого и когда хотите собрать
          </h2>
          <p>
            Мы проверим свободную дату, обсудим участников и предложим подходящий
            формат мастер-класса с пиццей и лимонадом в пиццерии по адресу:
            {" "}{RESTAURANT.shortAddress}.
          </p>
        </div>
        <a href={telHref(PHONE)}>
          <Phone size={19} />
          Позвонить {PHONE}
        </a>
      </section>

      <aside
        className="site-individual-masterclass-sticky-contact"
        aria-label="Быстрая запись на индивидуальный мастер-класс"
      >
        <div>
          <strong>Записаться на мастер-класс</strong>
          <span>Позвоните или напишите администратору</span>
        </div>
        <a href={telHref(PHONE)}>
          <Phone size={18} />
          Позвонить
        </a>
        <a
          className="is-primary"
          href={SOCIAL_LINKS.telegram}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} />
          Написать
        </a>
      </aside>

      <SiteFooter />
    </SitePublicShell>
  );
}
