-- =============================================================================
-- Issue #72 — digital check-in + Spain traveller registry (SES.HOSPEDAJES)
-- =============================================================================
-- RD 933/2021: lodging businesses collect traveller identity + stay data and
-- transmit it to the Ministerio del Interior within 24 h. This table holds one
-- row per traveller of a reservation; `sent_at` / `sent_ref` record the
-- transmission once SES.HOSPEDAJES credentials are configured.
--
-- RLS forced, service_role only. Idempotent.
-- =============================================================================

create table if not exists traveller_registrations (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references reservations(id) on delete cascade,
  full_name       text not null,
  first_surname   text,
  second_surname  text,
  doc_type        text not null check (doc_type in ('DNI','NIE','PAS','OTRO')),
  doc_number      text not null,
  doc_support     text,
  nationality     text not null default 'ESP',
  birth_date      date,
  gender          text check (gender in ('H','M','O')),
  phone           text,
  email           text,
  address_country text default 'ESP',
  address_line    text,
  municipality    text,
  province        text,
  postal_code     text,
  kinship         text,              -- parentesco, for minors
  is_lead         boolean not null default false,
  payment_method  text,              -- required by RD 933/2021
  signed_at       timestamptz,
  sent_at         timestamptz,
  sent_ref        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists traveller_registrations_reservation_idx
  on traveller_registrations (reservation_id);
create index if not exists traveller_registrations_unsent_idx
  on traveller_registrations (created_at) where sent_at is null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'traveller_registrations_touch') then
    create trigger traveller_registrations_touch before update on traveller_registrations
      for each row execute function touch_updated_at();
  end if;
end $$;

alter table traveller_registrations enable row level security;
alter table traveller_registrations force  row level security;
revoke all on traveller_registrations from anon, authenticated;
grant  all on traveller_registrations to service_role;
