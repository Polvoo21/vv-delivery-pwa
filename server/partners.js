import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { pool } from "./db.js";

const SESSION_TTL_DAYS = 30;

export const COMMISSION_STATUSES = {
  pending: "Ожидает выполнения",
  approved: "Начислено",
  paid: "Выплачено",
  cancelled: "Отменено"
};

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
    createdAt: row.created_at,
    ordersCount: Number(row.orders_count || 0),
    revenue: Number(row.revenue || 0),
    commissionAmount: Number(row.commission_amount || 0),
    payableAmount: Number(row.payable_amount || 0)
  };
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
    customerName: row.customer_name || raw.customerName || "Гость",
    customerPhone: row.customer_phone || raw.customerPhone || "",
    mode: row.mode || raw.mode || "",
    address: row.address || raw.address || ""
  };
}

function hashPassword(password) {
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

export async function listPartners() {
  const result = await pool.query(`
    select
      p.*,
      count(c.id) as orders_count,
      coalesce(sum(c.order_total), 0) as revenue,
      coalesce(sum(c.commission_amount), 0) as commission_amount,
      coalesce(sum(case when c.status in ('approved', 'paid') then c.commission_amount else 0 end), 0) as payable_amount
    from partners p
    left join partner_commissions c on c.partner_id = p.id
    group by p.id
    order by p.created_at desc
  `);

  return result.rows.map(publicPartner);
}

export async function createPartner(input) {
  const name = String(input.name || "").trim();
  const login = String(input.login || "").trim().toLowerCase();
  const password = String(input.password || "");
  const promoCode = normalizePromoCode(input.promoCode);
  const discountPercent = Math.min(90, Math.max(0, Number(input.discountPercent || 10)));
  const commissionPercent = Math.min(90, Math.max(0, Number(input.commissionPercent || 7)));

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

  if (!password || password.length < 6) {
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
    [makeId("partner"), name, login, hashPassword(password), promoCode, discountPercent, commissionPercent]
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

export async function loginPartner(login, password) {
  const normalizedLogin = String(login || "").trim().toLowerCase();
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
  const status = order.status === "delivered" ? "approved" : "pending";
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
  const partnerResult = await pool.query(
    `
      select
        p.*,
        count(c.id) as orders_count,
        coalesce(sum(c.order_total), 0) as revenue,
        coalesce(sum(c.commission_amount), 0) as commission_amount,
        coalesce(sum(case when c.status in ('approved', 'paid') then c.commission_amount else 0 end), 0) as payable_amount
      from partners p
      left join partner_commissions c on c.partner_id = p.id
      where p.id = $1
      group by p.id
      limit 1
    `,
    [partnerId]
  );

  const commissionsResult = await pool.query(
    `
      select
        c.*,
        o.status as order_status,
        o.raw,
        o.customer_name,
        o.customer_phone,
        o.mode,
        o.address
      from partner_commissions c
      join orders o on o.id = c.order_id
      where c.partner_id = $1
      order by c.created_at desc
      limit 100
    `,
    [partnerId]
  );

  return {
    partner: publicPartner(partnerResult.rows[0]),
    commissions: commissionsResult.rows.map(publicCommission)
  };
}
