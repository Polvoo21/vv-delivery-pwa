import test from "node:test";
import assert from "node:assert/strict";
import {
  assertMasterclassPaymentOpen,
  normalizeMasterclassEmail,
  normalizeMasterclassPhone,
  validateMasterclassRegistration
} from "../server/masterclass.js";
import {
  getActiveMasterclassEvent,
  getMasterclassEventById,
  getMasterclassEventByPath,
  getNextMasterclassEvent,
  MASTERCLASS_EVENT
} from "../shared/masterclass-events.js";

test("normalizeMasterclassPhone accepts common Russian formats", () => {
  assert.equal(normalizeMasterclassPhone("8 (999) 123-45-67"), "+79991234567");
  assert.equal(normalizeMasterclassPhone("+7 999 123 45 67"), "+79991234567");
  assert.equal(normalizeMasterclassPhone("9991234567"), "+79991234567");
  assert.equal(normalizeMasterclassPhone("123"), "");
});

test("normalizeMasterclassEmail accepts a valid receipt email", () => {
  assert.equal(normalizeMasterclassEmail(" Guest@Example.RU "), "guest@example.ru");
  assert.equal(normalizeMasterclassEmail("not-an-email"), "");
});

test("validateMasterclassRegistration calculates participants and amount", () => {
  const registration = validateMasterclassRegistration({
    name: "  Анна   Петрова ",
    phone: "8 999 123-45-67",
    email: "anna@example.ru",
    adultsCount: 2,
    childrenCount: 2,
    childrenAges: [7, 12],
    privacyPolicyAccepted: true,
    personalDataConsent: true,
    marketingConsent: false
  });

  assert.deepEqual(registration, {
    name: "Анна Петрова",
    phone: "+79991234567",
    email: "anna@example.ru",
    adultsCount: 2,
    childrenCount: 2,
    childrenAges: [7, 12],
    participantCount: 4,
    amount: 3600,
    privacyPolicyAccepted: true,
    personalDataConsent: true,
    marketingConsent: false
  });
});

test("validateMasterclassRegistration requires every child age", () => {
  assert.throws(
    () =>
      validateMasterclassRegistration({
        name: "Анна",
        phone: "+79991234567",
        email: "anna@example.ru",
        adultsCount: 1,
        childrenCount: 2,
        childrenAges: [7],
        privacyPolicyAccepted: true,
        personalDataConsent: true
      }),
    /возраст каждого ребёнка/
  );
});

test("validateMasterclassRegistration rejects ages over 17", () => {
  assert.throws(
    () =>
      validateMasterclassRegistration({
        name: "Анна",
        phone: "+79991234567",
        email: "anna@example.ru",
        adultsCount: 0,
        childrenCount: 1,
        childrenAges: [18],
        privacyPolicyAccepted: true,
        personalDataConsent: true
      }),
    /от 0 до 17 лет/
  );
});

test("validateMasterclassRegistration requires separate mandatory consents", () => {
  assert.throws(
    () =>
      validateMasterclassRegistration({
        name: "Анна",
        phone: "+79991234567",
        email: "anna@example.ru",
        adultsCount: 1,
        childrenCount: 0,
        childrenAges: [],
        privacyPolicyAccepted: true,
        personalDataConsent: false
      }),
    /Дайте согласие на обработку/
  );
});

test("masterclass events keep the archived page and select the next open date", () => {
  const archivedEvent = getMasterclassEventById("pizza-2026-08-09");

  assert.equal(
    archivedEvent.path,
    "/master-klassy/pizza-vetchina-griby-9-avgusta-2026"
  );
  assert.equal(archivedEvent.status, "cancelled");
  assert.equal(archivedEvent.pageMode, "archive");
  assert.equal(MASTERCLASS_EVENT.path, "/master-klassy/pizza-vetchina-griby-16-avgusta-2026");
  assert.equal(MASTERCLASS_EVENT.startsAt, "2026-08-16T11:00:00+03:00");
  assert.equal(
    getNextMasterclassEvent(archivedEvent)?.id,
    MASTERCLASS_EVENT.id
  );
  assert.equal(
    getMasterclassEventByPath("/master-klass-pizza")?.id,
    MASTERCLASS_EVENT.id
  );
  assert.equal(
    getMasterclassEventByPath(
      "/master-klassy/pizza-vetchina-griby-2-avgusta-2026"
    )?.id,
    archivedEvent.id
  );
  assert.equal(
    getMasterclassEventByPath(`/dev${MASTERCLASS_EVENT.path}`)?.id,
    MASTERCLASS_EVENT.id
  );
  assert.equal(
    getActiveMasterclassEvent("2026-08-09T12:00:00+03:00")?.id,
    MASTERCLASS_EVENT.id
  );
});

test("archived masterclass rejects new payments while the next event accepts them", () => {
  assert.throws(
    () => assertMasterclassPaymentOpen("pizza-2026-08-09", "2026-08-09T09:00:00+03:00"),
    /Оплата этого мастер-класса закрыта/
  );
  assert.equal(
    assertMasterclassPaymentOpen("pizza-2026-08-16", "2026-08-09T12:00:00+03:00").id,
    "pizza-2026-08-16"
  );
});
