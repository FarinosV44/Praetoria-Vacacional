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
