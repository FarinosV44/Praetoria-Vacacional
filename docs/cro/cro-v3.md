# CRO V3 — price, trust, real scarcity, abandonment (issue #49)

Builds on `docs/cro/experiments.md`. No manipulative patterns: no countdowns, no
fake "X people are viewing", no invented low-availability.

## Price & trust (already live, reinforced in V3)

- Full price with cleaning included is shown before payment, on the property
  page widget and the checkout summary (`t.finalPrice`).
- The checkout summary now shows, on every step: the line-item breakdown, a
  **"Secure card payment via Stripe"** line and the **cancellation summary**
  (previously only on step 3).
- Property page and home carry a **quick contact CTA** ("Tengo una duda" /
  "Resolver una duda") styled as a secondary action so it never competes with
  the primary "Ver fechas / Reservar" button.

## Real scarcity (data-backed only)

`getAvailabilityInsight(slug, horizonDays=45)` reads the property's own busy
ranges (reservations + blocks) and computes true occupancy:

| Occupancy of next 45 nights | UI |
|---|---|
| ≥ 70% | "Ocupación alta: el N% de las noches de las próximas 6 semanas ya está reservado." |
| 45–69% | "El N% de las noches de las próximas 6 semanas ya está reservado." |
| < 45% | nothing shown |

Rendered by `<AvailabilityNote>` in the property page header. It is a **client**
component (D-021): the property page stays static/ISR with no DB dependency and
the note fetches `/api/properties/[slug]/availability-insight` (`force-dynamic`)
after hydration, so the number is always live — not up to an hour stale — and
the note simply doesn't appear if occupancy is low or the request fails. Pure
logic (`occupancy()` in `availability.ts`, `consolidateBusyRanges` in
`busy-ranges.ts`) is unit-tested.

## Funnel events (GA4, PII-stripped by `track()`)

| Event | Where | Params |
|---|---|---|
| `search_availability` | home / search | check_in, check_out, guests |
| `select_property` | search result CTA | property_slug |
| `select_dates` | checkout mount | property_slug, nights |
| `checkout_step` | each checkout step | property_slug, step (1–3), nights |
| `coupon_field_open` / `coupon_applied` / `coupon_rejected` | coupon field | property_slug |
| `begin_checkout` | booking widget → checkout | property_slug, nights |
| `checkout_abandoned` | tab hidden before payment, not confirmed | property_slug, step |
| `payment_started` | pay button | property_slug |
| `reservation_confirmed` / `reservation_failed` | success / error page | property_slug |
| `contact_click` | /contacto mount | — |

Cross any of these with `exp_<key>` (experiment variant), `property_slug`,
device and coupon use in GA4 Explorations → conversion by property, landing,
device and coupon.

## Abandoned checkout — prepared, not active

`checkout_abandoned` is emitted now (analytics only). Email recovery is **not**
built and must not be until:

1. The guest reached step 2 and submitted a real email (we already have it,
   with `acceptTerms` covering privacy) **and**
2. A separate, explicit opt-in for "remind me about this booking" is added to
   step 2 — recovery email is not covered by the booking-terms consent.
3. Sending uses the existing Resend module with a single reminder, unsubscribe
   link, and a hard cap of one email per abandoned hold.

Until then: the hold simply expires (`/api/cron/expire-holds`) and the dates are
released. No dark patterns, no unsolicited email.
