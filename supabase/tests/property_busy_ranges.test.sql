-- =============================================================================
-- SQL test for public.property_busy_ranges / public.is_stay_available
--
-- Runnable against any database that has the migrations applied:
--   psql "$SUPABASE_DB_URL" -f supabase/tests/property_busy_ranges.test.sql
--   -- or --
--   supabase db execute --file supabase/tests/property_busy_ranges.test.sql
--
-- It runs inside a single transaction and ROLLS BACK, so it leaves no rows.
-- Any failed `assert` aborts with a clear message.
-- =============================================================================

begin;

do $$
declare
  p     uuid;
  k     text;
  n     int;
begin
  -- fixture property
  insert into public.properties (slug, name, experience)
  values ('__test_pbr__', 'PBR test', 'sea')
  returning id into p;

  -- 1 · a direct reservation 21→24 Sep occupies nights 21,22,23 only
  insert into public.reservations (property_id, code, status, source, check_in, check_out, guests)
  values (p, 'PV-TEST01', 'confirmed', 'direct', date '2026-09-21', date '2026-09-24', 2);

  select count(*) into n
  from public.property_busy_ranges(p, date '2026-09-01', date '2026-10-01') b
  where b.start_date = date '2026-09-21' and b.end_date = date '2026-09-24' and b.kind = 'reservation';
  assert n = 1, 'expected the direct reservation as one half-open range 21..24';

  -- no phantom day: the 24th (checkout day) is a valid check-in
  assert public.is_stay_available(p, date '2026-09-24', date '2026-09-27'),
    'a guest must be able to check in on the checkout day (24th)';
  -- 21..25 needs nights 21,22,23,24; the 21st..23rd are already booked
  assert not public.is_stay_available(p, date '2026-09-21', date '2026-09-25'),
    '21..25 must be rejected — it overlaps the booked nights 21-23';

  -- 2 · adjacent booking 24→27 is compatible (shared turnover day)
  assert public.is_stay_available(p, date '2026-09-24', date '2026-09-27'),
    'back-to-back stay 24..27 must be available';
  insert into public.reservations (property_id, code, status, source, check_in, check_out, guests)
  values (p, 'PV-TEST02', 'confirmed', 'direct', date '2026-09-24', date '2026-09-27', 2);

  -- both stays now occupy 21..27 with no overlap, no gap
  select count(*) into n
  from public.property_busy_ranges(p, date '2026-09-20', date '2026-09-28') b;
  assert n = 2, 'expected exactly two consolidated ranges for the back-to-back stays';

  -- 3 · a manual block
  insert into public.availability_blocks (property_id, start_date, end_date, source, summary)
  values (p, date '2026-10-05', date '2026-10-07', 'manual', 'cerrado test');
  select count(*) into n
  from public.property_busy_ranges(p, date '2026-10-01', date '2026-11-01') b
  where b.kind = 'block' and b.start_date = date '2026-10-05' and b.end_date = date '2026-10-07';
  assert n = 1, 'expected the manual block as one range';
  assert public.is_stay_available(p, date '2026-10-07', date '2026-10-09'),
    'checkout on a manual-block end day must be allowed';

  -- 4 · a Booking/iCal import (also an availability_blocks row) + an `external`
  --     reservation for the same dates → counted ONCE, from the block
  insert into public.availability_blocks (property_id, start_date, end_date, source, external_uid, summary)
  values (p, date '2026-11-10', date '2026-11-13', 'booking', 'ical-uid-1', 'Booking import');
  insert into public.reservations (property_id, code, status, source, check_in, check_out, guests, external_uid)
  values (p, 'PV-TEST03', 'external', 'booking', date '2026-11-10', date '2026-11-13', 2, 'ical-uid-1');

  select count(*) into n
  from public.property_busy_ranges(p, date '2026-11-01', date '2026-12-01') b
  where b.start_date = date '2026-11-10';
  assert n = 1, 'the imported stay must be counted once (from the block, not the external reservation)';
  select b.kind into k
  from public.property_busy_ranges(p, date '2026-11-01', date '2026-12-01') b
  where b.start_date = date '2026-11-10' limit 1;
  assert k = 'block', 'the imported stay must come from the block';

  -- 5 · cancelled / expired reservations never occupy
  insert into public.reservations (property_id, code, status, source, check_in, check_out, guests)
  values (p, 'PV-TEST04', 'cancelled', 'direct', date '2027-01-05', date '2027-01-09', 2);
  select count(*) into n
  from public.property_busy_ranges(p, date '2027-01-01', date '2027-02-01') b;
  assert n = 0, 'a cancelled reservation must not appear as busy';
  assert public.is_stay_available(p, date '2027-01-05', date '2027-01-09'),
    'the cancelled dates must be bookable again';

  raise notice 'property_busy_ranges.test.sql — ALL ASSERTIONS PASSED';
end $$;

rollback;
