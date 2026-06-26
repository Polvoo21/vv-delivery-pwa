import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});

export async function initDb() {
  await pool.query(`
    create table if not exists orders (
      id text primary key,
      status text not null default 'accepted',
      raw jsonb not null,
      customer_name text,
      customer_phone text,
      mode text,
      address text,
      total numeric not null default 0,
      payment text,
      promo_code text,
      partner_id text,
      telegram_message_id text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table orders add column if not exists promo_code text;
    alter table orders add column if not exists partner_id text;

    create index if not exists orders_active_created_idx
      on orders (archived_at, created_at desc);

    create table if not exists partners (
      id text primary key,
      name text not null,
      login text not null unique,
      password_hash text not null,
      promo_code text not null unique,
      discount_percent numeric not null default 10,
      commission_percent numeric not null default 7,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists partners_promo_code_idx
      on partners (upper(promo_code));

    create table if not exists partner_sessions (
      token_hash text primary key,
      partner_id text not null references partners(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create table if not exists partner_commissions (
      id text primary key,
      partner_id text not null references partners(id) on delete cascade,
      order_id text not null references orders(id) on delete cascade,
      promo_code text not null,
      order_total numeric not null default 0,
      commission_percent numeric not null default 0,
      commission_amount numeric not null default 0,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(order_id)
    );

    create index if not exists partner_commissions_partner_created_idx
      on partner_commissions (partner_id, created_at desc);

    create table if not exists admin_push_subscriptions (
      id text primary key,
      label text,
      subscription jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function closeDb() {
  await pool.end();
}
