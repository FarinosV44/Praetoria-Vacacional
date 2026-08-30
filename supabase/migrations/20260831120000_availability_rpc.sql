-- =============================================================================
-- Availability RPC hardening + deploy guarantee (build failure fix)
--
-- Root cause of the "public.property_busy_ranges is not found in the Supabase
-- schema cache" error: the function was defined in 20260827091000_booking_rpc.sql
-- but that migration set was never applied to the production database. This
-- migration is idempotent (`create or replace`), so re-running the whole set is
-- safe, and it also:
--   * pins search_path and marks the read RPCs SECURITY DEFINER so the public
--     availability query works through the publishable/anon key (the base tables
--     are RLS-locked with no policies);
--   * grants EXECUTE on the two PII-free read functions to anon/authenticated,
--     and REVOKEs the mutating RPCs from PUBLIC (service_role only);
--   * asks PostgREST to reload its schema cache immediately.
--
-- Availability semantics (unchanged, restated explicitly):
--   A stay is the half-open night range [check_in, check_out).
--   check_in is inclusive, check_out is exclusive.
--   21 Sep -> 24 Sep occupies the nights of the 21st, 22nd and 23rd; another
--   guest may check in on the 24th (the ranges [21,24) and [24,27) do not
--   overlap under `&&`).
--   Busy sources are consolidated without double-counting or phantom nights:
--     - reservations with status in ('pending','confirmed')  -> [check_in, check_out)
--       ('external' is excluded: a Booking/Airbnb reservation row is
--        informational and its dates are already held by its imported iCal
--        block; 'cancelled' / 'expired' never occupy)
--     - every availability_blocks row (manual closures + imported
--       iCal/Booking/Airbnb events, any source) -> [start_date, end_date)
-- =============================================================================

-- --- property_busy_ranges ----------------------------------------------------
create or replace function public.property_busy_ranges(
  p_property uuid,
  p_from     date,
  p_to       date
)
returns table (start_date date, end_date date, kind text)
language sql
stable
parallel safe
security definer
set search_path = public, pg_temp
as $$
  select lower(r.stay)::date, upper(r.stay)::date, 'reservation'::text
  from public.reservations r
  where r.property_id = p_property
    and r.status in ('pending', 'confirmed')
    and r.stay && daterange(p_from, p_to, '[)')
  union all
  select lower(b.stay)::date, upper(b.stay)::date, 'block'::text
  from public.availability_blocks b
  where b.property_id = p_property
    and b.stay && daterange(p_from, p_to, '[)');
$$;

comment on function public.property_busy_ranges(uuid, date, date) is
  'Half-open [check_in, check_out) busy ranges for one property over [p_from, p_to). '
  'Consolidates occupying reservations (pending/confirmed) and every availability '
  'block (manual + imported iCal). PII-free; safe to call with the publishable key.';

-- --- is_stay_available ------------------------------------------------------
create or replace function public.is_stay_available(
  p_property  uuid,
  p_check_in  date,
  p_check_out date
)
returns boolean
language sql
stable
parallel safe
security definer
set search_path = public, pg_temp
as $$
  select p_check_out > p_check_in
     and not exists (
       select 1 from public.reservations r
       where r.property_id = p_property
         and r.status in ('pending', 'confirmed')
         and r.stay && daterange(p_check_in, p_check_out, '[)')
     )
     and not exists (
       select 1 from public.availability_blocks b
       where b.property_id = p_property
         and b.stay && daterange(p_check_in, p_check_out, '[)')
     );
$$;

comment on function public.is_stay_available(uuid, date, date) is
  'True when [p_check_in, p_check_out) does not overlap any occupying reservation '
  'or availability block on the property. Touching ranges do not overlap, so a '
  'checkout day can be another guest''s check-in day.';

-- --- permissions -----------------------------------------------------------
-- Read RPCs: expose to the public availability query. SECURITY DEFINER lets an
-- anon caller past the RLS lock on the base tables; the functions return only
-- date ranges + a 'reservation'/'block' label, never guest/price data.
revoke all on function public.property_busy_ranges(uuid, date, date) from public;
revoke all on function public.is_stay_available(uuid, date, date)   from public;
grant execute on function public.property_busy_ranges(uuid, date, date) to anon, authenticated, service_role;
grant execute on function public.is_stay_available(uuid, date, date)   to anon, authenticated, service_role;

-- Mutating RPCs: server-side only (service role / secret key). Never callable
-- with the publishable/anon key.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.create_reservation_hold(uuid, date, date, integer, bigint, text, jsonb, integer, text)',
    'public.create_reservation_hold(uuid, date, date, integer, bigint, text, jsonb, integer, text, bigint, bigint, text)',
    'public.confirm_reservation(uuid, text)',
    'public.expire_stale_holds()',
    'public.redeem_coupon(uuid, uuid, text, bigint)'
  ]
  loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    exception when undefined_function then
      -- a signature that does not exist in this database yet — skip it
      null;
    end;
  end loop;
end $$;

-- --- refresh the PostgREST schema cache -----------------------------------
-- So `supabase.rpc('property_busy_ranges', ...)` resolves immediately after
-- this migration is applied, without waiting for the periodic reload.
notify pgrst, 'reload schema';
