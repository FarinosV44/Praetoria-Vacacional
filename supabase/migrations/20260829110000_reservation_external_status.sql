-- =============================================================================
-- Issue #56 · 56-C — reservations intranet
--   'external' reservation status: an informational record of a Booking/Airbnb
--   reservation whose dates are already held by its iCal availability block.
--   It does NOT occupy availability (the exclusion constraint and the
--   assert_property_free() trigger both key off status in ('pending','confirmed')),
--   so it can coexist with its own block without a false conflict.
-- =============================================================================

alter type reservation_status add value if not exists 'external';
