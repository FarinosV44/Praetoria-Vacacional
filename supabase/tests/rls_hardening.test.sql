-- =============================================================================
-- SQL test for issue #75 — RLS + least-privilege posture
--
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls_hardening.test.sql
--
-- Read-only. Asserts the security posture of the deployed schema; no rollback
-- needed because it writes nothing. Any failed `assert` aborts with a message.
-- =============================================================================

do $$
declare
  t          text;
  bad        text;
  n          int;
  app_tables text[] := array[
    'properties', 'property_settings', 'rate_rules', 'reservations',
    'availability_blocks', 'payments', 'calendar_syncs', 'webhook_events',
    'admin_audit_log', 'email_log', 'coupons', 'coupon_redemptions',
    'content_overrides', 'customers', 'customer_merges', 'invoice_settings',
    'invoices', 'invoice_items', 'daily_rates', 'segments', 'campaigns',
    'campaign_recipients', 'marketing_unsubscribes', 'channel_feeds'
  ];
begin
  -- 1 · every application table has RLS enabled AND forced
  foreach t in array app_tables loop
    if to_regclass('public.' || t) is null then
      continue;  -- table from a migration not applied here
    end if;
    select not (relrowsecurity and relforcerowsecurity) into bad
    from pg_class where oid = ('public.' || t)::regclass;
    assert not bad::bool, format('table %s: RLS must be enabled AND forced', t);
  end loop;

  -- 2 · anon / authenticated hold NO privilege on any application table
  select count(*) into n
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and table_name = any(app_tables);
  assert n = 0, format('anon/authenticated still hold %s table grant(s) in public', n);

  -- 3 · no permissive policy silently opens a table to anon
  select count(*) into n
  from pg_policies
  where schemaname = 'public'
    and table_name = any(app_tables)
    and ('anon' = any(roles) or 'public' = any(roles) or 'authenticated' = any(roles));
  assert n = 0, format('%s policy(ies) expose an app table to anon/public', n);

  -- 4 · the availability read functions are not executable by anon
  select count(*) into n
  from information_schema.role_routine_grants
  where routine_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and routine_name in ('property_busy_ranges', 'is_stay_available',
                         'create_reservation_hold', 'confirm_reservation',
                         'expire_stale_holds', 'redeem_coupon');
  assert n = 0, format('%s RPC grant(s) to anon/authenticated should be revoked', n);

  raise notice 'RLS HARDENING — ALL ASSERTIONS PASSED';
end $$;
