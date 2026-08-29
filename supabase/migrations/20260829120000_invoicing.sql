-- =============================================================================
-- Issue #56 · 56-E — invoicing
--   invoices + invoice_items + per-property invoice_settings.
--   Series are per property (JAV / PALM). Numbers are admin-assignable, not
--   rigidly automatic. Issued invoices are immutable (guard trigger) — an error
--   is corrected by voiding and re-issuing, never by silently editing.
-- =============================================================================

create type invoice_status as enum ('draft', 'issued', 'paid', 'void', 'rectified');

create table invoice_settings (
  property_id  uuid primary key references properties(id) on delete cascade,
  series       text not null,
  tax_rate     numeric not null default 0,
  tax_exempt   boolean not null default true,
  tax_note     text not null default
    'Operación exenta de IVA según el artículo 20.Uno.23º de la Ley 37/1992 (LIVA).',
  updated_at   timestamptz not null default now()
);

create table invoices (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references properties(id) on delete restrict,
  reservation_id   uuid references reservations(id) on delete set null,
  customer_id      uuid references customers(id) on delete set null,
  series           text not null,
  number           text not null,
  status           invoice_status not null default 'draft',
  issue_date       date not null default current_date,

  -- billing party snapshot (frozen at issue time)
  bill_to_name     text not null default '',
  bill_to_tax_id   text,
  bill_to_address  text,
  bill_to_postal   text,
  bill_to_city     text,
  bill_to_province text,
  bill_to_country  text,
  bill_to_email    text,

  subtotal_cents   bigint not null default 0,
  tax_rate         numeric not null default 0,
  tax_cents        bigint not null default 0,
  total_cents      bigint not null default 0,
  tax_exempt       boolean not null default true,
  tax_note         text,
  currency         text not null default 'EUR',
  notes            text,

  issued_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (series, number)
);
create index invoices_property_idx    on invoices (property_id, status);
create index invoices_reservation_idx on invoices (reservation_id);
create index invoices_customer_idx    on invoices (customer_id);

create table invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  position      int not null default 0,
  description   text not null,
  quantity      numeric not null default 1,
  unit_cents    bigint not null default 0,
  amount_cents  bigint not null default 0,
  created_at    timestamptz not null default now()
);
create index invoice_items_invoice_idx on invoice_items (invoice_id, position);

create trigger invoices_touch before update on invoices
  for each row execute function touch_updated_at();
create trigger invoice_settings_touch before update on invoice_settings
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Immutability: once an invoice leaves 'draft' its content is frozen. Status
-- may still advance (issued → paid / void / rectified) and notes may change,
-- but number, dates, party and amounts may not. Deletion is only for drafts.
-- ---------------------------------------------------------------------------
create or replace function invoices_immutability_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'INVOICE_LOCKED: una factura emitida no se elimina; anúlala';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    if new.number       is distinct from old.number
    or new.series       is distinct from old.series
    or new.issue_date   is distinct from old.issue_date
    or new.subtotal_cents is distinct from old.subtotal_cents
    or new.tax_cents    is distinct from old.tax_cents
    or new.total_cents  is distinct from old.total_cents
    or new.tax_rate     is distinct from old.tax_rate
    or new.tax_exempt   is distinct from old.tax_exempt
    or coalesce(new.bill_to_name, '')   is distinct from coalesce(old.bill_to_name, '')
    or coalesce(new.bill_to_tax_id, '') is distinct from coalesce(old.bill_to_tax_id, '') then
      raise exception 'INVOICE_LOCKED: una factura emitida no se modifica; anúlala y emite una nueva';
    end if;
  end if;
  return new;
end;
$$;

create trigger invoices_immutability
  before update or delete on invoices
  for each row execute function invoices_immutability_guard();

-- Block edits to line items of a non-draft invoice.
create or replace function invoice_items_immutability_guard() returns trigger
language plpgsql as $$
declare
  v_status invoice_status;
begin
  select status into v_status from invoices
    where id = coalesce(new.invoice_id, old.invoice_id);
  if v_status is not null and v_status <> 'draft' then
    raise exception 'INVOICE_LOCKED: las líneas de una factura emitida no se modifican';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger invoice_items_immutability
  before insert or update or delete on invoice_items
  for each row execute function invoice_items_immutability_guard();

alter table invoices          enable row level security;
alter table invoice_items     enable row level security;
alter table invoice_settings  enable row level security;
