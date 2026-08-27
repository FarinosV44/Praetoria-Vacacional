-- =============================================================================
-- Discount codes / promotions (issue #45)
--  - coupons: the rules
--  - reservations gets code + original/discount amounts (server-computed only)
--  - coupon_redemptions: one row per successful use, for per-email limits & audit
-- =============================================================================

create type coupon_kind as enum ('percent', 'fixed');

create table coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,               -- stored UPPERCASE
  kind                coupon_kind not null,
  value               int not null check (value > 0),     -- percent 1..100, or cents
  property_slug       text,                               -- null = todas las propiedades
  starts_on           date,
  ends_on             date,
  min_nights          int not null default 0,
  min_total_cents     bigint not null default 0,
  max_uses            int,                                -- null = ilimitado
  uses_count          int not null default 0,
  max_uses_per_email  int,                                -- null = sin límite por email
  auto_apply          boolean not null default false,     -- promo sin código (fase posterior)
  active              boolean not null default true,
  description         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint coupons_percent_range check (kind <> 'percent' or value between 1 and 100)
);
create index coupons_active_idx on coupons (active) where active;

create trigger coupons_touch before update on coupons
  for each row execute function touch_updated_at();

alter table reservations
  add column coupon_code          text,
  add column original_total_cents bigint,
  add column discount_cents       bigint not null default 0;

create table coupon_redemptions (
  id             uuid primary key default gen_random_uuid(),
  coupon_id      uuid not null references coupons(id) on delete cascade,
  reservation_id uuid not null references reservations(id) on delete cascade,
  guest_email    text,
  discount_cents bigint not null,
  created_at     timestamptz not null default now(),
  unique (coupon_id, reservation_id)
);
create index coupon_redemptions_coupon_idx on coupon_redemptions (coupon_id);
create index coupon_redemptions_email_idx on coupon_redemptions (coupon_id, guest_email);

alter table coupons              enable row level security;
alter table coupon_redemptions   enable row level security;
-- service-role only, like every other operational table.

-- Redefine the hold RPC to accept coupon fields (p_total_cents is the FINAL,
-- discounted total that goes to Stripe). Overload keeps the old signature valid.
create or replace function create_reservation_hold(
  p_property        uuid,
  p_check_in        date,
  p_check_out       date,
  p_guests          int,
  p_total_cents     bigint,
  p_currency        text,
  p_breakdown       jsonb,
  p_hold_minutes    int,
  p_idempotency_key text,
  p_original_total_cents bigint,
  p_discount_cents  bigint,
  p_coupon_code     text
) returns reservations
language plpgsql as $$
declare
  v_existing reservations;
  v_row      reservations;
  v_code     text;
begin
  perform pg_advisory_xact_lock(hashtext(p_property::text));

  if p_idempotency_key is not null then
    select * into v_existing from reservations where idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
  end if;

  if not is_stay_available(p_property, p_check_in, p_check_out) then
    raise exception 'PROPERTY_UNAVAILABLE' using errcode = 'exclusion_violation';
  end if;

  v_code := 'PV-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  insert into reservations (
    property_id, code, status, source, check_in, check_out, guests,
    currency, total_cents, original_total_cents, discount_cents, coupon_code,
    price_breakdown, hold_expires_at, idempotency_key
  ) values (
    p_property, v_code, 'pending', 'direct', p_check_in, p_check_out, p_guests,
    p_currency, p_total_cents, p_original_total_cents, coalesce(p_discount_cents, 0), p_coupon_code,
    coalesce(p_breakdown, '{}'::jsonb),
    now() + make_interval(mins => p_hold_minutes), p_idempotency_key
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Atomically record a redemption and bump the counter. Raises if the total-use
-- limit is exceeded (checked here too, not just in app code).
create or replace function redeem_coupon(
  p_coupon        uuid,
  p_reservation   uuid,
  p_email         text,
  p_discount_cents bigint
) returns void
language plpgsql as $$
declare
  v_row coupons;
begin
  select * into v_row from coupons where id = p_coupon for update;
  if not found then
    raise exception 'COUPON_NOT_FOUND';
  end if;
  if v_row.max_uses is not null and v_row.uses_count >= v_row.max_uses then
    raise exception 'COUPON_EXHAUSTED';
  end if;

  insert into coupon_redemptions (coupon_id, reservation_id, guest_email, discount_cents)
  values (p_coupon, p_reservation, p_email, p_discount_cents)
  on conflict (coupon_id, reservation_id) do nothing;

  update coupons set uses_count = uses_count + 1 where id = p_coupon;
end;
$$;
