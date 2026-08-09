import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { RESTAURANT } from "./siteCoreData";

const faqItems = [
  {
    question: "Где находится пиццерия?",
    answer:
      "Мы на Пирогова, 1Т в Чебоксарах. Можно поесть в зале, забрать заказ самовывозом или оформить доставку."
  },
  {
    question: "Как работает доставка?",
    answer:
      "Доставка доступна по Чебоксарам в пределах зоны. Перед оформлением заказа попросим указать адрес, чтобы проверить возможность доставки."
  },
  {
    question: "Можно забрать заказ самовывозом?",
    answer:
      "Да, самовывоз из пиццерии на Пирогова, 1Т. После оформления заказа подготовим блюда ко времени готовности."
  },
  {
    question: "Можно забронировать стол?",
    answer:
      "Да. Позвоните нам или оставьте заявку через сайт, мы уточним время, количество гостей и формат посадки."
  },
  {
    question: "Есть ли детская зона?",
    answer:
      "Да, у нас большая детская зона за стеклом. Родители сидят в зале и видят ребенка рядом."
  },
  {
    question: "Можно провести день рождения?",
    answer:
      "Да, помогаем с детскими днями рождения, семейными встречами и небольшими банкетами. Меню и формат обсуждаем заранее."
  },
  {
    question: "Во сколько вы работаете?",
    answer: `Работаем ежедневно ${RESTAURANT.workHours}. Если планируете праздник или большую компанию, лучше предупредить заранее.`
  },
  {
    question: "Какая у вас пицца?",
    answer:
      "Готовим итальянскую пиццу на тесте с долгой ферментацией, с румяным бортом и понятными начинками."
  },
  {
    question: "Есть завтраки и бизнес-ланчи?",
    answer:
      "Да, каждый день есть завтраки, обеды и ланчи. Актуальные позиции смотрите в меню."
  },
  {
    question: "Можно убрать ингредиент из блюда?",
    answer:
      "В карточке блюда можно отметить ингредиенты, которые нужно убрать, и выбрать доступные добавки."
  },
  {
    question: "Как оплатить заказ?",
    answer:
      "Заказ оплачивается онлайн на защищённой странице ЮKassa. Доступные способы оплаты будут показаны при переходе к оплате."
  },
  {
    question: "Как узнать про акции?",
    answer:
      "Акции и сезонные предложения появляются в верхнем блоке сайта и в разделе меню."
  }
];

export function SiteFaqSection() {
  const [openItems, setOpenItems] = useState(() => new Set());

  const toggleItem = (index) => {
    setOpenItems((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  return (
    <section className="site-section-v2 site-faq-section" id="faq" aria-labelledby="site-faq-title">
      <div className="site-faq-head">
        <div>
          <p className="site-eyebrow">Частые вопросы</p>
          <h2 id="site-faq-title">Ответы перед заказом и визитом</h2>
          <p>
            Собрали короткие ответы про доставку, самовывоз, бронь столов,
            детскую зону и семейные праздники.
          </p>
        </div>
        <span>
          <HelpCircle size={17} />
          {faqItems.length} вопросов
        </span>
      </div>

      <div className="site-faq-list">
        {faqItems.map((item, index) => {
          const isOpen = openItems.has(index);
          const panelId = `site-faq-answer-${index}`;

          return (
            <article className={`site-faq-item ${isOpen ? "is-open" : ""}`} key={item.question}>
              <button
                className="site-faq-trigger"
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(index)}
              >
              <span>{item.question}</span>
              <ChevronDown size={18} aria-hidden="true" />
              </button>
              <div className="site-faq-panel" id={panelId}>
                <div>
                  <p>{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
