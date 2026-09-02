-- =============================================================================
-- Praetoria Vacacional — TODAS las migraciones en un solo archivo
--
-- Uso: Supabase Dashboard → SQL Editor → New query → pega TODO esto → Run.
-- Es equivalente a `supabase db push` en una base de datos nueva.
-- Seguro de re-ejecutar salvo la primera vez (las tablas ya existirían).
--
-- NO editar a mano: se genera con  cat supabase/migrations/*.sql
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 20260827090000_init.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Praetoria Vacacional — initial schema (issue #6)
-- Multi-property booking: reservations, availability blocks, rates, payments,
-- calendar syncs. Every operational row is scoped by property_id. The same dates
-- may be booked on different properties; they may never overlap on one property.
-- =============================================================================

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type reservation_status as enum ('pending', 'confirmed', 'cancelled', 'expired');
create type reservation_source as enum ('direct', 'booking', 'manual');
create type block_source as enum ('booking', 'airbnb', 'manual', 'other');
create type payment_status as enum ('created', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled');
create type sync_direction as enum ('import', 'export');

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table properties (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  experience    text not null check (experience in ('ski', 'sea')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- property_settings — one row per property. Rate config, cancellation policy
-- and any content overrides live here as JSONB so the admin panel can edit
-- them without a migration (issue #13).
-- ---------------------------------------------------------------------------
create table property_settings (
  property_id         uuid primary key references properties(id) on delete cascade,
  rate_config         jsonb not null default '{}'::jsonb,
  cancellation_policy  jsonb not null default '{}'::jsonb,
  content_overrides    jsonb not null default '{}'::jsonb,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- rate_rules — optional granular, admin-managed rules layered over rate_config.
-- kind: 'date_override' | 'min_nights' | 'closed' | 'discount' ...
-- ---------------------------------------------------------------------------
create table rate_rules (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  kind         text not null,
  starts_on    date,
  ends_on      date,
  params       jsonb not null default '{}'::jsonb,
  priority     int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index rate_rules_property_idx on rate_rules (property_id, active);

-- ---------------------------------------------------------------------------
-- reservations
-- stay is the half-open night range [check_in, check_out).
-- ---------------------------------------------------------------------------
create table reservations (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references properties(id) on delete restrict,
  code             text not null unique,
  status           reservation_status not null default 'pending',
  source           reservation_source not null default 'direct',
  check_in         date not null,
  check_out        date not null,
  stay             daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  nights           int generated always as (check_out - check_in) stored,
  guests           int not null check (guests >= 1),
  guest_name       text,
  guest_email      text,
  guest_phone      text,
  currency         text not null default 'EUR',
  total_cents      bigint not null default 0 check (total_cents >= 0),
  price_breakdown  jsonb not null default '{}'::jsonb,
  terms_accepted_at timestamptz,
  hold_expires_at  timestamptz,
  external_uid     text,
  idempotency_key  text unique,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint reservations_range_ok check (check_out > check_in)
);
create index reservations_property_status_idx on reservations (property_id, status);
create index reservations_stay_idx on reservations using gist (property_id, stay);
create index reservations_hold_idx on reservations (hold_expires_at) where status = 'pending';

-- Block overlaps between two "occupying" reservations on the same property.
-- pending + confirmed occupy; cancelled + expired do not.
alter table reservations
  add constraint reservations_no_overlap
  exclude using gist (
    property_id with =,
    stay with &&
  ) where (status in ('pending', 'confirmed'));

-- ---------------------------------------------------------------------------
-- availability_blocks — external (iCal) or manual closures.
-- ---------------------------------------------------------------------------
create table availability_blocks (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  stay          daterange generated always as (daterange(start_date, end_date, '[)')) stored,
  source        block_source not null default 'manual',
  external_uid  text,
  summary       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint availability_blocks_range_ok check (end_date > start_date),
  constraint availability_blocks_uid_unique unique (property_id, source, external_uid)
);
create index availability_blocks_stay_idx on availability_blocks using gist (property_id, stay);

alter table availability_blocks
  add constraint availability_blocks_no_overlap
  exclude using gist (property_id with =, stay with &&);

-- ---------------------------------------------------------------------------
-- Cross-table overlap guard: a reservation must not collide with a block and
-- vice-versa. Enforced by trigger since EXCLUDE cannot span tables.
-- Callers additionally take pg_advisory_xact_lock(property) to serialise.
-- ---------------------------------------------------------------------------
create or replace function assert_property_free() returns trigger
language plpgsql as $$
declare
  v_property uuid;
  v_stay     daterange;
  v_conflict int;
begin
  if tg_table_name = 'reservations' then
    if new.status not in ('pending', 'confirmed') then
      return new;
    end if;
    v_property := new.property_id;
    v_stay := daterange(new.check_in, new.check_out, '[)');

    select count(*) into v_conflict
    from availability_blocks b
    where b.property_id = v_property and b.stay && v_stay;

    if v_conflict > 0 then
      raise exception 'PROPERTY_UNAVAILABLE: reservation % overlaps an availability block', new.code
        using errcode = 'exclusion_violation';
    end if;

    select count(*) into v_conflict
    from reservations r
    where r.property_id = v_property
      and r.id <> new.id
      and r.status in ('pending', 'confirmed')
      and r.stay && v_stay;

    if v_conflict > 0 then
      raise exception 'PROPERTY_UNAVAILABLE: reservation % overlaps another reservation', new.code
        using errcode = 'exclusion_violation';
    end if;

  elsif tg_table_name = 'availability_blocks' then
    v_property := new.property_id;
    v_stay := daterange(new.start_date, new.end_date, '[)');

    select count(*) into v_conflict
    from reservations r
    where r.property_id = v_property
      and r.status in ('pending', 'confirmed')
      and r.stay && v_stay;

    if v_conflict > 0 then
      raise exception 'PROPERTY_UNAVAILABLE: block overlaps reservation(s) on property %', v_property
        using errcode = 'exclusion_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger reservations_free_guard
  before insert or update of status, check_in, check_out, property_id on reservations
  for each row execute function assert_property_free();

create trigger blocks_free_guard
  before insert or update of start_date, end_date, property_id on availability_blocks
  for each row execute function assert_property_free();

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table payments (
  id                        uuid primary key default gen_random_uuid(),
  reservation_id            uuid not null references reservations(id) on delete cascade,
  provider                  text not null default 'stripe',
  provider_checkout_session text,
  provider_payment_intent   text,
  status                    payment_status not null default 'created',
  amount_cents              bigint not null check (amount_cents >= 0),
  currency                  text not null default 'EUR',
  raw                       jsonb not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (provider, provider_checkout_session),
  unique (provider, provider_payment_intent)
);
create index payments_reservation_idx on payments (reservation_id);

-- ---------------------------------------------------------------------------
-- calendar_syncs — one row per (property, channel, direction). Records the
-- feed URL, last run, status and error so admin can see health (issue #9).
-- ---------------------------------------------------------------------------
create table calendar_syncs (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references properties(id) on delete cascade,
  channel          text not null,
  direction        sync_direction not null,
  feed_url         text,
  last_run_at      timestamptz,
  last_status      text,
  last_error       text,
  events_imported  int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (property_id, channel, direction)
);

-- ---------------------------------------------------------------------------
-- webhook_events — provider event de-duplication (Stripe + iCal fetch runs).
-- ---------------------------------------------------------------------------
create table webhook_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,
  type          text,
  payload       jsonb not null default '{}'::jsonb,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  unique (provider, event_id)
);

-- ---------------------------------------------------------------------------
-- admin_audit_log — basic audit trail for destructive/price actions.
-- ---------------------------------------------------------------------------
create table admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,
  entity      text,
  entity_id   text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger properties_touch before update on properties
  for each row execute function touch_updated_at();
create trigger reservations_touch before update on reservations
  for each row execute function touch_updated_at();
create trigger availability_blocks_touch before update on availability_blocks
  for each row execute function touch_updated_at();
create trigger payments_touch before update on payments
  for each row execute function touch_updated_at();
create trigger calendar_syncs_touch before update on calendar_syncs
  for each row execute function touch_updated_at();
create trigger property_settings_touch before update on property_settings
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public booking data is written only via the service role (server-side).
-- The anon/authenticated keys get read-only access to non-sensitive columns
-- through dedicated views, never these base tables.
-- ---------------------------------------------------------------------------
alter table properties            enable row level security;
alter table property_settings     enable row level security;
alter table rate_rules            enable row level security;
alter table reservations          enable row level security;
alter table availability_blocks   enable row level security;
alter table payments              enable row level security;
alter table calendar_syncs        enable row level security;
alter table webhook_events        enable row level security;
alter table admin_audit_log       enable row level security;

-- No permissive policies for anon/authenticated => only the service role
-- (which bypasses RLS) can touch these tables. Admin UI uses the service role
-- behind server-side auth checks (decision D-005).


-- ----------------------------------------------------------------------------
-- 20260827091000_booking_rpc.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Booking RPCs (issues #7, #10, #11)
-- Atomic availability check + hold creation, serialised per property with an
-- advisory lock so two concurrent checkouts cannot both pass the check.
-- =============================================================================

-- Free/busy for a property over a window: returns busy day-ranges from both
-- occupying reservations and availability blocks.
create or replace function property_busy_ranges(p_property uuid, p_from date, p_to date)
returns table (start_date date, end_date date, kind text)
language sql stable as $$
  select lower(stay), upper(stay), 'reservation'
  from reservations
  where property_id = p_property
    and status in ('pending', 'confirmed')
    and stay && daterange(p_from, p_to, '[)')
  union all
  select lower(stay), upper(stay), 'block'
  from availability_blocks
  where property_id = p_property
    and stay && daterange(p_from, p_to, '[)');
$$;

-- Is a specific stay free right now?
create or replace function is_stay_available(p_property uuid, p_check_in date, p_check_out date)
returns boolean
language sql stable as $$
  select not exists (
    select 1 from reservations
    where property_id = p_property
      and status in ('pending', 'confirmed')
      and stay && daterange(p_check_in, p_check_out, '[)')
  ) and not exists (
    select 1 from availability_blocks
    where property_id = p_property
      and stay && daterange(p_check_in, p_check_out, '[)')
  );
$$;

-- Create (or return, if the idempotency key repeats) a pending reservation hold.
-- Raises PROPERTY_UNAVAILABLE if the dates are taken.
create or replace function create_reservation_hold(
  p_property        uuid,
  p_check_in        date,
  p_check_out       date,
  p_guests          int,
  p_total_cents     bigint,
  p_currency        text,
  p_breakdown       jsonb,
  p_hold_minutes    int,
  p_idempotency_key text
) returns reservations
language plpgsql as $$
declare
  v_existing reservations;
  v_row      reservations;
  v_code     text;
begin
  perform pg_advisory_xact_lock(hashtext(p_property::text));

  if p_idempotency_key is not null then
    select * into v_existing from reservations where idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  if not is_stay_available(p_property, p_check_in, p_check_out) then
    raise exception 'PROPERTY_UNAVAILABLE' using errcode = 'exclusion_violation';
  end if;

  -- Human-friendly locator: PV-XXXXXX
  v_code := 'PV-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  insert into reservations (
    property_id, code, status, source, check_in, check_out, guests,
    currency, total_cents, price_breakdown, hold_expires_at, idempotency_key
  ) values (
    p_property, v_code, 'pending', 'direct', p_check_in, p_check_out, p_guests,
    p_currency, p_total_cents, coalesce(p_breakdown, '{}'::jsonb),
    now() + make_interval(mins => p_hold_minutes), p_idempotency_key
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Expire pending holds whose window has passed. Run from a cron / route.
create or replace function expire_stale_holds() returns int
language plpgsql as $$
declare
  v_count int;
begin
  with expired as (
    update reservations
      set status = 'expired'
      where status = 'pending'
        and hold_expires_at is not null
        and hold_expires_at < now()
      returning 1
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

-- Confirm a reservation after a verified payment. Idempotent.
create or replace function confirm_reservation(p_reservation uuid, p_payment_intent text)
returns reservations
language plpgsql as $$
declare
  v_row reservations;
begin
  select * into v_row from reservations where id = p_reservation for update;
  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_row.status = 'confirmed' then
    return v_row;
  end if;

  if v_row.status not in ('pending') then
    raise exception 'RESERVATION_NOT_PENDING: status=%', v_row.status;
  end if;

  update reservations
    set status = 'confirmed', hold_expires_at = null
    where id = p_reservation
    returning * into v_row;

  return v_row;
end;
$$;


-- ----------------------------------------------------------------------------
-- 20260827092000_seed_properties.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Seed the two V1 properties. UUIDs match src/content/properties/*.ts so DEMO
-- mode and a seeded database agree. rate_config is seeded empty here; the app
-- falls back to src/content/rates until the admin edits it. Re-runnable.
-- =============================================================================

insert into properties (id, slug, name, experience, active) values
  ('11111111-1111-4111-8111-111111111111', 'javalambre', 'Javalambre Mountain SuperSki', 'ski', true),
  ('22222222-2222-4222-8222-222222222222', 'valencia',   'Valencia Frente al Mar',       'sea', true)
on conflict (id) do update
  set slug = excluded.slug, name = excluded.name, experience = excluded.experience;

insert into property_settings (property_id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222')
on conflict (property_id) do nothing;

insert into calendar_syncs (property_id, channel, direction) values
  ('11111111-1111-4111-8111-111111111111', 'booking', 'import'),
  ('11111111-1111-4111-8111-111111111111', 'booking', 'export'),
  ('22222222-2222-4222-8222-222222222222', 'booking', 'import'),
  ('22222222-2222-4222-8222-222222222222', 'booking', 'export')
on conflict (property_id, channel, direction) do nothing;


-- ----------------------------------------------------------------------------
-- 20260827093000_production.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Production hardening (issue #42)
--  - email_log: every transactional email attempt, its status and any error,
--    so the admin can see failed/pending emails (a failed email never blocks a
--    paid reservation).
--  - calendar_syncs.feed_url is already present; this migration only documents
--    that the import URL is now editable from the admin panel.
-- =============================================================================

create type email_status as enum ('sent', 'failed', 'skipped');

create table email_log (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete set null,
  kind           text not null,           -- 'confirmation' | 'payment_failed' | 'internal'
  recipient      text not null,
  status         email_status not null,
  provider_id    text,
  error          text,
  attempts       int not null default 1,
  created_at     timestamptz not null default now()
);
create index email_log_reservation_idx on email_log (reservation_id);
create index email_log_status_idx on email_log (status, created_at desc);

alter table email_log enable row level security;
-- service-role only (server-side), like every other operational table.

comment on column calendar_syncs.feed_url is
  'For direction=import: the Booking.com iCal export URL, editable from /admin/sincronizacion. Falls back to src/content/properties/<slug>.ts when null.';


-- ----------------------------------------------------------------------------
-- 20260827094000_coupons.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Discount codes / promotions (issue #45)
--  - coupons: the rules
--  - reservations gets code + original/discount amounts (server-computed only)
--  - coupon_redemptions: one row per successful use, for per-email limits & audit
-- =============================================================================

create type coupon_kind as enum ('percent', 'fixed');

create table coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,               -- stored UPPERCASE
  kind                coupon_kind not null,
  value               int not null check (value > 0),     -- percent 1..100, or cents
  property_slug       text,                               -- null = todas las propiedades
  starts_on           date,
  ends_on             date,
  min_nights          int not null default 0,
  min_total_cents     bigint not null default 0,
  max_uses            int,                                -- null = ilimitado
  uses_count          int not null default 0,
  max_uses_per_email  int,                                -- null = sin límite por email
  auto_apply          boolean not null default false,     -- promo sin código (fase posterior)
  active              boolean not null default true,
  description         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint coupons_percent_range check (kind <> 'percent' or value between 1 and 100)
);
create index coupons_active_idx on coupons (active) where active;

create trigger coupons_touch before update on coupons
  for each row execute function touch_updated_at();

alter table reservations
  add column coupon_code          text,
  add column original_total_cents bigint,
  add column discount_cents       bigint not null default 0;

create table coupon_redemptions (
  id             uuid primary key default gen_random_uuid(),
  coupon_id      uuid not null references coupons(id) on delete cascade,
  reservation_id uuid not null references reservations(id) on delete cascade,
  guest_email    text,
  discount_cents bigint not null,
  created_at     timestamptz not null default now(),
  unique (coupon_id, reservation_id)
);
create index coupon_redemptions_coupon_idx on coupon_redemptions (coupon_id);
create index coupon_redemptions_email_idx on coupon_redemptions (coupon_id, guest_email);

alter table coupons              enable row level security;
alter table coupon_redemptions   enable row level security;
-- service-role only, like every other operational table.

-- Redefine the hold RPC to accept coupon fields (p_total_cents is the FINAL,
-- discounted total that goes to Stripe). Overload keeps the old signature valid.
create or replace function create_reservation_hold(
  p_property        uuid,
  p_check_in        date,
  p_check_out       date,
  p_guests          int,
  p_total_cents     bigint,
  p_currency        text,
  p_breakdown       jsonb,
  p_hold_minutes    int,
  p_idempotency_key text,
  p_original_total_cents bigint,
  p_discount_cents  bigint,
  p_coupon_code     text
) returns reservations
language plpgsql as $$
declare
  v_existing reservations;
  v_row      reservations;
  v_code     text;
begin
  perform pg_advisory_xact_lock(hashtext(p_property::text));

  if p_idempotency_key is not null then
    select * into v_existing from reservations where idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
  end if;

  if not is_stay_available(p_property, p_check_in, p_check_out) then
    raise exception 'PROPERTY_UNAVAILABLE' using errcode = 'exclusion_violation';
  end if;

  v_code := 'PV-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  insert into reservations (
    property_id, code, status, source, check_in, check_out, guests,
    currency, total_cents, original_total_cents, discount_cents, coupon_code,
    price_breakdown, hold_expires_at, idempotency_key
  ) values (
    p_property, v_code, 'pending', 'direct', p_check_in, p_check_out, p_guests,
    p_currency, p_total_cents, p_original_total_cents, coalesce(p_discount_cents, 0), p_coupon_code,
    coalesce(p_breakdown, '{}'::jsonb),
    now() + make_interval(mins => p_hold_minutes), p_idempotency_key
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Atomically record a redemption and bump the counter. Raises if the total-use
-- limit is exceeded (checked here too, not just in app code).
create or replace function redeem_coupon(
  p_coupon        uuid,
  p_reservation   uuid,
  p_email         text,
  p_discount_cents bigint
) returns void
language plpgsql as $$
declare
  v_row coupons;
begin
  select * into v_row from coupons where id = p_coupon for update;
  if not found then
    raise exception 'COUPON_NOT_FOUND';
  end if;
  if v_row.max_uses is not null and v_row.uses_count >= v_row.max_uses then
    raise exception 'COUPON_EXHAUSTED';
  end if;

  insert into coupon_redemptions (coupon_id, reservation_id, guest_email, discount_cents)
  values (p_coupon, p_reservation, p_email, p_discount_cents)
  on conflict (coupon_id, reservation_id) do nothing;

  update coupons set uses_count = uses_count + 1 where id = p_coupon;
end;
$$;


-- ----------------------------------------------------------------------------
-- 20260827160000_content_overrides.sql
-- ----------------------------------------------------------------------------
-- Light CMS content overrides (issue #50).
-- A key/value document store the admin panel writes to. Keys are namespaced:
--   property:<slug>          -> { metaTitle?, metaDescription?, h1?, tagline?,
--                                 shortIntro?, highlights?, nearby?, faq? }
--   guide:<propertySlug>:<slug> -> { title?, description?, lead?, status?, order? }
-- The application deep-merges these over the static content in src/content.

create table if not exists content_overrides (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

comment on table content_overrides is
  'Admin-editable overrides deep-merged over static site content (issue #50).';


-- ----------------------------------------------------------------------------
-- 20260828120000_coupon_10praetoria10.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #54 — activate the promo code 10PRAETORIA10 (10% off, both properties).
--  - percent 10, property_slug null  → aplica a Javalambre y Valencia
--  - sin caducidad, sin límite de usos ni por email
--  - active = true (estado inicial: activo)
-- Re-runnable: upserts by the unique `code` and re-activates it.
-- =============================================================================

insert into coupons (code, kind, value, property_slug, active, description)
values ('10PRAETORIA10', 'percent', 10, null, true, 'Promoción 10PRAETORIA10 · 10% de descuento (todos los alojamientos)')
on conflict (code) do update
  set kind         = excluded.kind,
      value        = excluded.value,
      property_slug = excluded.property_slug,
      active       = true,
      description  = excluded.description,
      updated_at   = now();


-- ----------------------------------------------------------------------------
-- 20260829100000_intranet_crm.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #56 · Part B (56-B) — management intranet foundation
--   - reservation_source widened to include Airbnb + generic "other"
--   - customers: the CRM entity (manual or reservation-derived)
--   - reservations enriched: customer link, channel detail, guest fiscal data,
--     external locator, manually assigned invoice number, payment state
--   - customer_merges: audit trail for dedup merges
-- =============================================================================

-- ADD VALUE is transaction-safe on PG12+ as long as the value is not used in
-- the same transaction (it is not — rows adopt it only at runtime).
alter type reservation_source add value if not exists 'airbnb';
alter type reservation_source add value if not exists 'other';

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table customers (
  id                       uuid primary key default gen_random_uuid(),
  first_name               text not null default '',
  last_name                text not null default '',
  email                    text,
  phone                    text,
  whatsapp                 text,
  doc_type                 text,   -- 'dni' | 'nie' | 'passport' | 'cif' | 'other'
  doc_number               text,
  address                  text,
  postal_code              text,
  city                     text,
  province                 text,
  country                  text,
  language                 text,   -- 'es' | 'en' | ...
  channel_origin           reservation_source,
  marketing_consent        boolean not null default false,
  marketing_consent_at     timestamptz,
  marketing_consent_source text,
  notes                    text,
  merged_into              uuid references customers(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index customers_email_idx  on customers (lower(email));
create index customers_phone_idx  on customers (phone);
create index customers_doc_idx    on customers (lower(doc_number));
create index customers_name_idx   on customers (lower(last_name), lower(first_name));
create index customers_active_idx on customers (merged_into) where merged_into is null;

create trigger customers_touch before update on customers
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- reservations enrichment
-- ---------------------------------------------------------------------------
alter table reservations
  add column customer_id        uuid references customers(id) on delete set null,
  add column channel_detail     text,          -- free text ("Booking.com", "Airbnb", ...)
  add column guest_doc_type     text,
  add column guest_doc_number   text,
  add column guest_address      text,
  add column guest_postal_code  text,
  add column guest_city         text,
  add column guest_province     text,
  add column guest_country      text,
  add column external_locator   text,          -- Booking/Airbnb confirmation code
  add column invoice_number     text,          -- manually assigned PRAETORIA number
  add column payment_method     text,
  add column payment_state      text not null default 'pending'
    check (payment_state in ('pending', 'partial', 'paid', 'refunded'));

create index reservations_customer_idx    on reservations (customer_id);
create index reservations_invoice_num_idx on reservations (invoice_number);
create index reservations_locator_idx     on reservations (external_locator);

-- ---------------------------------------------------------------------------
-- customer_merges — audit trail (reservations/invoices keep pointing at the
-- surviving id; this records what was folded and when)
-- ---------------------------------------------------------------------------
create table customer_merges (
  id           uuid primary key default gen_random_uuid(),
  primary_id   uuid not null,
  merged_id    uuid not null,
  actor_email  text,
  snapshot     jsonb not null default '{}'::jsonb,  -- the merged record as it was
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: service-role only, like every other operational table (D-005)
-- ---------------------------------------------------------------------------
alter table customers      enable row level security;
alter table customer_merges enable row level security;


-- ----------------------------------------------------------------------------
-- 20260829110000_reservation_external_status.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #56 · 56-C — reservations intranet
--   'external' reservation status: an informational record of a Booking/Airbnb
--   reservation whose dates are already held by its iCal availability block.
--   It does NOT occupy availability (the exclusion constraint and the
--   assert_property_free() trigger both key off status in ('pending','confirmed')),
--   so it can coexist with its own block without a false conflict.
-- =============================================================================

alter type reservation_status add value if not exists 'external';


-- ----------------------------------------------------------------------------
-- 20260829120000_invoicing.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #56 · 56-E — invoicing
--   invoices + invoice_items + per-property invoice_settings.
--   Series are per property (JAV / PALM). Numbers are admin-assignable, not
--   rigidly automatic. Issued invoices are immutable (guard trigger) — an error
--   is corrected by voiding and re-issuing, never by silently editing.
-- =============================================================================

create type invoice_status as enum ('draft', 'issued', 'paid', 'void', 'rectified');

create table invoice_settings (
  property_id  uuid primary key references properties(id) on delete cascade,
  series       text not null,
  tax_rate     numeric not null default 0,
  tax_exempt   boolean not null default true,
  tax_note     text not null default
    'Operación exenta de IVA según el artículo 20.Uno.23º de la Ley 37/1992 (LIVA).',
  updated_at   timestamptz not null default now()
);

create table invoices (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references properties(id) on delete restrict,
  reservation_id   uuid references reservations(id) on delete set null,
  customer_id      uuid references customers(id) on delete set null,
  series           text not null,
  number           text not null,
  status           invoice_status not null default 'draft',
  issue_date       date not null default current_date,

  -- billing party snapshot (frozen at issue time)
  bill_to_name     text not null default '',
  bill_to_tax_id   text,
  bill_to_address  text,
  bill_to_postal   text,
  bill_to_city     text,
  bill_to_province text,
  bill_to_country  text,
  bill_to_email    text,

  subtotal_cents   bigint not null default 0,
  tax_rate         numeric not null default 0,
  tax_cents        bigint not null default 0,
  total_cents      bigint not null default 0,
  tax_exempt       boolean not null default true,
  tax_note         text,
  currency         text not null default 'EUR',
  notes            text,

  issued_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (series, number)
);
create index invoices_property_idx    on invoices (property_id, status);
create index invoices_reservation_idx on invoices (reservation_id);
create index invoices_customer_idx    on invoices (customer_id);

create table invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  position      int not null default 0,
  description   text not null,
  quantity      numeric not null default 1,
  unit_cents    bigint not null default 0,
  amount_cents  bigint not null default 0,
  created_at    timestamptz not null default now()
);
create index invoice_items_invoice_idx on invoice_items (invoice_id, position);

create trigger invoices_touch before update on invoices
  for each row execute function touch_updated_at();
create trigger invoice_settings_touch before update on invoice_settings
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Immutability: once an invoice leaves 'draft' its content is frozen. Status
-- may still advance (issued → paid / void / rectified) and notes may change,
-- but number, dates, party and amounts may not. Deletion is only for drafts.
-- ---------------------------------------------------------------------------
create or replace function invoices_immutability_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'INVOICE_LOCKED: una factura emitida no se elimina; anúlala';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    if new.number       is distinct from old.number
    or new.series       is distinct from old.series
    or new.issue_date   is distinct from old.issue_date
    or new.subtotal_cents is distinct from old.subtotal_cents
    or new.tax_cents    is distinct from old.tax_cents
    or new.total_cents  is distinct from old.total_cents
    or new.tax_rate     is distinct from old.tax_rate
    or new.tax_exempt   is distinct from old.tax_exempt
    or coalesce(new.bill_to_name, '')   is distinct from coalesce(old.bill_to_name, '')
    or coalesce(new.bill_to_tax_id, '') is distinct from coalesce(old.bill_to_tax_id, '') then
      raise exception 'INVOICE_LOCKED: una factura emitida no se modifica; anúlala y emite una nueva';
    end if;
  end if;
  return new;
end;
$$;

create trigger invoices_immutability
  before update or delete on invoices
  for each row execute function invoices_immutability_guard();

-- Block edits to line items of a non-draft invoice.
create or replace function invoice_items_immutability_guard() returns trigger
language plpgsql as $$
declare
  v_status invoice_status;
begin
  select status into v_status from invoices
    where id = coalesce(new.invoice_id, old.invoice_id);
  if v_status is not null and v_status <> 'draft' then
    raise exception 'INVOICE_LOCKED: las líneas de una factura emitida no se modifican';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger invoice_items_immutability
  before insert or update or delete on invoice_items
  for each row execute function invoice_items_immutability_guard();

alter table invoices          enable row level security;
alter table invoice_items     enable row level security;
alter table invoice_settings  enable row level security;


-- ----------------------------------------------------------------------------
-- 20260829130000_daily_rates.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #56 · 56-F — operational calendar: per-day price + min-stay overrides
--   daily_rates layers on top of the rate config (base + seasons + weekend).
--   A row overrides the nightly price and/or the minimum stay for ONE date.
--   Closing/opening dates is done with availability_blocks (already in place),
--   not here — this table is purely about price and stay length.
-- =============================================================================

create table daily_rates (
  property_id   uuid not null references properties(id) on delete cascade,
  date          date not null,
  nightly_cents bigint,   -- null → no price override for this date
  min_nights    int,      -- null → no min-stay override for this date
  updated_at    timestamptz not null default now(),
  primary key (property_id, date),
  constraint daily_rates_something check (nightly_cents is not null or min_nights is not null)
);
create index daily_rates_date_idx on daily_rates (property_id, date);

alter table daily_rates enable row level security;


-- ----------------------------------------------------------------------------
-- 20260829140000_marketing.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #56 · 56-G — marketing: segments, campaigns, unsubscribes
--   Consent + its date/source already live on `customers`. This adds saved
--   segments (a stored filter), campaigns (email / whatsapp / promo, with a
--   materialised recipient list) and an email unsubscribe list.
--   Real bulk sending is NOT wired — a campaign is "prepared" and its recipients
--   listed; the send step stays "Aún no configurado" (config-status: campaigns).
-- =============================================================================

create table segments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  criteria     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  channel           text not null default 'email',   -- 'email' | 'whatsapp' | 'promo'
  status            text not null default 'draft',    -- draft | prepared | sent | cancelled
  segment_id        uuid references segments(id) on delete set null,
  subject           text,
  body              text,
  coupon_code       text,
  consent_required  boolean not null default true,
  prepared_at       timestamptz,
  sent_at           timestamptz,
  recipient_count   int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index campaigns_status_idx on campaigns (status);

create table campaign_recipients (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  customer_id  uuid references customers(id) on delete set null,
  email        text,
  phone        text,
  status       text not null default 'pending',  -- pending | sent | skipped | failed | unsubscribed
  error        text,
  created_at   timestamptz not null default now()
);
create index campaign_recipients_campaign_idx on campaign_recipients (campaign_id);

create table marketing_unsubscribes (
  email            text primary key,
  unsubscribed_at  timestamptz not null default now(),
  source           text
);

create trigger segments_touch before update on segments
  for each row execute function touch_updated_at();
create trigger campaigns_touch before update on campaigns
  for each row execute function touch_updated_at();

alter table segments               enable row level security;
alter table campaigns              enable row level security;
alter table campaign_recipients    enable row level security;
alter table marketing_unsubscribes enable row level security;


-- ----------------------------------------------------------------------------
-- 20260830090000_channel_feeds.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Channel import feed URLs — dedicated, config-only storage (bugfix).
--
-- The Booking/Airbnb iCal URL used to live in calendar_syncs.feed_url, the SAME
-- row that recordSyncRun() upserts on every sync. Any sync that ran without
-- re-passing the URL (the "skipped / not configured" path especially) wiped the
-- saved value to NULL, so the admin fields went blank after a refresh.
--
-- The URL is CONFIGURATION (user-owned, authoritative). calendar_syncs stays as
-- SYNC TELEMETRY only. They must never share a write path again.
-- =============================================================================

create table channel_feeds (
  property_id  uuid not null references properties(id) on delete cascade,
  channel      text not null,            -- 'booking' | 'airbnb'
  url          text not null check (url <> ''),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (property_id, channel)
);

-- Preserve anything already saved in the old location.
insert into channel_feeds (property_id, channel, url)
select property_id, channel, feed_url
from calendar_syncs
where direction = 'import'
  and feed_url is not null
  and feed_url <> ''
on conflict (property_id, channel) do nothing;

create trigger channel_feeds_touch before update on channel_feeds
  for each row execute function touch_updated_at();

alter table channel_feeds enable row level security;
-- Service-role only (like every other operational table, D-005).

-- calendar_syncs.feed_url is now vestigial telemetry; recordSyncRun() no longer
-- writes it. Leave the column (harmless) so getSyncRows() keeps mapping.


-- ----------------------------------------------------------------------------
-- 20260831120000_availability_rpc.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Availability RPC hardening + deploy guarantee (build failure fix)
--
-- Root cause of the "public.property_busy_ranges is not found in the Supabase
-- schema cache" error: the function was defined in 20260827091000_booking_rpc.sql
-- but that migration set was never applied to the production database. This
-- migration is idempotent (`create or replace`), so re-running the whole set is
-- safe, and it also:
--   * pins search_path and marks the read RPCs SECURITY DEFINER so the public
--     availability query works through the publishable/anon key (the base tables
--     are RLS-locked with no policies);
--   * grants EXECUTE on the two PII-free read functions to anon/authenticated,
--     and REVOKEs the mutating RPCs from PUBLIC (service_role only);
--   * asks PostgREST to reload its schema cache immediately.
--
-- Availability semantics (unchanged, restated explicitly):
--   A stay is the half-open night range [check_in, check_out).
--   check_in is inclusive, check_out is exclusive.
--   21 Sep -> 24 Sep occupies the nights of the 21st, 22nd and 23rd; another
--   guest may check in on the 24th (the ranges [21,24) and [24,27) do not
--   overlap under `&&`).
--   Busy sources are consolidated without double-counting or phantom nights:
--     - reservations with status in ('pending','confirmed')  -> [check_in, check_out)
--       ('external' is excluded: a Booking/Airbnb reservation row is
--        informational and its dates are already held by its imported iCal
--        block; 'cancelled' / 'expired' never occupy)
--     - every availability_blocks row (manual closures + imported
--       iCal/Booking/Airbnb events, any source) -> [start_date, end_date)
-- =============================================================================

-- --- property_busy_ranges ----------------------------------------------------
create or replace function public.property_busy_ranges(
  p_property uuid,
  p_from     date,
  p_to       date
)
returns table (start_date date, end_date date, kind text)
language sql
stable
parallel safe
security definer
set search_path = public, pg_temp
as $$
  select lower(r.stay)::date, upper(r.stay)::date, 'reservation'::text
  from public.reservations r
  where r.property_id = p_property
    and r.status in ('pending', 'confirmed')
    and r.stay && daterange(p_from, p_to, '[)')
  union all
  select lower(b.stay)::date, upper(b.stay)::date, 'block'::text
  from public.availability_blocks b
  where b.property_id = p_property
    and b.stay && daterange(p_from, p_to, '[)');
$$;

comment on function public.property_busy_ranges(uuid, date, date) is
  'Half-open [check_in, check_out) busy ranges for one property over [p_from, p_to). '
  'Consolidates occupying reservations (pending/confirmed) and every availability '
  'block (manual + imported iCal). PII-free; safe to call with the publishable key.';

-- --- is_stay_available ------------------------------------------------------
create or replace function public.is_stay_available(
  p_property  uuid,
  p_check_in  date,
  p_check_out date
)
returns boolean
language sql
stable
parallel safe
security definer
set search_path = public, pg_temp
as $$
  select p_check_out > p_check_in
     and not exists (
       select 1 from public.reservations r
       where r.property_id = p_property
         and r.status in ('pending', 'confirmed')
         and r.stay && daterange(p_check_in, p_check_out, '[)')
     )
     and not exists (
       select 1 from public.availability_blocks b
       where b.property_id = p_property
         and b.stay && daterange(p_check_in, p_check_out, '[)')
     );
$$;

comment on function public.is_stay_available(uuid, date, date) is
  'True when [p_check_in, p_check_out) does not overlap any occupying reservation '
  'or availability block on the property. Touching ranges do not overlap, so a '
  'checkout day can be another guest''s check-in day.';

-- --- permissions -----------------------------------------------------------
-- Read RPCs: expose to the public availability query. SECURITY DEFINER lets an
-- anon caller past the RLS lock on the base tables; the functions return only
-- date ranges + a 'reservation'/'block' label, never guest/price data.
revoke all on function public.property_busy_ranges(uuid, date, date) from public;
revoke all on function public.is_stay_available(uuid, date, date)   from public;
grant execute on function public.property_busy_ranges(uuid, date, date) to anon, authenticated, service_role;
grant execute on function public.is_stay_available(uuid, date, date)   to anon, authenticated, service_role;

-- Mutating RPCs: server-side only (service role / secret key). Never callable
-- with the publishable/anon key.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.create_reservation_hold(uuid, date, date, integer, bigint, text, jsonb, integer, text)',
    'public.create_reservation_hold(uuid, date, date, integer, bigint, text, jsonb, integer, text, bigint, bigint, text)',
    'public.confirm_reservation(uuid, text)',
    'public.expire_stale_holds()',
    'public.redeem_coupon(uuid, uuid, text, bigint)'
  ]
  loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    exception when undefined_function then
      -- a signature that does not exist in this database yet — skip it
      null;
    end;
  end loop;
end $$;

-- --- refresh the PostgREST schema cache -----------------------------------
-- So `supabase.rpc('property_busy_ranges', ...)` resolves immediately after
-- this migration is applied, without waiting for the periodic reload.
notify pgrst, 'reload schema';


-- ----------------------------------------------------------------------------
-- 20260831130000_rls_hardening.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #75 — Supabase security hardening: RLS, least privilege, role boundaries
-- =============================================================================
-- Idempotent. Safe to re-run. Consolidates the security posture that was set
-- table-by-table across earlier migrations and closes the gaps:
--
--   * every application table has RLS ENABLED *and* FORCED (RLS applies to the
--     table owner too, so a stray owner-role connection cannot read around it);
--   * `content_overrides` — the one table that never had RLS — is covered;
--   * the anon and authenticated roles hold NO privileges on any base table
--     (all data access is server-side through the secret/service_role key,
--     behind the app's own admin auth — decision D-005);
--   * default privileges for future objects in `public` are stripped from
--     PUBLIC/anon/authenticated, so a later `create table` is locked by default;
--   * the two PII-free availability read functions (D-021) are tightened to
--     service_role only — nothing connects with the anon key today
--     (`supabaseServer()` is reserved for issue #65 and currently unused).
--
-- Model (unchanged): RLS enabled + zero permissive policies => only a
-- BYPASSRLS role (service_role / the secret key) can touch the table. The admin
-- UI runs server-side with that key after verifying its own session.
-- =============================================================================

-- --- 1. content_overrides: the missing RLS -----------------------------------
alter table content_overrides enable row level security;

-- --- 2. Enable + FORCE RLS on every application table ------------------------
do $$
declare
  t text;
  app_tables text[] := array[
    'properties', 'property_settings', 'rate_rules', 'reservations',
    'availability_blocks', 'payments', 'calendar_syncs', 'webhook_events',
    'admin_audit_log', 'email_log', 'coupons', 'coupon_redemptions',
    'content_overrides', 'customers', 'customer_merges', 'invoice_settings',
    'invoices', 'invoice_items', 'daily_rates', 'segments', 'campaigns',
    'campaign_recipients', 'marketing_unsubscribes', 'channel_feeds'
  ];
begin
  foreach t in array app_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skip %, not present', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force  row level security', t);
    -- No role but a BYPASSRLS role should even have column privileges.
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant  all on public.%I to service_role', t);
  end loop;
end $$;

-- --- 3. Lock down future objects in the public schema -----------------------
alter default privileges in schema public revoke all on tables    from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

-- Schema usage: anon/authenticated may resolve names (needed for PostgREST)
-- but that grants nothing on the objects themselves after the revokes above.
grant usage on schema public to anon, authenticated;

-- --- 4. Tighten the availability read functions to service_role only --------
-- D-021 granted these to anon for a client path that no longer exists. If a
-- public anon read is ever reintroduced, add the grant back in that migration.
do $$
begin
  execute 'revoke all on function public.property_busy_ranges(uuid, date, date) from anon, authenticated';
  execute 'revoke all on function public.is_stay_available(uuid, date, date)   from anon, authenticated';
exception when undefined_function then
  raise notice 'availability functions not present yet — skipping';
end $$;

-- --- 5. Make sure the mutating RPCs never drifted open ---------------------
do $$
declare
  fn text;
  mutating text[] := array[
    'public.create_reservation_hold(uuid, date, date, integer, integer, text, text, text, text)',
    'public.create_reservation_hold(uuid, date, date, integer, integer, text, text, text, text, text, text, text)',
    'public.confirm_reservation(uuid, text)',
    'public.expire_stale_holds()',
    'public.redeem_coupon(text, uuid, uuid)'
  ];
begin
  foreach fn in array mutating loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    exception when undefined_function then
      raise notice 'skip %, not present', fn;
    end;
  end loop;
end $$;

-- --- 6. Refresh PostgREST's schema cache -----------------------------------
notify pgrst, 'reload schema';


-- ----------------------------------------------------------------------------
-- 20260901120000_jobs.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #76 — durable jobs + transactional outbox
-- =============================================================================
-- One table backs every kind of critical async work (transactional emails, iCal
-- sync, hold expiry, …). Business code writes a `jobs` row in the same logical
-- operation as the change that needs it, so a crash cannot lose the intention.
-- Workers lease jobs (`claim_jobs`, FOR UPDATE SKIP LOCKED) and run them
-- idempotently, so running two workers never double-processes a job.
--
-- Idempotent. Safe to re-run.
-- =============================================================================

create table if not exists jobs (
  id               uuid primary key default gen_random_uuid(),
  type             text not null,
  payload          jsonb not null default '{}'::jsonb,
  -- de-dupes an intention; a second enqueue with the same key is a no-op
  idempotency_key  text unique,
  status           text not null default 'queued'
                     check (status in ('queued','running','retrying','succeeded','dead_letter','cancelled')),
  attempts         int not null default 0,
  max_attempts     int not null default 5,
  run_after        timestamptz not null default now(),
  locked_at        timestamptz,
  locked_by        text,
  last_error       text,
  result           jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  succeeded_at     timestamptz,
  dead_lettered_at timestamptz
);

-- Worker claim path: due, not-terminal jobs, oldest run_after first.
create index if not exists jobs_claim_idx
  on jobs (run_after)
  where status in ('queued','retrying','running');

create index if not exists jobs_status_created_idx on jobs (status, created_at desc);
create index if not exists jobs_type_idx on jobs (type);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'jobs_touch') then
    create trigger jobs_touch before update on jobs
      for each row execute function touch_updated_at();
  end if;
end $$;

-- --- Atomic batch lease -----------------------------------------------------
create or replace function claim_jobs(p_worker text, p_batch int, p_lease_seconds int)
returns setof jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select j.id
    from jobs j
    where j.run_after <= now()
      and (
        j.status in ('queued','retrying')
        or (j.status = 'running'
            and j.locked_at is not null
            and j.locked_at < now() - make_interval(secs => greatest(p_lease_seconds, 1)))
      )
    order by j.run_after
    limit greatest(coalesce(p_batch, 0), 0)
    for update skip locked
  )
  update jobs j
     set status    = 'running',
         attempts  = j.attempts + 1,
         locked_at = now(),
         locked_by = p_worker,
         updated_at = now()
    from due
   where j.id = due.id
  returning j.*;
end;
$$;

-- --- Least privilege (matches issue #75) ----------------------------------
alter table jobs enable row level security;
alter table jobs force  row level security;
revoke all on jobs from anon, authenticated;
grant  all on jobs to service_role;

revoke all on function claim_jobs(text, int, int) from public, anon, authenticated;
grant execute on function claim_jobs(text, int, int) to service_role;


-- ----------------------------------------------------------------------------
-- 20260902120000_guest_comms.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #69 — guest communications lifecycle
-- =============================================================================
-- Transactional messages scheduled relative to a reservation's stay
-- (pre-arrival, check-in info, check-out reminder, review request). One row per
-- (reservation, kind); the planner reconciles it, so a date change re-plans and
-- a cancellation retires the pending rows without duplicates.
--
-- These are NOT marketing — no consent gate; they are needed to execute the
-- booking. Marketing lives in segments/campaigns and is consent-gated.
--
-- Idempotent. Safe to re-run.
-- =============================================================================

create table if not exists scheduled_messages (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  kind           text not null
                   check (kind in ('pre_arrival','checkin_info','checkout_reminder','review_request')),
  send_at        timestamptz not null,
  status         text not null default 'planned'
                   check (status in ('planned','queued','sent','failed','cancelled','skipped')),
  attempts       int not null default 0,
  sent_at        timestamptz,
  last_error     text,
  provider_id    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (reservation_id, kind)
);

create index if not exists scheduled_messages_due_idx
  on scheduled_messages (send_at)
  where status = 'planned';

create index if not exists scheduled_messages_reservation_idx
  on scheduled_messages (reservation_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'scheduled_messages_touch') then
    create trigger scheduled_messages_touch before update on scheduled_messages
      for each row execute function touch_updated_at();
  end if;
end $$;

alter table scheduled_messages enable row level security;
alter table scheduled_messages force  row level security;
revoke all on scheduled_messages from anon, authenticated;
grant  all on scheduled_messages to service_role;


-- ----------------------------------------------------------------------------
-- 20260902130000_admin_users.sql
-- ----------------------------------------------------------------------------
-- =============================================================================
-- Issue #65 — admin multi-user: per-user roles, revocable sessions, MFA flag
-- =============================================================================
-- One row per admin operator. `id` equals the Supabase Auth user id once the
-- owner enables Auth on the project; until then the password login uses the
-- first row (seeded from ADMIN_EMAILS) or a synthetic context from ADMIN_ROLE.
--
--   role                 admin | gestion | lectura  (capability matrix in code)
--   active               false = locked out immediately, even with a live JWT
--   sessions_valid_from  bump to now() to revoke every existing session
--   mfa_required         sensitive capabilities then need an AAL2 session
--   invite_token_hash    sha256 of the pending invite token; null once accepted
--
-- RLS forced, service_role only — the admin API reads/writes through the secret
-- key behind the session gate (D-005).
--
-- Idempotent. Safe to re-run.
-- =============================================================================

create table if not exists admin_users (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null unique,
  full_name            text,
  role                 text not null default 'lectura'
                         check (role in ('admin','gestion','lectura')),
  active               boolean not null default true,
  sessions_valid_from  timestamptz not null default now(),
  mfa_required         boolean not null default false,
  invited_by           uuid,
  invite_token_hash    text,
  invite_expires_at    timestamptz,
  last_seen_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists admin_users_email_idx on admin_users (lower(email));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'admin_users_touch') then
    create trigger admin_users_touch before update on admin_users
      for each row execute function touch_updated_at();
  end if;
end $$;

alter table admin_users enable row level security;
alter table admin_users force  row level security;
revoke all on admin_users from anon, authenticated;
grant  all on admin_users to service_role;

