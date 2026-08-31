-- =============================================================================
-- Issue #75 — Supabase security hardening: RLS, least privilege, role boundaries
-- =============================================================================
-- Idempotent. Safe to re-run. Consolidates the security posture that was set
-- table-by-table across earlier migrations and closes the gaps:
--
--   * every application table has RLS ENABLED *and* FORCED (RLS applies to the
--     table owner too, so a stray owner-role connection cannot read around it);
--   * `content_overrides` — the one table that never had RLS — is covered;
--   * the anon and authenticated roles hold NO privileges on any base table
--     (all data access is server-side through the secret/service_role key,
--     behind the app's own admin auth — decision D-005);
--   * default privileges for future objects in `public` are stripped from
--     PUBLIC/anon/authenticated, so a later `create table` is locked by default;
--   * the two PII-free availability read functions (D-021) are tightened to
--     service_role only — nothing connects with the anon key today
--     (`supabaseServer()` is reserved for issue #65 and currently unused).
--
-- Model (unchanged): RLS enabled + zero permissive policies => only a
-- BYPASSRLS role (service_role / the secret key) can touch the table. The admin
-- UI runs server-side with that key after verifying its own session.
-- =============================================================================

-- --- 1. content_overrides: the missing RLS -----------------------------------
alter table content_overrides enable row level security;

-- --- 2. Enable + FORCE RLS on every application table ------------------------
do $$
declare
  t text;
  app_tables text[] := array[
    'properties', 'property_settings', 'rate_rules', 'reservations',
    'availability_blocks', 'payments', 'calendar_syncs', 'webhook_events',
    'admin_audit_log', 'email_log', 'coupons', 'coupon_redemptions',
    'content_overrides', 'customers', 'customer_merges', 'invoice_settings',
    'invoices', 'invoice_items', 'daily_rates', 'segments', 'campaigns',
    'campaign_recipients', 'marketing_unsubscribes', 'channel_feeds'
  ];
begin
  foreach t in array app_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skip %, not present', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force  row level security', t);
    -- No role but a BYPASSRLS role should even have column privileges.
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant  all on public.%I to service_role', t);
  end loop;
end $$;

-- --- 3. Lock down future objects in the public schema -----------------------
alter default privileges in schema public revoke all on tables    from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

-- Schema usage: anon/authenticated may resolve names (needed for PostgREST)
-- but that grants nothing on the objects themselves after the revokes above.
grant usage on schema public to anon, authenticated;

-- --- 4. Tighten the availability read functions to service_role only --------
-- D-021 granted these to anon for a client path that no longer exists. If a
-- public anon read is ever reintroduced, add the grant back in that migration.
do $$
begin
  execute 'revoke all on function public.property_busy_ranges(uuid, date, date) from anon, authenticated';
  execute 'revoke all on function public.is_stay_available(uuid, date, date)   from anon, authenticated';
exception when undefined_function then
  raise notice 'availability functions not present yet — skipping';
end $$;

-- --- 5. Make sure the mutating RPCs never drifted open ---------------------
do $$
declare
  fn text;
  mutating text[] := array[
    'public.create_reservation_hold(uuid, date, date, integer, integer, text, text, text, text)',
    'public.create_reservation_hold(uuid, date, date, integer, integer, text, text, text, text, text, text, text)',
    'public.confirm_reservation(uuid, text)',
    'public.expire_stale_holds()',
    'public.redeem_coupon(text, uuid, uuid)'
  ];
begin
  foreach fn in array mutating loop
    begin
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    exception when undefined_function then
      raise notice 'skip %, not present', fn;
    end;
  end loop;
end $$;

-- --- 6. Refresh PostgREST's schema cache -----------------------------------
notify pgrst, 'reload schema';
