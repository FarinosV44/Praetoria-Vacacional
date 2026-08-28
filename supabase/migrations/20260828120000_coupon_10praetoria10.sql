-- =============================================================================
-- Issue #54 — activate the promo code 10PRAETORIA10 (10% off, both properties).
--  - percent 10, property_slug null  → aplica a Javalambre y Valencia
--  - sin caducidad, sin límite de usos ni por email
--  - active = true (estado inicial: activo)
-- Re-runnable: upserts by the unique `code` and re-activates it.
-- =============================================================================

insert into coupons (code, kind, value, property_slug, active, description)
values ('10PRAETORIA10', 'percent', 10, null, true, 'Promoción 10PRAETORIA10 · 10% de descuento (todos los alojamientos)')
on conflict (code) do update
  set kind         = excluded.kind,
      value        = excluded.value,
      property_slug = excluded.property_slug,
      active       = true,
      description  = excluded.description,
      updated_at   = now();
