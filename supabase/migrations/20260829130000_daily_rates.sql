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
