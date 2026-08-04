import { randomBytes } from "node:crypto";
import { pool } from "./db.js";
import { normalizePromoCode } from "./partners.js";
import { evaluatePromoCart } from "../shared/promo-rules.js";

const PROMO_TIME_ZONE = "Europe/Moscow";
const RESERVED_PROMO_CODES = new Set(["VV25"]);
const PROMO_RESERVATION_MINUTES = 45;

const PROMO_SELECT = `
  select
    p.*,
    count(r.id) filter (where r.status = 'used')::int as usage_count,
    count(r.id) filter (
      where r.status = 'reserved' and r.expires_at > now()
    )::int as reserved_count
  from promo_codes p
  left join promo_redemptions r on r.promo_code_id = p.id
`;

function makeId() {
  return `promo_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

function makeRedemptionId() {
  return `promo_use_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

function promoError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeIdList(value, maxItems = 500) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => String(item || "").trim().slice(0, 120))
        .filter(Boolean)
    )
  ].slice(0, maxItems);
}

function normalizeWeekdays(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))]
    .sort((first, second) => first - second);
}

function normalizeOptionalNumber(value, label, { integer = false, max = 1_000_000 } = {}) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > max) {
    throw promoError(`${label} должно быть положительным числом`);
  }
  return integer ? Math.floor(number) : Math.round(number * 100) / 100;
}

function normalizeDate(value) {
  const clean = String(value || "").trim().slice(0, 10);
  if (!clean) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    throw promoError("Дата должна быть в формате ГГГГ-ММ-ДД");
  }

  const [year, month, day] = clean.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw promoError("Укажите существующую дату");
  }

  return clean;
}

function normalizeTime(value) {
  const clean = String(value || "").trim().slice(0, 5);
  if (!clean) return "";
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clean)) {
    throw promoError("Время должно быть в формате ЧЧ:ММ");
  }
  return clean;
}

function dateFromRow(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function timeFromRow(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function getMoscowClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROMO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  })
    .formatToParts(now)
    .reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value;
      return result;
    }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    weekday: (() => {
      const day = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00.000Z`).getUTCDay();
      return day === 0 ? 7 : day;
    })()
  };
}

export function getManagedPromoAvailability(promo, now = new Date()) {
  const clock = getMoscowClock(now);

  if (promo.status !== "active") {
    return {
      active: false,
      state: "disabled",
      label: "Отключён",
      message: "Промокод отключён руководителем."
    };
  }

  if (promo.validFrom && clock.date < promo.validFrom) {
    return {
      active: false,
      state: "scheduled",
      label: "Запланирован",
      message: `Промокод начнёт действовать ${promo.validFrom}.`
    };
  }

  if (promo.validUntil && clock.date > promo.validUntil) {
    return {
      active: false,
      state: "expired",
      label: "Срок истёк",
      message: `Промокод действовал до ${promo.validUntil}.`
    };
  }

  if (Array.isArray(promo.weekdays) && promo.weekdays.length && !promo.weekdays.includes(clock.weekday)) {
    return {
      active: false,
      state: "outside-weekdays",
      label: "По дням",
      message: "Сегодня этот промокод не действует."
    };
  }

  if (promo.dailyStart && promo.dailyEnd) {
    if (clock.time < promo.dailyStart || clock.time >= promo.dailyEnd) {
      return {
        active: false,
        state: "outside-hours",
        label: "По времени",
        message: `Промокод действует ежедневно с ${promo.dailyStart} до ${promo.dailyEnd}.`
      };
    }
  }

  const usageLimit = Number(promo.usageLimit || 0);
  const countedUses = Number(
    promo.countedUses ?? Number(promo.usageCount || 0) + Number(promo.reservedCount || 0)
  );
  if (usageLimit > 0 && countedUses >= usageLimit) {
    return {
      active: false,
      state: "exhausted",
      label: "Лимит исчерпан",
      message: "Лимит использований этого промокода закончился."
    };
  }

  return {
    active: true,
    state: "active",
    label: "Действует",
    message: "Промокод доступен гостям."
  };
}

function publicManagedPromo(row, now = new Date()) {
  if (!row) return null;
  const usageCount = Number(row.usage_count || 0);
  const reservedCount = Number(row.reserved_count || 0);
  const promo = {
    id: row.id,
    code: row.code,
    percent: Number(row.discount_percent || 0),
    label: `-${Number(row.discount_percent || 0)}% по промокоду ${row.code}`,
    type: "managed",
    internalComment: row.internal_comment || "",
    validFrom: dateFromRow(row.valid_from),
    validUntil: dateFromRow(row.valid_until),
    dailyStart: timeFromRow(row.daily_start),
    dailyEnd: timeFromRow(row.daily_end),
    weekdays: normalizeWeekdays(row.weekdays),
    scopeType: ["categories", "products"].includes(row.scope_type) ? row.scope_type : "all",
    categoryIds: normalizeIdList(row.category_ids, 100),
    productIds: normalizeIdList(row.product_ids, 500),
    usageLimit: row.usage_limit === null ? null : Number(row.usage_limit || 0),
    perCustomerLimit: row.per_customer_limit === null ? null : Number(row.per_customer_limit || 0),
    minimumOrderAmount:
      row.minimum_order_amount === null ? null : Number(row.minimum_order_amount || 0),
    maximumDiscountAmount:
      row.maximum_discount_amount === null ? null : Number(row.maximum_discount_amount || 0),
    usageCount,
    reservedCount,
    countedUses: usageCount + reservedCount,
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  return {
    ...promo,
    availability: getManagedPromoAvailability(promo, now)
  };
}

function normalizePromoInput(input, fallback = {}) {
  const code = normalizePromoCode(input.code ?? fallback.code);
  const rawPercent = Number(input.percent ?? fallback.percent ?? 10);
  if (!Number.isFinite(rawPercent) || rawPercent < 1 || rawPercent > 90) {
    throw promoError("Скидка должна быть от 1 до 90%");
  }
  const percent = Math.round(rawPercent * 100) / 100;
  const internalComment = String(input.internalComment ?? fallback.internalComment ?? "").trim().slice(0, 500);
  const validFrom = normalizeDate(input.validFrom ?? fallback.validFrom);
  const validUntil = normalizeDate(input.validUntil ?? fallback.validUntil);
  const dailyStart = normalizeTime(input.dailyStart ?? fallback.dailyStart);
  const dailyEnd = normalizeTime(input.dailyEnd ?? fallback.dailyEnd);
  const weekdays = normalizeWeekdays(input.weekdays ?? fallback.weekdays);
  const requestedScopeType = String(input.scopeType ?? fallback.scopeType ?? "all");
  const scopeType = ["categories", "products"].includes(requestedScopeType)
    ? requestedScopeType
    : "all";
  const categoryIds = normalizeIdList(input.categoryIds ?? fallback.categoryIds, 100);
  const productIds = normalizeIdList(input.productIds ?? fallback.productIds, 500);
  const usageLimit = normalizeOptionalNumber(
    input.usageLimit ?? fallback.usageLimit,
    "Общий лимит использований",
    { integer: true, max: 1_000_000 }
  );
  const perCustomerLimit = normalizeOptionalNumber(
    input.perCustomerLimit ?? fallback.perCustomerLimit,
    "Лимит на гостя",
    { integer: true, max: 10_000 }
  );
  const minimumOrderAmount = normalizeOptionalNumber(
    input.minimumOrderAmount ?? fallback.minimumOrderAmount,
    "Минимальная сумма заказа"
  );
  const maximumDiscountAmount = normalizeOptionalNumber(
    input.maximumDiscountAmount ?? fallback.maximumDiscountAmount,
    "Максимальная скидка"
  );
  const status = String(input.status ?? fallback.status ?? "active") === "inactive" ? "inactive" : "active";

  if (!code || code.length < 3) {
    throw promoError("Промокод должен быть не короче 3 символов");
  }

  if (validFrom && validUntil && validFrom > validUntil) {
    throw promoError("Дата окончания должна быть не раньше даты начала");
  }

  if (Boolean(dailyStart) !== Boolean(dailyEnd)) {
    throw promoError("Укажите и начало, и окончание ежедневного интервала");
  }

  if (dailyStart && dailyEnd && dailyStart >= dailyEnd) {
    throw promoError("Окончание интервала должно быть позже начала");
  }

  if (scopeType === "categories" && !categoryIds.length) {
    throw promoError("Выберите хотя бы одну категорию или укажите действие на всё меню");
  }

  if (scopeType === "products" && !productIds.length) {
    throw promoError("Выберите хотя бы одно блюдо или укажите действие на всё меню");
  }

  return {
    code,
    percent,
    internalComment,
    validFrom,
    validUntil,
    dailyStart,
    dailyEnd,
    weekdays,
    scopeType,
    categoryIds: scopeType === "categories" ? categoryIds : [],
    productIds: scopeType === "products" ? productIds : [],
    usageLimit,
    perCustomerLimit,
    minimumOrderAmount,
    maximumDiscountAmount,
    status
  };
}

async function ensurePromoCodeIsFree(code, excludeId = "") {
  if (RESERVED_PROMO_CODES.has(code)) {
    throw promoError("Этот промокод уже используется системной акцией", 409);
  }

  const result = await pool.query(
    `
      select code
      from promo_codes
      where upper(code) = $1 and id <> $2
      union all
      select promo_code as code
      from partners
      where upper(promo_code) = $1
      limit 1
    `,
    [code, excludeId]
  );

  if (result.rowCount) {
    throw promoError("Такой промокод уже используется", 409);
  }
}

export async function listManagedPromoCodes(now = new Date()) {
  const result = await pool.query(
    `${PROMO_SELECT}
     group by p.id
     order by p.status asc, p.updated_at desc, p.created_at desc`
  );
  return result.rows.map((row) => publicManagedPromo(row, now));
}

export async function getManagedPromoCodeByCode(code, now = new Date()) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  const result = await pool.query(
    `${PROMO_SELECT}
     where upper(p.code) = $1
     group by p.id
     limit 1`,
    [normalized]
  );
  return publicManagedPromo(result.rows[0], now);
}

export async function createManagedPromoCode(input, now = new Date()) {
  const promo = normalizePromoInput(input);
  await ensurePromoCodeIsFree(promo.code);

  const result = await pool.query(
    `
      insert into promo_codes (
        id, code, discount_percent, internal_comment,
        valid_from, valid_until, daily_start, daily_end, weekdays,
        scope_type, category_ids, product_ids, usage_limit, per_customer_limit,
        minimum_order_amount, maximum_discount_amount, status
      )
      values (
        $1, $2, $3, $4, $5::date, $6::date, $7::time, $8::time, $9::jsonb,
        $10, $11::jsonb, $12::jsonb, $13, $14, $15, $16, $17
      )
      returning *
    `,
    [
      makeId(),
      promo.code,
      promo.percent,
      promo.internalComment || null,
      promo.validFrom || null,
      promo.validUntil || null,
      promo.dailyStart || null,
      promo.dailyEnd || null,
      JSON.stringify(promo.weekdays),
      promo.scopeType,
      JSON.stringify(promo.categoryIds),
      JSON.stringify(promo.productIds),
      promo.usageLimit,
      promo.perCustomerLimit,
      promo.minimumOrderAmount,
      promo.maximumDiscountAmount,
      promo.status
    ]
  );
  return publicManagedPromo(result.rows[0], now);
}

export async function updateManagedPromoCode(id, input, now = new Date()) {
  const currentResult = await pool.query(
    `${PROMO_SELECT}
     where p.id = $1
     group by p.id
     limit 1`,
    [id]
  );
  const current = publicManagedPromo(currentResult.rows[0], now);
  if (!current) throw promoError("Промокод не найден", 404);

  const promo = normalizePromoInput(input, current);
  await ensurePromoCodeIsFree(promo.code, id);

  const result = await pool.query(
    `
      update promo_codes
      set code = $2,
          discount_percent = $3,
          internal_comment = $4,
          valid_from = $5::date,
          valid_until = $6::date,
          daily_start = $7::time,
          daily_end = $8::time,
          weekdays = $9::jsonb,
          scope_type = $10,
          category_ids = $11::jsonb,
          product_ids = $12::jsonb,
          usage_limit = $13,
          per_customer_limit = $14,
          minimum_order_amount = $15,
          maximum_discount_amount = $16,
          status = $17,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      id,
      promo.code,
      promo.percent,
      promo.internalComment || null,
      promo.validFrom || null,
      promo.validUntil || null,
      promo.dailyStart || null,
      promo.dailyEnd || null,
      JSON.stringify(promo.weekdays),
      promo.scopeType,
      JSON.stringify(promo.categoryIds),
      JSON.stringify(promo.productIds),
      promo.usageLimit,
      promo.perCustomerLimit,
      promo.minimumOrderAmount,
      promo.maximumDiscountAmount,
      promo.status
    ]
  );
  return getManagedPromoCodeByCode(result.rows[0]?.code, now);
}

export async function resolveManagedPromoCode(code, now = new Date()) {
  const promo = await getManagedPromoCodeByCode(code, now);
  return promo?.availability?.active ? promo : null;
}

export function applyManagedPromoToOrder(order, promo, context = {}) {
  if (!promo?.id || promo.type !== "managed") return order;

  const availability = getManagedPromoAvailability(
    {
      ...promo,
      countedUses: context.totalUsageCount ?? promo.countedUses
    },
    context.now || new Date()
  );
  if (!availability.active) {
    throw promoError(availability.message || "Промокод сейчас не действует", 409);
  }

  const evaluation = evaluatePromoCart(promo, order?.items, context);
  if (!evaluation.eligible) {
    throw promoError(evaluation.message || "Промокод не подходит для этого заказа", 409);
  }

  return {
    ...order,
    promoCode: promo.code,
    managedPromoId: promo.id,
    discount: true,
    discountLabel: promo.label,
    subtotal: evaluation.subtotal,
    discountAmount: evaluation.discount,
    total: Math.max(0, evaluation.subtotal - evaluation.discount),
    promoRules: {
      weekdays: normalizeWeekdays(promo.weekdays),
      scopeType: promo.scopeType || "all",
      categoryIds: normalizeIdList(promo.categoryIds, 100),
      productIds: normalizeIdList(promo.productIds, 500),
      minimumOrderAmount: promo.minimumOrderAmount,
      maximumDiscountAmount: promo.maximumDiscountAmount,
      percent: promo.percent
    }
  };
}

export async function reserveManagedPromoUse(order, promoId) {
  if (!promoId || !order?.id) return null;

  const client = await pool.connect();
  try {
    await client.query("begin");

    const promoResult = await client.query(
      "select * from promo_codes where id = $1 for update",
      [promoId]
    );
    const usageResult = await client.query(
      `
        select
          count(*) filter (where status = 'used')::int as usage_count,
          count(*) filter (where status = 'reserved' and expires_at > now())::int as reserved_count
        from promo_redemptions
        where promo_code_id = $1
      `,
      [promoId]
    );
    const promo = publicManagedPromo({
      ...promoResult.rows[0],
      ...usageResult.rows[0]
    });
    if (!promo) throw promoError("Промокод не найден", 404);

    const existingResult = await client.query(
      "select * from promo_redemptions where order_id = $1 for update",
      [order.id]
    );
    const existing = existingResult.rows[0];
    if (
      existing?.promo_code_id === promoId &&
      (existing.status === "used" ||
        (existing.status === "reserved" && new Date(existing.expires_at).getTime() > Date.now()))
    ) {
      await client.query("commit");
      return existing;
    }

    const customerCountResult = order.customerId
      ? await client.query(
          `
            select count(*)::int as count
            from promo_redemptions
            where promo_code_id = $1
              and customer_id = $2
              and order_id <> $3
              and (
                status = 'used'
                or (status = 'reserved' and expires_at > now())
              )
          `,
          [promoId, order.customerId, order.id]
        )
      : { rows: [{ count: 0 }] };

    const checkedOrder = applyManagedPromoToOrder(order, promo, {
      totalUsageCount: promo.countedUses,
      customerUsageCount: Number(customerCountResult.rows[0]?.count || 0)
    });

    const result = await client.query(
      `
        insert into promo_redemptions (
          id, promo_code_id, order_id, customer_id, status,
          order_total, discount_amount, expires_at
        )
        values (
          $1, $2, $3, $4, 'reserved', $5, $6,
          now() + make_interval(mins => $7::int)
        )
        on conflict (order_id) do update set
          promo_code_id = excluded.promo_code_id,
          customer_id = excluded.customer_id,
          status = 'reserved',
          order_total = excluded.order_total,
          discount_amount = excluded.discount_amount,
          expires_at = excluded.expires_at,
          updated_at = now()
        returning *
      `,
      [
        existing?.id || makeRedemptionId(),
        promoId,
        order.id,
        order.customerId || null,
        checkedOrder.total,
        checkedOrder.discountAmount,
        PROMO_RESERVATION_MINUTES
      ]
    );

    await client.query("commit");
    return result.rows[0];
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function confirmManagedPromoUse(order) {
  const promoId = order?.managedPromoId;
  if (!promoId || !order?.id) return null;

  const result = await pool.query(
    `
      insert into promo_redemptions (
        id, promo_code_id, order_id, customer_id, status,
        order_total, discount_amount, expires_at
      )
      values ($1, $2, $3, $4, 'used', $5, $6, null)
      on conflict (order_id) do update set
        status = 'used',
        order_total = excluded.order_total,
        discount_amount = excluded.discount_amount,
        expires_at = null,
        updated_at = now()
      returning *
    `,
    [
      makeRedemptionId(),
      promoId,
      order.id,
      order.customerId || null,
      Number(order.total || 0),
      Number(order.discountAmount || 0)
    ]
  );
  return result.rows[0];
}

export async function releaseManagedPromoUse(orderId) {
  if (!orderId) return null;
  const result = await pool.query(
    `
      update promo_redemptions
      set status = 'released',
          expires_at = null,
          updated_at = now()
      where order_id = $1 and status = 'reserved'
      returning *
    `,
    [orderId]
  );
  return result.rows[0] || null;
}
