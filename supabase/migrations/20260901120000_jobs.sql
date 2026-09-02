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
