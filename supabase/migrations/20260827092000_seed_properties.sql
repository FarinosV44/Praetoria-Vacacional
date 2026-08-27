-- =============================================================================
-- Seed the two V1 properties. UUIDs match src/content/properties/*.ts so DEMO
-- mode and a seeded database agree. rate_config is seeded empty here; the app
-- falls back to src/content/rates until the admin edits it. Re-runnable.
-- =============================================================================

insert into properties (id, slug, name, experience, active) values
  ('11111111-1111-4111-8111-111111111111', 'javalambre', 'Javalambre Mountain SuperSki', 'ski', true),
  ('22222222-2222-4222-8222-222222222222', 'valencia',   'Valencia Frente al Mar',       'sea', true)
on conflict (id) do update
  set slug = excluded.slug, name = excluded.name, experience = excluded.experience;

insert into property_settings (property_id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222')
on conflict (property_id) do nothing;

insert into calendar_syncs (property_id, channel, direction) values
  ('11111111-1111-4111-8111-111111111111', 'booking', 'import'),
  ('11111111-1111-4111-8111-111111111111', 'booking', 'export'),
  ('22222222-2222-4222-8222-222222222222', 'booking', 'import'),
  ('22222222-2222-4222-8222-222222222222', 'booking', 'export')
on conflict (property_id, channel, direction) do nothing;
