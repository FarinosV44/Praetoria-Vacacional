-- =============================================================================
-- Issues #70 + #71 — housekeeping / turnovers and maintenance / incidents
-- =============================================================================
-- One task board for everything the owner has to *do* at a property:
--   kind      turnover | cleaning | maintenance | incident
--   status    open | scheduled | in_progress | done | cancelled
--   priority  low | normal | high | urgent
--   photos    text[] of media URLs (paste from the media library, #81)
--   cost_cents / reservation_id are used by maintenance / turnovers respectively
--
-- Turnover tasks are auto-created for each confirmed reservation's checkout by
-- `reconcileTurnovers` (cron /api/cron/turnovers).
--
-- RLS forced, service_role only. Idempotent.
-- =============================================================================

create table if not exists operations_tasks (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references properties(id) on delete cascade,
  kind           text not null check (kind in ('turnover','cleaning','maintenance','incident')),
  title          text not null,
  description    text not null default '',
  status         text not null default 'open'
                   check (status in ('open','scheduled','in_progress','done','cancelled')),
  priority       text not null default 'normal'
                   check (priority in ('low','normal','high','urgent')),
  due_date       date,
  assignee       text,
  cost_cents     bigint,
  reservation_id uuid references reservations(id) on delete set null,
  photos         text[] not null default '{}',
  created_by     uuid,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists operations_tasks_board_idx on operations_tasks (status, due_date);
create index if not exists operations_tasks_property_idx on operations_tasks (property_id);
-- one auto turnover per reservation
create unique index if not exists operations_tasks_turnover_uniq
  on operations_tasks (reservation_id) where kind = 'turnover';

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'operations_tasks_touch') then
    create trigger operations_tasks_touch before update on operations_tasks
      for each row execute function touch_updated_at();
  end if;
end $$;

alter table operations_tasks enable row level security;
alter table operations_tasks force  row level security;
revoke all on operations_tasks from anon, authenticated;
grant  all on operations_tasks to service_role;
