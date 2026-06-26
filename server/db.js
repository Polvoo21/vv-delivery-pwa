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
      telegram_message_id text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists orders_active_created_idx
      on orders (archived_at, created_at desc);

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
