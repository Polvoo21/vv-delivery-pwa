import { useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  ExternalLink,
  Flame,
  Hand,
  ShieldCheck,
  Sparkles,
  Utensils
} from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";
import { ASSET, getSiteHomePath, getSiteOrderPath } from "./siteData";

const introNotes = [
  {
    title: "Перчатки не заменяют чистые руки",
    text:
      "Сами по себе перчатки не борются с грязью. Они тоже пачкаются, если трогать телефон, упаковку, ручку двери или рабочую поверхность."
  },
  {
    title: "Мы за гигиену, а не за красивую картинку",
    text:
      "На кухне важны мытье рук, дезинфекция, чистый инвентарь, медкнижки, порядок на столах и понятные правила для каждой операции."
  }
];

const myths = [
  {
    myth: "Готовить без перчаток запрещено",
    reality:
      "Для пиццы, которая проходит горячую печь, постоянные перчатки не являются главным условием безопасности. Перчатки нужны там, где блюдо уже не будет нагреваться: при порционировании, холодных блюдах, салатах и сервировке."
  },
  {
    myth: "Перчатки всегда чище рук",
    reality:
      "Чистые руки можно помыть и обработать сразу. Перчатка выглядит стерильно, но после касания постороннего предмета она загрязняется так же, как рука."
  },
  {
    myth: "Если повар в перчатках, значит все под контролем",
    reality:
      "Контролировать нужно не внешний вид, а процесс: когда сотрудник моет руки, чем обработана поверхность, где лежат ингредиенты и как часто меняется инвентарь."
  },
  {
    myth: "Для теста нет разницы",
    reality:
      "Для пиццамейкера разница есть. Тесто нужно чувствовать: влажность, натяжение, толщину и край. В перчатках тесто липнет сильнее, а движения становятся менее точными."
  },
  {
    myth: "Еду руками готовить неприятно",
    reality:
      "Неприятно, когда на кухне нет порядка. Если руки вымыты, рабочее место чистое, продукты хранятся правильно, а пицца проходит печь, отсутствие перчаток не делает блюдо менее безопасным."
  }
];

const standards = [
  "Перед работой с тестом и ингредиентами сотрудник моет руки с мылом и обрабатывает их антисептиком.",
  "После касания телефона, лица, волос, очков, дверных ручек, мусора или личных вещей руки моются заново.",
  "Перед сменой администратор проверяет, нет ли на руках порезов или повреждений. Если они есть, сотрудник работает в защите или переводится на другую задачу.",
  "У сотрудников, работающих с продуктами, есть личные медицинские книжки и допуск к работе.",
  "Столы, формы, ножи, доски и другой инвентарь очищаются по графику и используются по назначению.",
  "Перчатки применяются для готовых блюд без последующей термообработки, сервировки, уборки и работы с химией."
];

const gloveCases = [
  "холодные блюда, салаты, десерты и позиции, которые уже не отправляются в печь",
  "порционирование и украшение готовых блюд перед выдачей гостю",
  "повреждение кожи, закрытое пластырем или повязкой",
  "уборка, работа с отходами, химией и задачами вне приготовления еды",
  "отдельные требования санитарных правил или проверяющего органа для конкретного процесса"
];

const practiceNotes = [
  {
    title: "В мире уже спорили про обязательные перчатки",
    text:
      "В Калифорнии вводили жесткое правило для поваров и барменов, но затем его отменили: оно замедляло работу и создавало ложное ощущение чистоты."
  },
  {
    title: "Высокая кухня тоже работает руками",
    text:
      "Известные шефы часто работают без перчаток, потому что точная ручная работа с тестом, соусом, пастой и мясом требует чувствительности и контроля."
  }
];

const sourceLinks = [
  {
    label: "Санитарные правила для общепита",
    href: "https://docs.cntd.ru/document/566276706/titles/7DM0KA"
  },
  {
    label: "Разъяснение Роспотребнадзора",
    href: "https://cgon.rospotrebnadzor.ru/biznesu/articles/salat-i-ruki-povara/"
  }
];

export function SiteNoGlovesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const returnToSite = (event) => {
    if (window.history.length <= 1) {
      return;
    }

    event.preventDefault();
    window.history.back();
  };

  return (
    <SitePublicShell className="site-no-gloves-page">
      <section className="site-no-gloves-hero" aria-labelledby="site-no-gloves-title">
        <img src={`${ASSET}concept-pizza-oven.jpg`} alt="" aria-hidden="true" />
        <div className="site-no-gloves-hero-inner">
          <a className="site-no-gloves-back" href={getSiteHomePath()} onClick={returnToSite}>
            <ArrowLeft size={18} />
            Вернуться назад
          </a>
          <div className="site-no-gloves-hero-copy">
            <span className="site-eyebrow">Открыто о кухне</span>
            <h1 id="site-no-gloves-title">Почему мы готовим пиццу без перчаток?</h1>
            <p>
              Коротко: потому что для пиццы важнее чистые руки, дисциплина кухни и горячая печь.
              Перчатки используем там, где они действительно нужны.
            </p>
          </div>
        </div>
      </section>

      <section className="site-no-gloves-lead" aria-label="Короткий ответ">
        {introNotes.map((item) => (
          <article key={item.title}>
            <Hand size={22} />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="site-no-gloves-myths" aria-labelledby="site-no-gloves-myths-title">
        <div className="site-no-gloves-section-head">
          <span className="site-eyebrow">Миф и реальность</span>
          <h2 id="site-no-gloves-myths-title">Перчатки создают ощущение чистоты, но не гарантируют ее</h2>
          <p>
            Мы не спорим с санитарными правилами. Наоборот, делаем акцент на тех правилах,
            которые реально снижают риск: мытье рук, обработка поверхностей и правильная термообработка.
          </p>
        </div>

        <div className="site-no-gloves-myth-list">
          {myths.map((item, index) => (
            <article key={item.myth}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.myth}</h3>
              <p>{item.reality}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-no-gloves-heat" aria-labelledby="site-no-gloves-heat-title">
        <img src={`${ASSET}concept-oven.webp`} alt="" aria-hidden="true" loading="lazy" />
        <div>
          <Flame size={28} />
          <h2 id="site-no-gloves-heat-title">Пицца проходит печь примерно при 265 °C</h2>
          <p>
            Мы работаем с тестом и начинкой до выпекания, а затем пицца отправляется в горячую печь.
            Поэтому для пиццы главный стандарт - не “перчатки всегда”, а чистые руки, чистый инвентарь
            и высокая температура приготовления.
          </p>
        </div>
      </section>

      <section className="site-no-gloves-standards" aria-labelledby="site-no-gloves-standards-title">
        <div className="site-no-gloves-section-head">
          <span className="site-eyebrow">Стандарты безопасности</span>
          <h2 id="site-no-gloves-standards-title">Что мы делаем на смене</h2>
          <p>
            В “Вместе Вкуснее” нет онлайн-камеры на кухню, поэтому объясняем правила прямо.
            Их можно уточнить у администратора в зале на Пирогова, 1Т.
          </p>
        </div>

        <div className="site-no-gloves-standards-grid">
          {standards.map((standard) => (
            <article key={standard}>
              <CheckCircle2 size={20} />
              <p>{standard}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-no-gloves-when" aria-labelledby="site-no-gloves-when-title">
        <div>
          <ShieldCheck size={28} />
          <h2 id="site-no-gloves-when-title">Когда перчатки нужны</h2>
          <p>
            Мы не отказываемся от перчаток. Мы используем их как инструмент, а не как декорацию
            для ощущения стерильности.
          </p>
        </div>
        <ul>
          {gloveCases.map((item) => (
            <li key={item}>
              <span />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="site-no-gloves-practice" aria-labelledby="site-no-gloves-practice-title">
        <div className="site-no-gloves-section-head">
          <span className="site-eyebrow">Практика кухни</span>
          <h2 id="site-no-gloves-practice-title">Без перчаток готовят не только у нас</h2>
          <p>
            Важно смотреть не на один внешний признак, а на культуру кухни целиком:
            чистоту, обучение, контроль и технологию приготовления.
          </p>
        </div>

        <div className="site-no-gloves-practice-grid">
          {practiceNotes.map((item) => (
            <article key={item.title}>
              <ChefHat size={22} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-no-gloves-sources" aria-labelledby="site-no-gloves-sources-title">
        <div>
          <Sparkles size={24} />
          <h2 id="site-no-gloves-sources-title">На что можно посмотреть самому</h2>
          <p>
            Мы опираемся на санитарные требования к общепиту и здравый смысл кухни:
            горячее блюдо проходит термообработку, а готовые холодные позиции требуют отдельного подхода.
          </p>
        </div>
        <div className="site-no-gloves-source-links">
          {sourceLinks.map((link) => (
            <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
              {link.label}
              <ExternalLink size={16} />
            </a>
          ))}
        </div>
      </section>

      <section className="site-no-gloves-final">
        <div>
          <Utensils size={28} />
          <h2>Главное - честная кухня, а не иллюзия</h2>
          <p>
            Если у вас есть вопрос про тесто, печь, продукты или гигиену, спросите администратора.
            Мы спокойно объясним, где работаем руками, где надеваем перчатки и почему так безопаснее для нашей пиццы.
          </p>
        </div>
        <div className="site-no-gloves-actions">
          <a className="site-primary-btn" href={getSiteOrderPath()}>
            Заказать пиццу
          </a>
          <a className="site-dark-btn" href={`${getSiteHomePath()}#contacts`}>
            Задать вопрос
          </a>
        </div>
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
