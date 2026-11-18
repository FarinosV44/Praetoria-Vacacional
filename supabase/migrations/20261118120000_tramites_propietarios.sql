-- =============================================================================
-- Issues #173–#178 — «Servicios a propietarios»: gestión de trámites de
-- viviendas de uso turístico para clientes terceros.
--
-- Dominio SEPARADO de nuestras reservas y huéspedes (#56, #72): ninguna tabla de
-- aquí referencia reservations / customers / travellers.
--
-- Seguridad (#176):
--   · RLS activada en todas las tablas.
--   · El rol `authenticated` (propietario con sesión de Supabase Auth) SOLO
--     puede LEER las filas de las cuentas de las que es miembro. No tiene
--     permisos de escritura: todas las escrituras las hace el servidor con la
--     clave secreta, después de comprobar la sesión y la pertenencia.
--   · `anon` no tiene acceso a nada.
--   · Notas internas, auditoría y eventos internos del expediente quedan fuera
--     del alcance del propietario.
--   · Bucket privado `owner-documents`; la ruta empieza por el id de la cuenta y
--     la política de storage solo deja descargar a sus miembros.
-- =============================================================================

-- ---------------------------------------------------------------- tablas ----

create table if not exists owner_accounts (
  id                    uuid primary key default gen_random_uuid(),
  kind                  text not null check (kind in ('particular','empresa')),
  legal_name            text not null check (length(legal_name) between 2 and 160),
  tax_id                text not null check (length(tax_id) between 5 and 20),
  contact_name          text not null,
  email                 text not null,
  phone                 text not null,
  billing_address       text not null,
  status                text not null default 'pendiente_verificacion'
                          check (status in ('pendiente_verificacion','activo','suspendido','baja')),
  marketing_opt_in      boolean not null default false,
  stripe_customer_id    text,
  reservation_credits   integer not null default 0 check (reservation_credits >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists owner_accounts_email_idx on owner_accounts (lower(email));

create table if not exists owner_internal_notes (
  account_id  uuid primary key references owner_accounts(id) on delete cascade,
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

create table if not exists owner_memberships (
  account_id  uuid not null references owner_accounts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'titular' check (role in ('titular','colaborador')),
  created_at  timestamptz not null default now(),
  primary key (account_id, user_id)
);
create index if not exists owner_memberships_user_idx on owner_memberships (user_id);

create table if not exists managed_properties (
  id                        uuid primary key default gen_random_uuid(),
  account_id                uuid not null references owner_accounts(id) on delete cascade,
  alias                     text not null check (length(alias) between 1 and 80),
  street                    text not null,
  postal_code               text not null check (postal_code ~ '^[0-9]{5}$'),
  municipality              text not null,
  province                  text not null,
  cadastral_ref             text,
  tourism_registry_number   text,
  has_tourism_registry      text not null default 'no_se' check (has_tourism_registry in ('si','no','no_se')),
  has_ses_alta              text not null default 'no_se' check (has_ses_alta in ('si','no','no_se')),
  ses_establishment_code    text,
  platforms                 text[] not null default '{}',
  max_guests                integer check (max_guests is null or max_guests between 1 and 60),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index if not exists managed_properties_account_idx on managed_properties (account_id);

create table if not exists service_orders (
  id                          uuid primary key default gen_random_uuid(),
  reference                   text not null unique,
  account_id                  uuid not null references owner_accounts(id) on delete restrict,
  plan_code                   text not null check (plan_code in ('por_uso','gestion_continua')),
  catalog_version             text not null,
  vat_rate_percent            numeric(5,2) not null,
  lines                       jsonb not null,
  net_cents                   integer not null check (net_cents >= 0),
  vat_cents                   integer not null check (vat_cents >= 0),
  total_cents                 integer not null check (total_cents = net_cents + vat_cents),
  status                      text not null
                                check (status in ('pendiente_verificacion','pendiente_pago','pagado','solicitud_especial','cancelado')),
  acceptance                  jsonb not null,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  invoice_url                 text,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists service_orders_account_idx on service_orders (account_id);

create table if not exists reservation_reports (
  id                          uuid primary key default gen_random_uuid(),
  account_id                  uuid not null references owner_accounts(id) on delete cascade,
  property_id                 uuid not null references managed_properties(id) on delete cascade,
  external_ref                text,
  channel                     text not null,
  booked_at                   timestamptz not null,
  check_in                    date not null,
  check_out                   date not null check (check_out > check_in),
  travellers                  integer not null check (travellers between 1 and 60),
  cancelled_at                timestamptz,
  reported_at                 timestamptz not null default now(),
  -- AES-256-GCM en la aplicación (TRAMITES_DATA_KEY): nunca en claro aquí.
  traveller_data_enc          text,
  traveller_data_at           timestamptz,
  communicated_reserva_at     timestamptz,
  communicated_anulacion_at   timestamptz,
  communicated_entrada_at     timestamptz,
  billing                     text not null default 'pendiente' check (billing in ('saldo','cuota','pendiente')),
  created_at                  timestamptz not null default now()
);
create index if not exists reservation_reports_account_idx on reservation_reports (account_id, check_in desc);

create table if not exists filings (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique,
  account_id              uuid not null references owner_accounts(id) on delete cascade,
  property_id             uuid not null references managed_properties(id) on delete cascade,
  order_id                uuid references service_orders(id) on delete set null,
  reservation_report_id   uuid references reservation_reports(id) on delete set null,
  service_code            text not null,
  status                  text not null check (status in (
                            'solicitado','pendiente_documentacion','en_revision','listo_para_presentar',
                            'presentado','subsanacion','finalizado','incidencia','suspendido','cancelado')),
  title                   text not null,
  due_at                  timestamptz,
  late                    boolean not null default false,
  assignee_email          text,
  checklist               jsonb not null default '[]',
  requested_documents     text[] not null default '{}',
  submitted_at            timestamptz,
  submission_channel      text check (submission_channel is null or submission_channel in
                            ('ses_hospedajes_web','ses_hospedajes_fichero','registro_autonomico','otro')),
  submission_ref          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  closed_at               timestamptz,
  -- Presentado implica fecha y canal (no basta con generar un fichero).
  constraint filings_submitted_consistent check (
    status not in ('presentado','finalizado') or (submitted_at is not null and submission_channel is not null)
    or service_code = 'revision_historica'
  )
);
create index if not exists filings_account_idx on filings (account_id);
create index if not exists filings_open_due_idx on filings (due_at) where status not in ('finalizado','cancelado');

-- Historial inmutable del expediente.
create table if not exists filing_events (
  id                uuid primary key default gen_random_uuid(),
  filing_id         uuid not null references filings(id) on delete cascade,
  account_id        uuid not null references owner_accounts(id) on delete cascade,
  at                timestamptz not null default now(),
  actor             jsonb not null,
  kind              text not null check (kind in ('creado','estado','nota','documento','solicitud','presentacion','mensaje')),
  from_status       text,
  to_status         text,
  message           text,
  visible_to_owner  boolean not null default true
);
create index if not exists filing_events_filing_idx on filing_events (filing_id, at);

create table if not exists owner_documents (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references owner_accounts(id) on delete cascade,
  property_id         uuid references managed_properties(id) on delete set null,
  filing_id           uuid references filings(id) on delete set null,
  kind                text not null check (kind in ('autorizacion_representacion','dni_titular','escritura_o_nota_simple',
                        'registro_turistico','contrato_o_reserva','justificante_oficial','otro')),
  filename            text not null,
  mime                text not null check (mime in ('application/pdf','image/png','image/jpeg')),
  size_bytes          integer not null check (size_bytes between 1 and 10485760),
  storage_key         text not null unique,
  sha256              text not null,
  status              text not null default 'recibido' check (status in ('recibido','validado','rechazado')),
  is_official_proof   boolean not null default false,
  uploaded_by         text not null check (uploaded_by in ('owner','admin','system')),
  review_note         text,
  created_at          timestamptz not null default now(),
  -- La clave de almacenamiento empieza por la cuenta: base de la política de storage.
  constraint owner_documents_key_prefix check (storage_key like account_id::text || '/%')
);
create index if not exists owner_documents_account_idx on owner_documents (account_id);

create table if not exists client_messages (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references owner_accounts(id) on delete cascade,
  filing_id         uuid references filings(id) on delete set null,
  author            text not null check (author in ('owner','admin')),
  author_label      text not null,
  body              text not null check (length(body) between 1 and 4000),
  created_at        timestamptz not null default now(),
  read_by_owner_at  timestamptz,
  read_by_admin_at  timestamptz
);
create index if not exists client_messages_account_idx on client_messages (account_id, created_at);

create table if not exists service_subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  account_id               uuid not null references owner_accounts(id) on delete cascade,
  property_id              uuid not null references managed_properties(id) on delete cascade,
  plan_code                text not null check (plan_code in ('por_uso','gestion_continua')),
  status                   text not null check (status in ('pendiente','activa','impagada','cancelada')),
  stripe_subscription_id   text unique,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now()
);

create table if not exists tramites_audit (
  id           uuid primary key default gen_random_uuid(),
  at           timestamptz not null default now(),
  actor        jsonb not null,
  action       text not null,
  account_id   uuid references owner_accounts(id) on delete set null,
  target_type  text not null,
  target_id    text,
  meta         jsonb not null default '{}'
);
create index if not exists tramites_audit_account_idx on tramites_audit (account_id, at desc);

create table if not exists service_price_catalog (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  catalog     jsonb not null,
  created_by  text not null,
  created_at  timestamptz not null default now()
);

-- Inmutabilidad: el historial, los justificantes oficiales y la auditoría no se editan.
create or replace function public.tramites_forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'El historial de % no se puede modificar', tg_table_name;
end $$;

drop trigger if exists filing_events_immutable on filing_events;
create trigger filing_events_immutable before update or delete on filing_events
  for each row execute function public.tramites_forbid_mutation();

drop trigger if exists tramites_audit_immutable on tramites_audit;
create trigger tramites_audit_immutable before update or delete on tramites_audit
  for each row execute function public.tramites_forbid_mutation();

create or replace function public.tramites_protect_proof() returns trigger
language plpgsql as $$
begin
  if old.is_official_proof then
    if tg_op = 'DELETE' then
      raise exception 'Un justificante oficial no se puede borrar';
    end if;
    if new.storage_key <> old.storage_key or new.sha256 <> old.sha256 or new.is_official_proof <> old.is_official_proof then
      raise exception 'Un justificante oficial no se puede sustituir';
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists owner_documents_proof_guard on owner_documents;
create trigger owner_documents_proof_guard before update or delete on owner_documents
  for each row execute function public.tramites_protect_proof();

-- Saldo de reservas: ajuste atómico que nunca deja el saldo en negativo.
create or replace function public.tramites_adjust_credits(p_account uuid, p_delta integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update owner_accounts
     set reservation_credits = greatest(0, reservation_credits + p_delta),
         updated_at = now()
   where id = p_account
  returning reservation_credits;
$$;

-- ---------------------------------------------------------- pertenencia ----

-- SECURITY DEFINER para que las políticas no se llamen a sí mismas en bucle.
create or replace function public.tramites_is_member(p_account uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from owner_memberships m
     where m.account_id = p_account and m.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------- RLS ----

do $$
declare t text;
begin
  foreach t in array array[
    'owner_accounts','owner_internal_notes','owner_memberships','managed_properties','service_orders',
    'reservation_reports','filings','filing_events','owner_documents','client_messages',
    'service_subscriptions','tramites_audit','service_price_catalog'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- El propietario solo LEE. Sin políticas de insert/update/delete para él.
grant select on owner_accounts, owner_memberships, managed_properties, service_orders,
                reservation_reports, filings, filing_events, owner_documents, client_messages,
                service_subscriptions to authenticated;

drop policy if exists owner_read on owner_accounts;
create policy owner_read on owner_accounts for select to authenticated
  using (public.tramites_is_member(id));

drop policy if exists owner_read on owner_memberships;
create policy owner_read on owner_memberships for select to authenticated
  using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['managed_properties','service_orders','reservation_reports','filings',
                           'owner_documents','client_messages','service_subscriptions'] loop
    execute format('drop policy if exists owner_read on public.%I', t);
    execute format(
      'create policy owner_read on public.%I for select to authenticated using (public.tramites_is_member(account_id))', t);
  end loop;
end $$;

-- Los eventos internos (notas del equipo) no se enseñan al propietario.
drop policy if exists owner_read on filing_events;
create policy owner_read on filing_events for select to authenticated
  using (visible_to_owner and public.tramites_is_member(account_id));

-- owner_internal_notes, tramites_audit y service_price_catalog: sin política
-- para `authenticated` → denegado. Solo el servidor (service_role).

revoke all on function public.tramites_adjust_credits(uuid, integer) from public, anon, authenticated;
grant execute on function public.tramites_adjust_credits(uuid, integer) to service_role;
revoke all on function public.tramites_is_member(uuid) from public, anon;
grant execute on function public.tramites_is_member(uuid) to authenticated, service_role;

-- --------------------------------------------------------------- storage ----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('owner-documents', 'owner-documents', false, 10485760,
        array['application/pdf','image/png','image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Descarga: solo miembros de la cuenta cuyo id es la primera carpeta de la ruta.
drop policy if exists owner_documents_read on storage.objects;
create policy owner_documents_read on storage.objects for select to authenticated
  using (
    bucket_id = 'owner-documents'
    and public.tramites_is_member(((storage.foldername(name))[1])::uuid)
  );
-- Sin políticas de escritura para `authenticated`: sube el servidor tras validar.

-- --------------------------------------------------- rol de gestor (RBAC) ----

-- Nuevo rol interno «tramites» (gestor de trámites) para el panel (#177).
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.admin_users'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%role%';
  if c is not null then
    execute format('alter table public.admin_users drop constraint %I', c);
  end if;
  alter table public.admin_users
    add constraint admin_users_role_check check (role in ('admin','gestion','tramites','lectura'));
exception when undefined_table then
  null; -- instalaciones sin #65
end $$;
