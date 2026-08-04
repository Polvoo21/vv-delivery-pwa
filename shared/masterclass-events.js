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

const augustPizzaPath =
  `${MASTERCLASSES_PATH}/pizza-vetchina-griby-9-avgusta-2026`;

export const MASTERCLASS_EVENTS = Object.freeze([
  Object.freeze({
    id: "pizza-2026-08-09",
    slug: "pizza-vetchina-griby-9-avgusta-2026",
    path: augustPizzaPath,
    legacyPaths: Object.freeze([
      "/master-klass-pizza",
      `${MASTERCLASSES_PATH}/pizza-vetchina-griby-2-avgusta-2026`
    ]),
    pageMode: "registration",
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
    status: "scheduled",
    shareUrl: `${SITE_ORIGIN}${augustPizzaPath}`,
    imagePath: "/assets/site/masterclass-og.png",
    seoTitle:
      "Мастер-класс по пицце в Чебоксарах 9 августа 2026 | Вместе Вкуснее",
    seoDescription:
      "Мастер-класс по пицце и лимонаду для детей и взрослых в Чебоксарах: тесто 48-часовой ферментации, итальянская печь Marana Forni, ветчина и грибы. 9 августа в 11:00, участие 900 ₽."
  })
]);

export const MASTERCLASS_EVENT = MASTERCLASS_EVENTS[0];

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

  return (
    MASTERCLASS_EVENTS.find(
      (event) =>
        event.path === normalizedPath ||
        event.legacyPaths.includes(normalizedPath)
    ) || null
  );
}
