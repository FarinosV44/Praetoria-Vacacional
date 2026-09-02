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
