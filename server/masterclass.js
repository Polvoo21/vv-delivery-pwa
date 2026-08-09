import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import {
  getMasterclassEventById,
  isMasterclassRegistrationOpen,
  MASTERCLASS_EVENT,
  MASTERCLASS_EVENTS
} from "../shared/masterclass-events.js";

export { MASTERCLASS_EVENT, MASTERCLASS_EVENTS };

const MAX_PARTICIPANTS_PER_REGISTRATION = 100;
const MASTERCLASS_CONSENT_VERSION = "2026-07-30";

function registrationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCount(value, label) {
  const count = Number(value);

  if (!Number.isInteger(count) || count < 0) {
    throw registrationError(`Укажите корректное количество: ${label}`);
  }

  return count;
}

export function normalizeMasterclassPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) {
    digits = `7${digits}`;
  } else if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length !== 11 || !digits.startsWith("7")) {
    return "";
  }

  return `+${digits}`;
}

export function normalizeMasterclassEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return "";
  return email;
}

export function validateMasterclassRegistration(body = {}, masterclassEvent = MASTERCLASS_EVENT) {
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const phone = normalizeMasterclassPhone(body.phone);
  const email = normalizeMasterclassEmail(body.email);
  const adultsCount = normalizeCount(body.adultsCount, "взрослых");
  const childrenCount = normalizeCount(body.childrenCount, "детей");
  const rawChildrenAges = Array.isArray(body.childrenAges) ? body.childrenAges : [];
  const privacyPolicyAccepted = body.privacyPolicyAccepted === true;
  const personalDataConsent = body.personalDataConsent === true;
  const marketingConsent = body.marketingConsent === true;

  if (name.length < 2 || name.length > 80) {
    throw registrationError("Укажите имя от 2 до 80 символов");
  }

  if (!phone) {
    throw registrationError("Укажите российский номер телефона");
  }

  if (!email) {
    throw registrationError("Укажите корректный email для подтверждения и электронного чека");
  }

  if (!privacyPolicyAccepted) {
    throw registrationError("Подтвердите ознакомление с Политикой обработки персональных данных");
  }

  if (!personalDataConsent) {
    throw registrationError("Дайте согласие на обработку персональных данных для записи");
  }

  if (childrenCount !== rawChildrenAges.length) {
    throw registrationError("Укажите возраст каждого ребёнка");
  }

  const childrenAges = rawChildrenAges.map((value, index) => {
    const age = Number(value);

    if (!Number.isInteger(age) || age < 0 || age > 17) {
      throw registrationError(`Укажите возраст ребёнка ${index + 1} от 0 до 17 лет`);
    }

    return age;
  });

  const participantCount = adultsCount + childrenCount;

  if (participantCount < 1) {
    throw registrationError("Добавьте хотя бы одного участника");
  }

  if (participantCount > MAX_PARTICIPANTS_PER_REGISTRATION) {
    throw registrationError("Для записи более 100 участников позвоните в пиццерию");
  }

  return {
    name,
    phone,
    email,
    adultsCount,
    childrenCount,
    childrenAges,
    participantCount,
    amount: participantCount * masterclassEvent.pricePerParticipant,
    privacyPolicyAccepted,
    personalDataConsent,
    marketingConsent
  };
}

function assertKnownEvent(eventId) {
  const masterclassEvent = getMasterclassEventById(eventId);

  if (!masterclassEvent) {
    throw registrationError("Мастер-класс не найден", 404);
  }

  return masterclassEvent;
}

export function assertMasterclassPaymentOpen(eventId, referenceDate = new Date()) {
  const masterclassEvent = assertKnownEvent(eventId);

  if (!isMasterclassRegistrationOpen(masterclassEvent, referenceDate)) {
    throw registrationError("Оплата этого мастер-класса закрыта", 409);
  }

  return masterclassEvent;
}

function publicRegistration(row) {
  return {
    id: row.public_id,
    eventId: row.event_id,
    name: row.customer_name,
    phone: row.phone,
    email: row.customer_email || "",
    adultsCount: Number(row.adults_count || 0),
    childrenCount: Array.isArray(row.children_ages) ? row.children_ages.length : 0,
    childrenAges: Array.isArray(row.children_ages) ? row.children_ages : [],
    participantCount: Number(row.participant_count || 0),
    amount: Number(row.amount || 0),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider || row.payment_mode || "",
    paymentId: row.payment_id || "",
    paymentUrl: row.payment_url || "",
    paymentAttempt: Number(row.payment_attempt || 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getMasterclassState(eventId = MASTERCLASS_EVENT.id) {
  const masterclassEvent = assertKnownEvent(eventId);

  const result = await pool.query(
    `
      select
        coalesce(sum(participant_count), 0)::int as registered_participants,
        count(*)::int as registrations
      from masterclass_registrations
      where event_id = $1
        and status = 'confirmed'
        and payment_status = 'paid'
    `,
    [eventId]
  );

  const registeredParticipants = Number(result.rows[0]?.registered_participants || 0);
  const remainingParticipants = Math.max(
    0,
    masterclassEvent.minimumParticipants - registeredParticipants
  );

  return {
    ...masterclassEvent,
    registeredParticipants,
    registrations: Number(result.rows[0]?.registrations || 0),
    remainingParticipants,
    minimumReached: remainingParticipants === 0,
    registrationOpen: isMasterclassRegistrationOpen(masterclassEvent)
  };
}

export async function createMasterclassRegistration(eventId, body = {}, requestMeta = {}) {
  const masterclassEvent = assertKnownEvent(eventId);

  if (!isMasterclassRegistrationOpen(masterclassEvent)) {
    throw registrationError("Запись на этот мастер-класс уже закрыта", 409);
  }

  const registration = validateMasterclassRegistration(body, masterclassEvent);
  const publicId = randomUUID();
  const consentIp = String(requestMeta.ip || "").slice(0, 128);
  const consentUserAgent = String(requestMeta.userAgent || "").slice(0, 512);

  try {
    const pendingResult = await pool.query(
      `
        update masterclass_registrations
        set
          customer_name = $3,
          customer_email = $4,
          adults_count = $5,
          children_ages = $6::jsonb,
          participant_count = $7,
          amount = $8,
          privacy_policy_accepted = $9,
          privacy_policy_accepted_at = now(),
          personal_data_consent = $10,
          personal_data_consent_at = now(),
          marketing_consent = $11,
          marketing_consent_at = case
            when $11 then coalesce(marketing_consent_at, now())
            else marketing_consent_at
          end,
          marketing_consent_withdrawn_at = case
            when not $11 and marketing_consent then now()
            else marketing_consent_withdrawn_at
          end,
          consent_document_version = $12,
          consent_ip = $13,
          consent_user_agent = $14,
          payment_id = case when payment_status in ('canceled', 'create_failed') then null else payment_id end,
          payment_url = case when payment_status in ('canceled', 'create_failed') then null else payment_url end,
          payment_attempt = case
            when payment_status in ('canceled', 'create_failed') then greatest(1, payment_attempt) + 1
            else payment_attempt
          end,
          payment_status = case
            when payment_status in ('canceled', 'create_failed') then 'pending'
            else payment_status
          end,
          payment_error = case when payment_status in ('canceled', 'create_failed') then null else payment_error end,
          updated_at = now()
        where event_id = $1
          and phone = $2
          and status = 'payment_pending'
          and (payment_id is null or payment_status in ('canceled', 'create_failed'))
        returning *
      `,
      [
        eventId,
        registration.phone,
        registration.name,
        registration.email,
        registration.adultsCount,
        JSON.stringify(registration.childrenAges),
        registration.participantCount,
        registration.amount,
        registration.privacyPolicyAccepted,
        registration.personalDataConsent,
        registration.marketingConsent,
        MASTERCLASS_CONSENT_VERSION,
        consentIp,
        consentUserAgent
      ]
    );

    if (pendingResult.rows[0]) {
      return publicRegistration(pendingResult.rows[0]);
    }

    const result = await pool.query(
      `
        insert into masterclass_registrations (
          public_id,
          event_id,
          customer_name,
          phone,
          customer_email,
          adults_count,
          children_ages,
          participant_count,
          amount,
          status,
          payment_mode,
          payment_status,
          privacy_policy_accepted,
          privacy_policy_accepted_at,
          personal_data_consent,
          personal_data_consent_at,
          marketing_consent,
          marketing_consent_at,
          consent_document_version,
          consent_ip,
          consent_user_agent
        )
        values (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9,
          'payment_pending', 'yookassa', 'pending',
          $10, now(), $11, now(), $12,
          case when $12 then now() else null end,
          $13, $14, $15
        )
        returning *
      `,
      [
        publicId,
        eventId,
        registration.name,
        registration.phone,
        registration.email,
        registration.adultsCount,
        JSON.stringify(registration.childrenAges),
        registration.participantCount,
        registration.amount,
        registration.privacyPolicyAccepted,
        registration.personalDataConsent,
        registration.marketingConsent,
        MASTERCLASS_CONSENT_VERSION,
        consentIp,
        consentUserAgent
      ]
    );

    return publicRegistration(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      const existingPending = await pool.query(
        `
          select *
          from masterclass_registrations
          where event_id = $1
            and phone = $2
            and status = 'payment_pending'
          limit 1
        `,
        [eventId, registration.phone]
      );

      if (existingPending.rows[0]) {
        return publicRegistration(existingPending.rows[0]);
      }

      throw registrationError(
        "На этот номер уже есть подтверждённая запись. Если нужно изменить её, позвоните нам.",
        409
      );
    }

    throw error;
  }
}

export async function getMasterclassPaymentRegistration(eventId, registrationId) {
  const masterclassEvent = assertKnownEvent(eventId);
  const result = await pool.query(
    "select * from masterclass_registrations where event_id = $1 and public_id = $2 limit 1",
    [eventId, registrationId]
  );
  if (!result.rows[0]) throw registrationError("Запись на мастер-класс не найдена", 404);

  const registration = publicRegistration(result.rows[0]);
  return {
    ...registration,
    paymentEntityType: "masterclass_registration",
    paymentReturnPath: masterclassEvent.path,
    paymentDescription: `Мастер-класс ${masterclassEvent.shortDateLabel}, ${registration.participantCount} участн.`,
    receiptDescription: `Участие в мастер-классе (${registration.participantCount} участн.)`
  };
}

export async function attachMasterclassPayment(eventId, registrationId, payment = {}) {
  const result = await pool.query(
    `
      update masterclass_registrations
      set payment_mode = 'yookassa',
          payment_provider = 'yookassa',
          payment_id = $3,
          payment_url = $4,
          payment_status = $5,
          payment_error = null,
          updated_at = now()
      where event_id = $1 and public_id = $2
      returning *
    `,
    [eventId, registrationId, payment.id || null, payment.confirmationUrl || "", payment.status || "pending"]
  );
  if (!result.rows[0]) throw registrationError("Запись на мастер-класс не найдена", 404);
  return publicRegistration(result.rows[0]);
}

export async function markMasterclassPaymentCreateFailed(eventId, registrationId, message = "") {
  await pool.query(
    `
      update masterclass_registrations
      set payment_status = 'create_failed',
          payment_error = $3,
          updated_at = now()
      where event_id = $1 and public_id = $2
    `,
    [eventId, registrationId, String(message || "").slice(0, 500)]
  );
}

export async function prepareMasterclassPaymentRetry(eventId, registrationId) {
  const result = await pool.query(
    `
      update masterclass_registrations
      set payment_id = null,
          payment_url = null,
          payment_status = 'pending',
          payment_error = null,
          payment_attempt = greatest(1, payment_attempt) + 1,
          updated_at = now()
      where event_id = $1
        and public_id = $2
        and payment_status = 'canceled'
      returning *
    `,
    [eventId, registrationId]
  );
  return result.rows[0] ? publicRegistration(result.rows[0]) : getMasterclassPaymentRegistration(eventId, registrationId);
}

export async function syncMasterclassPayment(eventId, registrationId, providerPayment) {
  const providerStatus = String(providerPayment?.status || "pending");
  const paymentStatus = providerStatus === "succeeded" ? "paid" : providerStatus;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query(
      "select * from masterclass_registrations where event_id = $1 and public_id = $2 for update",
      [eventId, registrationId]
    );
    if (!currentResult.rows[0]) throw registrationError("Запись на мастер-класс не найдена", 404);
    const current = currentResult.rows[0];
    const becamePaid = current.payment_status !== "paid" && paymentStatus === "paid";
    const nextStatus = paymentStatus === "paid" ? "confirmed" : "payment_pending";
    const result = await client.query(
      `
        update masterclass_registrations
        set status = $3,
            payment_mode = 'yookassa',
            payment_provider = 'yookassa',
            payment_id = $4,
            payment_status = $5,
            paid_at = case when $5 = 'paid' then coalesce(paid_at, now()) else paid_at end,
            updated_at = now()
        where event_id = $1 and public_id = $2
        returning *
      `,
      [eventId, registrationId, nextStatus, providerPayment.id || current.payment_id, paymentStatus]
    );
    await client.query("commit");
    return {
      registration: publicRegistration(result.rows[0]),
      becamePaid,
      event: await getMasterclassState(eventId)
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
