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
