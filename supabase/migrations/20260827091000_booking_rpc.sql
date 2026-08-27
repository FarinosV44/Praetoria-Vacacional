-- =============================================================================
-- Booking RPCs (issues #7, #10, #11)
-- Atomic availability check + hold creation, serialised per property with an
-- advisory lock so two concurrent checkouts cannot both pass the check.
-- =============================================================================

-- Free/busy for a property over a window: returns busy day-ranges from both
-- occupying reservations and availability blocks.
create or replace function property_busy_ranges(p_property uuid, p_from date, p_to date)
returns table (start_date date, end_date date, kind text)
language sql stable as $$
  select lower(stay), upper(stay), 'reservation'
  from reservations
  where property_id = p_property
    and status in ('pending', 'confirmed')
    and stay && daterange(p_from, p_to, '[)')
  union all
  select lower(stay), upper(stay), 'block'
  from availability_blocks
  where property_id = p_property
    and stay && daterange(p_from, p_to, '[)');
$$;

-- Is a specific stay free right now?
create or replace function is_stay_available(p_property uuid, p_check_in date, p_check_out date)
returns boolean
language sql stable as $$
  select not exists (
    select 1 from reservations
    where property_id = p_property
      and status in ('pending', 'confirmed')
      and stay && daterange(p_check_in, p_check_out, '[)')
  ) and not exists (
    select 1 from availability_blocks
    where property_id = p_property
      and stay && daterange(p_check_in, p_check_out, '[)')
  );
$$;

-- Create (or return, if the idempotency key repeats) a pending reservation hold.
-- Raises PROPERTY_UNAVAILABLE if the dates are taken.
create or replace function create_reservation_hold(
  p_property        uuid,
  p_check_in        date,
  p_check_out       date,
  p_guests          int,
  p_total_cents     bigint,
  p_currency        text,
  p_breakdown       jsonb,
  p_hold_minutes    int,
  p_idempotency_key text
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
    if found then
      return v_existing;
    end if;
  end if;

  if not is_stay_available(p_property, p_check_in, p_check_out) then
    raise exception 'PROPERTY_UNAVAILABLE' using errcode = 'exclusion_violation';
  end if;

  -- Human-friendly locator: PV-XXXXXX
  v_code := 'PV-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  insert into reservations (
    property_id, code, status, source, check_in, check_out, guests,
    currency, total_cents, price_breakdown, hold_expires_at, idempotency_key
  ) values (
    p_property, v_code, 'pending', 'direct', p_check_in, p_check_out, p_guests,
    p_currency, p_total_cents, coalesce(p_breakdown, '{}'::jsonb),
    now() + make_interval(mins => p_hold_minutes), p_idempotency_key
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Expire pending holds whose window has passed. Run from a cron / route.
create or replace function expire_stale_holds() returns int
language plpgsql as $$
declare
  v_count int;
begin
  with expired as (
    update reservations
      set status = 'expired'
      where status = 'pending'
        and hold_expires_at is not null
        and hold_expires_at < now()
      returning 1
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

-- Confirm a reservation after a verified payment. Idempotent.
create or replace function confirm_reservation(p_reservation uuid, p_payment_intent text)
returns reservations
language plpgsql as $$
declare
  v_row reservations;
begin
  select * into v_row from reservations where id = p_reservation for update;
  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_row.status = 'confirmed' then
    return v_row;
  end if;

  if v_row.status not in ('pending') then
    raise exception 'RESERVATION_NOT_PENDING: status=%', v_row.status;
  end if;

  update reservations
    set status = 'confirmed', hold_expires_at = null
    where id = p_reservation
    returning * into v_row;

  return v_row;
end;
$$;
