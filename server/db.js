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
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table orders add column if not exists promo_code text;
    alter table orders add column if not exists partner_id text;
    alter table orders add column if not exists customer_id text;
    alter table orders add column if not exists payment_provider text;
    alter table orders add column if not exists payment_id text;
    alter table orders add column if not exists payment_status text;
    alter table orders add column if not exists paid_at timestamptz;
    alter table orders drop column if exists telegram_message_id;

    create index if not exists orders_active_created_idx
      on orders (archived_at, created_at desc);

    create unique index if not exists orders_payment_provider_id_idx
      on orders (payment_provider, payment_id)
      where payment_provider is not null and payment_id is not null;

    create index if not exists orders_customer_created_idx
      on orders (customer_id, created_at desc);

    create table if not exists order_payment_events (
      id bigserial primary key,
      order_id text not null references orders(id) on delete cascade,
      provider text not null,
      provider_payment_id text,
      event_type text not null,
      payment_status text,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists order_payment_events_order_idx
      on order_payment_events (order_id, created_at desc);

    create table if not exists max_notification_outbox (
      id bigserial primary key,
      event_key text not null unique,
      text text not null,
      attachments jsonb not null default '[]'::jsonb,
      notify boolean not null default true,
      priority integer not null default 50,
      status text not null default 'pending',
      attempts integer not null default 0,
      next_attempt_at timestamptz not null default now(),
      last_error text,
      sent_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists max_notification_outbox_pending_idx
      on max_notification_outbox (status, next_attempt_at, priority desc, created_at)
      where status in ('pending', 'retry');

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

    create table if not exists promo_codes (
      id text primary key,
      code text not null unique,
      discount_percent numeric not null default 10,
      internal_comment text,
      valid_from date,
      valid_until date,
      daily_start time,
      daily_end time,
      weekdays jsonb not null default '[]'::jsonb,
      scope_type text not null default 'all',
      category_ids jsonb not null default '[]'::jsonb,
      product_ids jsonb not null default '[]'::jsonb,
      usage_limit integer,
      per_customer_limit integer,
      minimum_order_amount numeric,
      maximum_discount_amount numeric,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table promo_codes add column if not exists scope_type text not null default 'all';
    alter table promo_codes add column if not exists weekdays jsonb not null default '[]'::jsonb;
    alter table promo_codes add column if not exists category_ids jsonb not null default '[]'::jsonb;
    alter table promo_codes add column if not exists product_ids jsonb not null default '[]'::jsonb;
    alter table promo_codes add column if not exists usage_limit integer;
    alter table promo_codes add column if not exists per_customer_limit integer;
    alter table promo_codes add column if not exists minimum_order_amount numeric;
    alter table promo_codes add column if not exists maximum_discount_amount numeric;

    create index if not exists promo_codes_code_idx
      on promo_codes (upper(code));

    create index if not exists promo_codes_status_dates_idx
      on promo_codes (status, valid_from, valid_until);

    create table if not exists promo_redemptions (
      id text primary key,
      promo_code_id text not null references promo_codes(id) on delete cascade,
      order_id text not null references orders(id) on delete cascade,
      customer_id text,
      status text not null default 'reserved',
      order_total numeric not null default 0,
      discount_amount numeric not null default 0,
      expires_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(order_id)
    );

    create index if not exists promo_redemptions_promo_status_idx
      on promo_redemptions (promo_code_id, status, expires_at);

    create index if not exists promo_redemptions_customer_idx
      on promo_redemptions (promo_code_id, customer_id, status);

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

    create table if not exists partner_payouts (
      id text primary key,
      partner_id text not null references partners(id) on delete cascade,
      amount numeric not null check (amount > 0),
      note text,
      status text not null default 'confirmed',
      created_by text,
      paid_at timestamptz not null default now(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists partner_payouts_partner_paid_idx
      on partner_payouts (partner_id, paid_at desc);

    create table if not exists admin_push_subscriptions (
      id text primary key,
      label text,
      subscription jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table admin_push_subscriptions add column if not exists admin_login text;
    alter table admin_push_subscriptions add column if not exists admin_role text;

    create table if not exists admin_sessions (
      token_hash text primary key,
      admin_login text not null,
      admin_role text not null,
      expires_at timestamptz not null,
      user_agent text,
      ip text,
      created_at timestamptz not null default now()
    );

    create index if not exists admin_sessions_login_idx
      on admin_sessions (admin_login, expires_at desc);

    create table if not exists admin_passkeys (
      id text primary key,
      admin_login text not null,
      name text,
      public_key bytea not null,
      counter bigint not null default 0,
      transports jsonb not null default '[]'::jsonb,
      device_type text,
      backed_up boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      last_used_at timestamptz
    );

    create index if not exists admin_passkeys_login_idx
      on admin_passkeys (admin_login, created_at desc);

    create table if not exists admin_webauthn_challenges (
      id text primary key,
      admin_login text not null,
      kind text not null,
      challenge text not null,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create index if not exists admin_webauthn_challenges_lookup_idx
      on admin_webauthn_challenges (admin_login, kind, expires_at desc);

    create table if not exists app_settings (
      key text primary key,
      value jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );

    create table if not exists customers (
      id text primary key,
      name text,
      phone text unique,
      email text,
      phone_verified boolean not null default false,
      marketing_consent boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table customers add column if not exists phone_verified boolean not null default false;
    alter table customers add column if not exists contact_phone text;
    alter table customers add column if not exists contact_phone_configured_at timestamptz default now();
    alter table customers alter column contact_phone_configured_at drop default;
    alter table customers add column if not exists has_children boolean;
    alter table customers add column if not exists children jsonb not null default '[]'::jsonb;
    alter table customers add column if not exists email_verified boolean not null default false;
    alter table customers add column if not exists email_configured_at timestamptz;
    alter table customers add column if not exists receipts_consent boolean not null default false;
    alter table customers add column if not exists marketing_channels jsonb not null default '{}'::jsonb;
    alter table customers add column if not exists marketing_consent_at timestamptz;
    alter table customers add column if not exists marketing_consent_withdrawn_at timestamptz;
    alter table customers add column if not exists onboarding_completed_at timestamptz default now();
    alter table customers alter column onboarding_completed_at drop default;

    update customers
    set contact_phone = phone
    where contact_phone is null
      and contact_phone_configured_at is not null
      and phone is not null;

    create table if not exists customer_identities (
      id text primary key,
      customer_id text not null references customers(id) on delete cascade,
      provider text not null,
      provider_user_id text not null,
      email text,
      phone text,
      phone_verified boolean not null default false,
      raw_profile jsonb,
      last_login_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(provider, provider_user_id)
    );

    alter table customer_identities add column if not exists phone_verified boolean not null default false;
    alter table customer_identities add column if not exists last_login_at timestamptz;

    create table if not exists customer_identity_link_challenges (
      id text primary key,
      customer_id text not null references customers(id) on delete cascade,
      provider text not null,
      provider_user_id text not null,
      name text,
      email text,
      phone text,
      phone_verified boolean not null default false,
      raw_profile jsonb not null default '{}'::jsonb,
      marketing_consent boolean not null default false,
      expires_at timestamptz not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists customer_identity_link_challenges_customer_idx
      on customer_identity_link_challenges (customer_id, expires_at desc);

    create index if not exists customer_identity_link_challenges_identity_idx
      on customer_identity_link_challenges (provider, provider_user_id, expires_at desc);

    create table if not exists customer_sessions (
      token_hash text primary key,
      customer_id text not null references customers(id) on delete cascade,
      expires_at timestamptz not null,
      user_agent text,
      ip text,
      created_at timestamptz not null default now()
    );

    create table if not exists customer_login_challenges (
      id text primary key,
      phone text not null,
      customer_email text,
      channel text not null,
      provider text not null default 'plusofon',
      provider_key text,
      code_hash text not null,
      attempts integer not null default 0,
      status text not null default 'pending',
      ip text,
      expires_at timestamptz not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table customer_login_challenges add column if not exists provider text not null default 'plusofon';
    alter table customer_login_challenges add column if not exists provider_key text;
    alter table customer_login_challenges add column if not exists ip text;

    create index if not exists customer_sessions_customer_idx
      on customer_sessions (customer_id, expires_at desc);

    create table if not exists customer_push_subscriptions (
      id text primary key,
      customer_id text not null references customers(id) on delete cascade,
      subscription jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists customer_push_subscriptions_customer_idx
      on customer_push_subscriptions (customer_id, updated_at desc);

    create index if not exists customer_login_challenges_phone_idx
      on customer_login_challenges (phone, created_at desc);

    create index if not exists customer_login_challenges_provider_phone_idx
      on customer_login_challenges (provider, phone, created_at desc);

    create table if not exists customer_email_challenges (
      id text primary key,
      customer_id text not null references customers(id) on delete cascade,
      email text not null,
      code_hash text not null,
      attempts integer not null default 0,
      status text not null default 'pending',
      marketing_consent boolean not null default false,
      ip text,
      expires_at timestamptz not null,
      sent_at timestamptz not null default now(),
      verified_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists customer_email_challenges_customer_idx
      on customer_email_challenges (customer_id, created_at desc);

    create index if not exists customer_email_challenges_email_idx
      on customer_email_challenges (lower(email), created_at desc);

    create table if not exists product_reviews (
      id text primary key,
      product_id text not null,
      customer_id text references customers(id) on delete set null,
      order_id text references orders(id) on delete set null,
      rating integer not null check (rating >= 1 and rating <= 5),
      text text,
      status text not null default 'pending',
      moderation_note text,
      customer_name text,
      customer_phone text,
      is_demo boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      moderated_at timestamptz
    );

    alter table product_reviews add column if not exists is_demo boolean not null default false;

    create table if not exists product_review_photos (
      id text primary key,
      review_id text not null references product_reviews(id) on delete cascade,
      url text not null,
      original_name text,
      mime_type text,
      size_bytes integer,
      width integer,
      height integer,
      created_at timestamptz not null default now()
    );

    create index if not exists product_reviews_product_status_idx
      on product_reviews (product_id, status, created_at desc);

    create index if not exists product_reviews_customer_idx
      on product_reviews (customer_id, created_at desc);

    create index if not exists product_reviews_status_created_idx
      on product_reviews (status, created_at desc);

    create table if not exists lost_items (
      id text primary key,
      item_number integer,
      image_url text not null,
      original_name text,
      mime_type text,
      size_bytes integer,
      width integer,
      height integer,
      added_at date not null default current_date,
      created_by text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table lost_items add column if not exists item_number integer;

    insert into lost_items (
      id, item_number, image_url, original_name, mime_type,
      added_at, created_by, created_at, updated_at
    )
    select
      'lost-' || lpad(number::text, 3, '0') as id,
      number as item_number,
      '/assets/site/lost-items/lost-' || lpad(number::text, 3, '0') || '.webp' as image_url,
      'lost-' || lpad(number::text, 3, '0') || '.webp' as original_name,
      'image/webp' as mime_type,
      date '2026-07-07' as added_at,
      'Первичный импорт' as created_by,
      now() as created_at,
      now() as updated_at
    from generate_series(1, 70) as numbers(number)
    on conflict (id) do nothing;

    with base as (
      select greatest(70, coalesce(max(item_number), 70)) as value
      from lost_items
    ),
    numbered as (
      select
        lost_items.id,
        base.value + row_number() over (order by lost_items.created_at asc, lost_items.id asc) as next_number
      from lost_items
      cross join base
      where lost_items.item_number is null
    )
    update lost_items
    set item_number = numbered.next_number
    from numbered
    where lost_items.id = numbered.id;

    create unique index if not exists lost_items_item_number_unique_idx
      on lost_items (item_number)
      where item_number is not null;

    create index if not exists lost_items_public_idx
      on lost_items (archived_at, added_at desc, item_number desc, created_at desc);

    create table if not exists blogger_review_rewards (
      id text primary key,
      instagram_url text not null unique,
      review_screenshot_url text not null,
      profile_screenshot_url text not null,
      status text not null default 'pending',
      created_by text not null,
      created_by_role text not null,
      redeemed_by text,
      redeemed_by_role text,
      redeemed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (status in ('pending', 'redeemed'))
    );

    alter table blogger_review_rewards
      drop column if exists blogger_name,
      drop column if exists instagram_key,
      drop column if exists review_date;

    create unique index if not exists blogger_review_rewards_instagram_url_unique_idx
      on blogger_review_rewards (instagram_url);

    create index if not exists blogger_review_rewards_status_idx
      on blogger_review_rewards (status, created_at desc);

    create table if not exists site_gallery_items (
      id text primary key,
      type text not null default 'photo',
      title text,
      caption text,
      image_url text,
      poster_url text,
      video_url text,
      orientation text not null default 'landscape',
      sort_order integer not null default 0,
      status text not null default 'active',
      original_name text,
      mime_type text,
      size_bytes integer,
      width integer,
      height integer,
      created_by text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists site_gallery_items_public_idx
      on site_gallery_items (status, sort_order, created_at desc);

    create table if not exists catalog_categories (
      id text primary key,
      title text not null,
      short_title text,
      description text,
      image_url text,
      sort_order integer not null default 0,
      status text not null default 'active',
      created_by text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists catalog_categories_public_idx
      on catalog_categories (status, sort_order, created_at desc);

    create table if not exists catalog_products (
      id text primary key,
      category_id text not null,
      name text not null,
      description text,
      weight text,
      price numeric not null default 0,
      old_price numeric not null default 0,
      badges jsonb not null default '[]'::jsonb,
      ingredients jsonb not null default '[]'::jsonb,
      calories numeric,
      protein numeric,
      fat numeric,
      carbs numeric,
      combo_item_ids jsonb not null default '[]'::jsonb,
      image_url text,
      video_url text,
      video_original_name text,
      video_mime_type text,
      video_size_bytes integer,
      customizable boolean not null default false,
      featured boolean not null default false,
      sort_order integer not null default 0,
      status text not null default 'active',
      original_name text,
      mime_type text,
      size_bytes integer,
      width integer,
      height integer,
      created_by text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table catalog_products add column if not exists video_url text;
    alter table catalog_products add column if not exists video_original_name text;
    alter table catalog_products add column if not exists video_mime_type text;
    alter table catalog_products add column if not exists video_size_bytes integer;
    alter table catalog_products add column if not exists calories numeric;
    alter table catalog_products add column if not exists protein numeric;
    alter table catalog_products add column if not exists fat numeric;
    alter table catalog_products add column if not exists carbs numeric;

    create index if not exists catalog_products_public_idx
      on catalog_products (status, category_id, sort_order, created_at desc);

    create table if not exists masterclass_registrations (
      id bigserial primary key,
      public_id text not null unique,
      event_id text not null,
      customer_name text not null,
      phone text not null,
      adults_count integer not null default 0,
      children_ages jsonb not null default '[]'::jsonb,
      participant_count integer not null,
      amount numeric not null default 0,
      status text not null default 'payment_pending',
      payment_mode text not null default 'yookassa',
      payment_status text not null default 'pending',
      payment_provider text,
      payment_id text,
      payment_url text,
      payment_attempt integer not null default 1,
      payment_error text,
      privacy_policy_accepted boolean not null default false,
      privacy_policy_accepted_at timestamptz,
      personal_data_consent boolean not null default false,
      personal_data_consent_at timestamptz,
      marketing_consent boolean not null default false,
      marketing_consent_at timestamptz,
      marketing_consent_withdrawn_at timestamptz,
      consent_document_version text,
      consent_ip text,
      consent_user_agent text,
      paid_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint masterclass_participant_count_positive check (participant_count > 0),
      constraint masterclass_adults_count_nonnegative check (adults_count >= 0)
    );

    alter table masterclass_registrations
      add column if not exists customer_email text;
    alter table masterclass_registrations
      add column if not exists privacy_policy_accepted boolean not null default false;
    alter table masterclass_registrations
      add column if not exists privacy_policy_accepted_at timestamptz;
    alter table masterclass_registrations
      add column if not exists personal_data_consent boolean not null default false;
    alter table masterclass_registrations
      add column if not exists personal_data_consent_at timestamptz;
    alter table masterclass_registrations
      add column if not exists marketing_consent boolean not null default false;
    alter table masterclass_registrations
      add column if not exists marketing_consent_at timestamptz;
    alter table masterclass_registrations
      add column if not exists marketing_consent_withdrawn_at timestamptz;
    alter table masterclass_registrations
      add column if not exists consent_document_version text;
    alter table masterclass_registrations
      add column if not exists consent_ip text;
    alter table masterclass_registrations
      add column if not exists consent_user_agent text;
    alter table masterclass_registrations
      add column if not exists payment_provider text;
    alter table masterclass_registrations
      add column if not exists payment_id text;
    alter table masterclass_registrations
      add column if not exists payment_url text;
    alter table masterclass_registrations
      add column if not exists payment_attempt integer not null default 1;
    alter table masterclass_registrations
      add column if not exists payment_error text;
    alter table masterclass_registrations
      alter column payment_mode set default 'yookassa';

    create index if not exists masterclass_registrations_event_status_idx
      on masterclass_registrations (event_id, status, created_at desc);

    create unique index if not exists masterclass_registrations_payment_id_idx
      on masterclass_registrations (payment_id)
      where payment_id is not null;

    create unique index if not exists masterclass_registrations_active_phone_idx
      on masterclass_registrations (event_id, phone)
      where status in ('payment_pending', 'confirmed');
  `);
}

export async function closeDb() {
  await pool.end();
}
