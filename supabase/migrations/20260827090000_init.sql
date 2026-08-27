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
