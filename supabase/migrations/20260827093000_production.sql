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
