import { ArrowRight, CalendarCheck, Phone } from "lucide-react";
import { INDIVIDUAL_MASTERCLASS_PATH } from "../../../shared/masterclass-events";
import { PHONE, getSitePagePath, telHref } from "./siteData";

export function IndividualMasterclassPromo() {
  return (
    <section
      className="site-individual-masterclass-promo"
      aria-labelledby="site-individual-masterclass-promo-title"
    >
      <div className="site-individual-masterclass-promo-icon" aria-hidden="true">
        <CalendarCheck size={28} />
      </div>
      <div className="site-individual-masterclass-promo-copy">
        <p className="site-eyebrow">Своя дата и только ваша компания</p>
        <h2 id="site-individual-masterclass-promo-title">
          Хотите такой мастер-класс на день рождения?
        </h2>
        <p>
          Проведём отдельный мастер-класс для вашего ребёнка, семьи или компании
          в удобный день по предварительному согласованию. Пиццайоло будет рядом,
          а каждый гость приготовит собственную пиццу на настоящей кухне.
        </p>
        <small>
          Дату, время, количество участников, программу и стоимость согласует администратор.
        </small>
      </div>
      <div className="site-individual-masterclass-promo-actions">
        <a className="is-primary" href={telHref(PHONE)}>
          <Phone size={18} />
          Позвонить администратору
          <span>{PHONE}</span>
        </a>
        <a href={getSitePagePath(INDIVIDUAL_MASTERCLASS_PATH)}>
          Подробнее об индивидуальном формате
          <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
