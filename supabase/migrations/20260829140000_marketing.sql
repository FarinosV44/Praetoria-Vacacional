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
