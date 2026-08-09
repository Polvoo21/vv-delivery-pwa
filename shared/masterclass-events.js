export const SITE_ORIGIN = "https://vmestevkusnee.ru";
export const MASTERCLASSES_PATH = "/master-klassy";
export const INDIVIDUAL_MASTERCLASS_PATH =
  `${MASTERCLASSES_PATH}/individualnyy-master-klass`;

export const INDIVIDUAL_MASTERCLASS_PAGE = Object.freeze({
  path: INDIVIDUAL_MASTERCLASS_PATH,
  shareUrl: `${SITE_ORIGIN}${INDIVIDUAL_MASTERCLASS_PATH}`,
  imagePath: "/assets/site/masterclass-og.png",
  seoTitle:
    "Мастер-класс по пицце на день рождения в Чебоксарах | Вместе Вкуснее",
  seoDescription:
    "Индивидуальный мастер-класс по пицце и лимонаду на детский день рождения или семейный праздник в Чебоксарах. Своя компания, удобный день, помощь пиццайоло и настоящая итальянская печь."
});

export const LATEST_MASTERCLASS_PATH = "/master-klass-pizza";

const augustNinthPizzaPath =
  `${MASTERCLASSES_PATH}/pizza-vetchina-griby-9-avgusta-2026`;
const augustSixteenthPizzaPath =
  `${MASTERCLASSES_PATH}/pizza-vetchina-griby-16-avgusta-2026`;

export const MASTERCLASS_EVENTS = Object.freeze([
  Object.freeze({
    id: "pizza-2026-08-09",
    slug: "pizza-vetchina-griby-9-avgusta-2026",
    path: augustNinthPizzaPath,
    legacyPaths: Object.freeze([
      `${MASTERCLASSES_PATH}/pizza-vetchina-griby-2-avgusta-2026`
    ]),
    pageMode: "archive",
    title: "Мастер-класс по приготовлению пиццы",
    cardTitle: "Пицца с ветчиной и грибами",
    pizza: "Ветчина и грибы",
    pizzaAccusative: "пиццу с ветчиной и грибами",
    pizzaInstrumental: "с ветчиной и грибами",
    toppingsAccusative: "ветчину и грибы",
    finishedPizzaLabel: "готовая пицца с ветчиной и грибами",
    startsAt: "2026-08-09T11:00:00+03:00",
    dateLabel: "Воскресенье, 9 августа 2026",
    shortDateLabel: "9 августа",
    timeLabel: "11:00",
    minimumParticipants: 8,
    pricePerParticipant: 900,
    address: "Чебоксары, улица Пирогова, 1Т",
    shortAddress: "Пирогова, 1Т",
    mapsUrl:
      "https://yandex.ru/maps/?text=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9F%D0%B8%D1%80%D0%BE%D0%B3%D0%BE%D0%B2%D0%B0%2C%201%D0%A2",
    status: "cancelled",
    shareUrl: `${SITE_ORIGIN}${augustNinthPizzaPath}`,
    imagePath: "/assets/site/masterclass-og.png",
    seoTitle:
      "Мастер-класс по пицце 9 августа не состоялся | Вместе Вкуснее",
    seoDescription:
      "Мастер-класс по пицце 9 августа 2026 года не состоялся: группа не набралась. На странице есть ссылка на ближайший мастер-класс с открытой записью."
  }),
  Object.freeze({
    id: "pizza-2026-08-16",
    slug: "pizza-vetchina-griby-16-avgusta-2026",
    path: augustSixteenthPizzaPath,
    legacyPaths: Object.freeze([]),
    pageMode: "registration",
    title: "Мастер-класс по приготовлению пиццы",
    cardTitle: "Пицца с ветчиной и грибами",
    pizza: "Ветчина и грибы",
    pizzaAccusative: "пиццу с ветчиной и грибами",
    pizzaInstrumental: "с ветчиной и грибами",
    toppingsAccusative: "ветчину и грибы",
    finishedPizzaLabel: "готовая пицца с ветчиной и грибами",
    startsAt: "2026-08-16T11:00:00+03:00",
    dateLabel: "Воскресенье, 16 августа 2026",
    shortDateLabel: "16 августа",
    timeLabel: "11:00",
    minimumParticipants: 8,
    pricePerParticipant: 900,
    address: "Чебоксары, улица Пирогова, 1Т",
    shortAddress: "Пирогова, 1Т",
    mapsUrl:
      "https://yandex.ru/maps/?text=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9F%D0%B8%D1%80%D0%BE%D0%B3%D0%BE%D0%B2%D0%B0%2C%201%D0%A2",
    status: "scheduled",
    shareUrl: `${SITE_ORIGIN}${augustSixteenthPizzaPath}`,
    imagePath: "/assets/site/masterclass-og.png",
    seoTitle:
      "Мастер-класс по пицце в Чебоксарах 16 августа 2026 | Вместе Вкуснее",
    seoDescription:
      "Мастер-класс по пицце и лимонаду для детей и взрослых в Чебоксарах. 16 августа в 11:00, участие 900 ₽: готовим вместе с пиццайоло в итальянской печи."
  })
]);

export function isMasterclassRegistrationOpen(event, referenceDate = new Date()) {
  const referenceTime = new Date(referenceDate).getTime();

  return Boolean(
    event?.pageMode === "registration" &&
    new Date(event.startsAt).getTime() > referenceTime
  );
}

export function getActiveMasterclassEvent(referenceDate = new Date()) {

  return MASTERCLASS_EVENTS
    .filter((event) => isMasterclassRegistrationOpen(event, referenceDate))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
}

export function getNextMasterclassEvent(event) {
  const eventTime = new Date(event?.startsAt || 0).getTime();

  return MASTERCLASS_EVENTS
    .filter(
      (candidate) =>
        candidate.pageMode === "registration" &&
        new Date(candidate.startsAt).getTime() > eventTime
    )
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
}

export const MASTERCLASS_EVENT =
  MASTERCLASS_EVENTS.find((event) => event.pageMode === "registration") ||
  MASTERCLASS_EVENTS[MASTERCLASS_EVENTS.length - 1];

export function normalizeMasterclassPath(pathname = "/") {
  const withoutDevPrefix = String(pathname || "/").replace(/^\/dev(?=\/|$)/, "");
  const normalized = withoutDevPrefix || "/";
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

export function getMasterclassEventById(eventId) {
  return MASTERCLASS_EVENTS.find((event) => event.id === eventId) || null;
}

export function getMasterclassEventByPath(pathname) {
  const normalizedPath = normalizeMasterclassPath(pathname);

  if (normalizedPath === LATEST_MASTERCLASS_PATH) {
    return getActiveMasterclassEvent() || MASTERCLASS_EVENT;
  }

  return (
    MASTERCLASS_EVENTS.find(
      (event) =>
        event.path === normalizedPath ||
        event.legacyPaths.includes(normalizedPath)
    ) || null
  );
}
