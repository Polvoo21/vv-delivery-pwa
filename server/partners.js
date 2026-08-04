import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { pool } from "./db.js";

const SESSION_TTL_DAYS = 30;
export const DEV_PARTNER_TOKEN = "__vv_dev_partner_token__";
const DEV_PARTNER_ID = "partner_dev";

export const COMMISSION_STATUSES = {
  pending: "Ожидает выполнения",
  approved: "Начислено",
  paid: "Выплачено",
  cancelled: "Отменено"
};

const DEV_PARTNER = {
  id: DEV_PARTNER_ID,
  name: "Dev партнёр",
  login: "dev",
  promoCode: "DEV",
  discountPercent: 10,
  commissionPercent: 7,
  status: "active",
  createdAt: new Date().toISOString(),
  ordersCount: 3,
  revenue: 4670,
  commissionAmount: 327,
  payableAmount: 108,
  paidAmount: 112
};

const DEV_COMMISSIONS = [
  {
    id: "commission_dev_1028",
    orderId: "DEV-1028",
    promoCode: "DEV",
    orderTotal: 1540,
    commissionPercent: 7,
    commissionAmount: 108,
    status: "approved",
    statusLabel: COMMISSION_STATUSES.approved,
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    orderStatus: "delivered",
    orderStatusLabel: "Доставлен",
    items: [
      { name: "Семейное комбо из 3 пицц", qty: 1, weight: "3 пиццы" },
      { name: "Морс ягодный", qty: 2, weight: "0,5 л" }
    ]
  },
  {
    id: "commission_dev_1027",
    orderId: "DEV-1027",
    promoCode: "DEV",
    orderTotal: 1530,
    commissionPercent: 7,
    commissionAmount: 107,
    status: "pending",
    statusLabel: COMMISSION_STATUSES.pending,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    orderStatus: "cooking",
    orderStatusLabel: "Готовится",
    items: [
      { name: "Пицца Том ям", qty: 1, weight: "30 см" },
      { name: "Добрый Кола", qty: 1, weight: "1 л" }
    ]
  },
  {
    id: "commission_dev_1026",
    orderId: "DEV-1026",
    promoCode: "DEV",
    orderTotal: 1600,
    commissionPercent: 7,
    commissionAmount: 112,
    status: "paid",
    statusLabel: COMMISSION_STATUSES.paid,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    orderStatus: "delivered",
    orderStatusLabel: "Доставлен",
    items: [
      { name: "Пепперони", qty: 1, weight: "30 см" },
      { name: "Сырная", qty: 1, weight: "30 см" }
    ]
  }
];

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

export function normalizePromoCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace("ВВ", "VV")
    .replace(/[^A-ZА-Я0-9_-]/g, "")
    .slice(0, 24);
}

function publicPartner(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    login: row.login,
    promoCode: row.promo_code,
    discountPercent: Number(row.discount_percent || 0),
    commissionPercent: Number(row.commission_percent || 0),
    status: row.status,
    statusLabel: row.status === "archived" ? "В архиве" : "Доступ открыт",
    createdAt: row.created_at,
    ordersCount: Number(row.orders_count || 0),
    revenue: Number(row.revenue || 0),
    commissionAmount: Number(row.commission_amount || 0),
    payableAmount: Number(row.payable_amount || 0),
    paidAmount: Number(row.paid_amount || 0)
  };
}

function publicPayout(row) {
  if (!row) return null;
  return {
    id: row.id,
    partnerId: row.partner_id,
    amount: Number(row.amount || 0),
    note: row.note || "",
    status: row.status,
    createdBy: row.created_by || "",
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function makePartnerError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function normalizePartnerPayout(input = {}) {
  const amount = Math.round(Number(input.amount || 0) * 100) / 100;
  const note = String(input.note || "").trim().slice(0, 500);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw makePartnerError("Укажите сумму выплаты больше нуля");
  }

  return { amount, note };
}

export function assertPartnerPayoutWithinBalance(amount, payableAmount) {
  const available = Math.max(0, Number(payableAmount || 0));

  if (amount > available + 0.001) {
    throw makePartnerError(`Доступно к выплате ${available.toFixed(2)} ₽`);
  }

  return true;
}

function normalizeCommissionAddon(addon) {
  const name = typeof addon === "string" ? addon : addon?.name;
  const cleanName = String(name || "").trim();
  return cleanName || null;
}

function normalizeCommissionItem(item) {
  if (!item || typeof item !== "object") return null;

  const name = String(item.name || "").trim();
  if (!name) return null;

  const qty = Math.max(1, Number(item.qty || item.quantity || 1));
  const addons = Array.isArray(item.addons) ? item.addons.map(normalizeCommissionAddon).filter(Boolean) : [];
  const removed = Array.isArray(item.removed) ? item.removed.map(normalizeCommissionAddon).filter(Boolean) : [];
  const comboItems = Array.isArray(item.comboItems)
    ? item.comboItems.map(normalizeCommissionItem).filter(Boolean)
    : [];

  return {
    productId: item.productId || item.id || "",
    name,
    qty,
    weight: String(item.weight || item.size || "").trim(),
    addons,
    removed,
    comboItems
  };
}

function normalizeCommissionItems(raw) {
  return (Array.isArray(raw?.items) ? raw.items : []).map(normalizeCommissionItem).filter(Boolean);
}

function publicCommission(row) {
  const raw = row.raw || {};
  return {
    id: row.id,
    orderId: row.order_id,
    promoCode: row.promo_code,
    orderTotal: Number(row.order_total || 0),
    commissionPercent: Number(row.commission_percent || 0),
    commissionAmount: Number(row.commission_amount || 0),
    status: row.status,
    statusLabel: COMMISSION_STATUSES[row.status] || COMMISSION_STATUSES.pending,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    orderStatus: row.order_status || raw.status || "accepted",
    orderStatusLabel: row.order_status_label,
    items: normalizeCommissionItems(raw)
  };
}

export function hashPartnerPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;

  const actual = Buffer.from(hash, "hex");
  const expected = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function isDevPartnerLogin(login, password) {
  return String(login || "").trim().toLowerCase() === "dev" && String(password || "") === "dev";
}

export function getDevPartner() {
  return { ...DEV_PARTNER };
}

export function getDevPartnerDashboard() {
  return {
    partner: getDevPartner(),
    commissions: DEV_COMMISSIONS.map((commission) => ({ ...commission }))
  };
}

export async function listPartners() {
  const result = await pool.query(`
    select
      p.*,
      coalesce(c.orders_count, 0) as orders_count,
      coalesce(c.revenue, 0) as revenue,
      coalesce(c.commission_amount, 0) as commission_amount,
      coalesce(c.legacy_paid_amount, 0) + coalesce(pay.paid_amount, 0) as paid_amount,
      greatest(coalesce(c.approved_amount, 0) - coalesce(pay.paid_amount, 0), 0) as payable_amount
    from partners p
    left join lateral (
      select
        count(*) filter (where status <> 'cancelled')::int as orders_count,
        coalesce(sum(order_total) filter (where status <> 'cancelled'), 0)::numeric as revenue,
        coalesce(sum(commission_amount) filter (where status in ('approved', 'paid')), 0)::numeric
          as commission_amount,
        coalesce(sum(commission_amount) filter (where status = 'approved'), 0)::numeric
          as approved_amount,
        coalesce(sum(commission_amount) filter (where status = 'paid'), 0)::numeric
          as legacy_paid_amount
      from partner_commissions
      where partner_id = p.id
    ) c on true
    left join lateral (
      select coalesce(sum(amount) filter (where status = 'confirmed'), 0)::numeric as paid_amount
      from partner_payouts
      where partner_id = p.id
    ) pay on true
    order by case when p.status = 'active' then 0 else 1 end, p.created_at desc
  `);

  return result.rows.map(publicPartner);
}

async function getPartnerSummary(partnerId, client = pool) {
  const result = await client.query(
    `
      select
        p.*,
        coalesce(c.orders_count, 0) as orders_count,
        coalesce(c.revenue, 0) as revenue,
        coalesce(c.commission_amount, 0) as commission_amount,
        coalesce(c.legacy_paid_amount, 0) + coalesce(pay.paid_amount, 0) as paid_amount,
        greatest(coalesce(c.approved_amount, 0) - coalesce(pay.paid_amount, 0), 0) as payable_amount
      from partners p
      left join lateral (
        select
          count(*) filter (where status <> 'cancelled')::int as orders_count,
          coalesce(sum(order_total) filter (where status <> 'cancelled'), 0)::numeric as revenue,
          coalesce(sum(commission_amount) filter (where status in ('approved', 'paid')), 0)::numeric
            as commission_amount,
          coalesce(sum(commission_amount) filter (where status = 'approved'), 0)::numeric
            as approved_amount,
          coalesce(sum(commission_amount) filter (where status = 'paid'), 0)::numeric
            as legacy_paid_amount
        from partner_commissions
        where partner_id = p.id
      ) c on true
      left join lateral (
        select coalesce(sum(amount) filter (where status = 'confirmed'), 0)::numeric as paid_amount
        from partner_payouts
        where partner_id = p.id
      ) pay on true
      where p.id = $1
      limit 1
    `,
    [partnerId]
  );

  return publicPartner(result.rows[0]);
}

export async function getAdminPartnerDetails(partnerId) {
  const [partner, commissionsResult, payoutsResult] = await Promise.all([
    getPartnerSummary(partnerId),
    pool.query(
      `
        select
          c.*,
          o.status as order_status,
          o.raw
        from partner_commissions c
        join orders o on o.id = c.order_id
        where c.partner_id = $1
        order by c.created_at desc
        limit 100
      `,
      [partnerId]
    ),
    pool.query(
      `
        select *
        from partner_payouts
        where partner_id = $1
        order by paid_at desc, created_at desc
        limit 100
      `,
      [partnerId]
    )
  ]);

  if (!partner) {
    throw makePartnerError("Партнёр не найден", 404);
  }

  return {
    partner,
    commissions: commissionsResult.rows.map(publicCommission),
    payouts: payoutsResult.rows.map(publicPayout)
  };
}

export async function updatePartnerAccess(partnerId, input = {}, options = {}) {
  const nextStatus = input.status === undefined ? null : String(input.status || "").trim();
  const nextPassword = input.password === undefined ? "" : String(input.password || "");
  const allowWeakDevPassword = Boolean(options.allowWeakDevPassword && nextPassword === "dev");

  if (nextStatus !== null && !["active", "archived"].includes(nextStatus)) {
    throw makePartnerError("Некорректный статус доступа");
  }

  if (nextPassword && !allowWeakDevPassword && nextPassword.length < 6) {
    throw makePartnerError("Новый пароль должен быть не короче 6 символов");
  }

  if (nextStatus === null && !nextPassword) {
    throw makePartnerError("Укажите новый пароль или статус доступа");
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const existing = await client.query("select id from partners where id = $1 for update", [partnerId]);
    if (!existing.rowCount) {
      throw makePartnerError("Партнёр не найден", 404);
    }

    await client.query(
      `
        update partners
        set password_hash = case when $2::text is null then password_hash else $2 end,
            status = coalesce($3, status),
            updated_at = now()
        where id = $1
      `,
      [partnerId, nextPassword ? hashPartnerPassword(nextPassword) : null, nextStatus]
    );

    if (nextPassword || nextStatus === "archived") {
      await client.query("delete from partner_sessions where partner_id = $1", [partnerId]);
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  return getAdminPartnerDetails(partnerId);
}

export async function recordPartnerPayout(partnerId, input = {}, options = {}) {
  const { amount, note } = normalizePartnerPayout(input);
  const createdBy = String(options.createdBy || "Руководитель").trim().slice(0, 120);

  const client = await pool.connect();
  let payout;
  try {
    await client.query("begin");
    const partnerResult = await client.query("select id from partners where id = $1 for update", [partnerId]);
    if (!partnerResult.rowCount) {
      throw makePartnerError("Партнёр не найден", 404);
    }

    const balanceResult = await client.query(
      `
        select
          greatest(
            coalesce((
              select sum(commission_amount)
              from partner_commissions
              where partner_id = $1 and status = 'approved'
            ), 0)
            -
            coalesce((
              select sum(amount)
              from partner_payouts
              where partner_id = $1 and status = 'confirmed'
            ), 0),
            0
          )::numeric as payable_amount
      `,
      [partnerId]
    );
    const payableAmount = Number(balanceResult.rows[0]?.payable_amount || 0);

    assertPartnerPayoutWithinBalance(amount, payableAmount);

    const payoutResult = await client.query(
      `
        insert into partner_payouts (
          id, partner_id, amount, note, status, created_by, paid_at, created_at, updated_at
        )
        values ($1, $2, $3, $4, 'confirmed', $5, now(), now(), now())
        returning *
      `,
      [makeId("payout"), partnerId, amount, note, createdBy]
    );
    payout = publicPayout(payoutResult.rows[0]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  return {
    payout,
    ...(await getAdminPartnerDetails(partnerId))
  };
}

export async function createPartner(input, options = {}) {
  const name = String(input.name || "").trim();
  const login = String(input.login || "").trim().toLowerCase();
  const password = String(input.password || "");
  const promoCode = normalizePromoCode(input.promoCode);
  const discountPercent = Math.min(90, Math.max(0, Number(input.discountPercent || 10)));
  const commissionPercent = Math.min(90, Math.max(0, Number(input.commissionPercent || 7)));
  const allowWeakDevPassword = Boolean(options.allowWeakDevPassword && password === "dev");

  if (!name) {
    const error = new Error("Укажите имя блогера");
    error.statusCode = 400;
    throw error;
  }

  if (!login || login.length < 3) {
    const error = new Error("Логин должен быть не короче 3 символов");
    error.statusCode = 400;
    throw error;
  }

  if (!password || (!allowWeakDevPassword && password.length < 6)) {
    const error = new Error("Пароль должен быть не короче 6 символов");
    error.statusCode = 400;
    throw error;
  }

  if (!promoCode || promoCode.length < 3) {
    const error = new Error("Промокод должен быть не короче 3 символов");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
      insert into partners (
        id, name, login, password_hash, promo_code, discount_percent, commission_percent
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `,
    [makeId("partner"), name, login, hashPartnerPassword(password), promoCode, discountPercent, commissionPercent]
  );

  return publicPartner(result.rows[0]);
}

export async function resolvePromoCode(code) {
  const promoCode = normalizePromoCode(code);
  if (!promoCode) return null;

  const result = await pool.query(
    `
      select *
      from partners
      where upper(promo_code) = $1 and status = 'active'
      limit 1
    `,
    [promoCode]
  );

  const partner = publicPartner(result.rows[0]);
  if (!partner) return null;

  return {
    code: partner.promoCode,
    percent: partner.discountPercent,
    label: `-${partner.discountPercent}% по промокоду ${partner.promoCode}`,
    partner
  };
}

export async function loginPartner(login, password, options = {}) {
  const normalizedLogin = String(login || "").trim().toLowerCase();

  if (options.allowDevLogin && isDevPartnerLogin(normalizedLogin, password)) {
    return {
      token: DEV_PARTNER_TOKEN,
      partner: getDevPartner()
    };
  }

  const result = await pool.query("select * from partners where login = $1 and status = 'active' limit 1", [
    normalizedLogin
  ]);
  const row = result.rows[0];

  if (!row || !verifyPassword(password, row.password_hash)) {
    const error = new Error("Неверный логин или пароль");
    error.statusCode = 401;
    throw error;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await pool.query(
    `
      insert into partner_sessions (token_hash, partner_id, expires_at)
      values ($1, $2, now() + make_interval(days => $3::int))
    `,
    [tokenHash, row.id, SESSION_TTL_DAYS]
  );

  return {
    token,
    partner: publicPartner(row)
  };
}

export async function getPartnerByToken(token) {
  const tokenHash = hashToken(token || "");
  const result = await pool.query(
    `
      select p.*
      from partner_sessions s
      join partners p on p.id = s.partner_id
      where s.token_hash = $1
        and s.expires_at > now()
        and p.status = 'active'
      limit 1
    `,
    [tokenHash]
  );

  return publicPartner(result.rows[0]);
}

export async function createCommissionForOrder(order) {
  const partner = order.partner;
  if (!partner?.id) return null;

  const orderTotal = Number(order.total || 0);
  const commissionPercent = Number(partner.commissionPercent || 0);
  const commissionAmount = Math.max(0, Math.round((orderTotal * commissionPercent) / 100));
  const status = order.status === "delivered" ? "approved" : "pending";

  const result = await pool.query(
    `
      insert into partner_commissions (
        id, partner_id, order_id, promo_code, order_total, commission_percent, commission_amount, status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (order_id) do update set
        partner_id = excluded.partner_id,
        promo_code = excluded.promo_code,
        order_total = excluded.order_total,
        commission_percent = excluded.commission_percent,
        commission_amount = excluded.commission_amount,
        status = excluded.status,
        updated_at = now()
      returning *
    `,
    [
      makeId("commission"),
      partner.id,
      order.id,
      normalizePromoCode(order.promoCode || partner.promoCode),
      orderTotal,
      commissionPercent,
      commissionAmount,
      status
    ]
  );

  return publicCommission(result.rows[0]);
}

export async function syncCommissionStatus(order) {
  const status = order.status === "delivered" ? "approved" : order.status === "cancelled" ? "cancelled" : "pending";
  const result = await pool.query(
    `
      update partner_commissions
      set status = $2, updated_at = now()
      where order_id = $1 and status <> 'paid'
      returning *
    `,
    [order.id, status]
  );

  return result.rows[0] ? publicCommission(result.rows[0]) : null;
}

export async function getPartnerDashboard(partnerId) {
  return getAdminPartnerDetails(partnerId);
}
