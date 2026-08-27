# API surface — Praetoria Vacacional

HTTP endpoints and the key server functions. All request bodies validated with
Zod (`src/lib/validation.ts`); all money in EUR cents; prices computed server-side.

## Public HTTP routes

| Method | Path | Purpose | Auth | Rate limit |
|---|---|---|---|---|
| POST | `/api/availability/search` | Availability + price for all properties over a date range | — | 30/min/IP |
| POST | `/api/quote` | Availability + price for one property | — | 60/min/IP |
| GET | `/api/properties/[property]/calendar` | 12-month day-state calendar for a property | — | 60/min/IP |
| POST | `/api/checkout` | Create a pending reservation hold (idempotent) | — | 20/min/IP |
| POST | `/api/checkout/guest` | Attach guest contact details to a hold | — | 30/min/IP |
| POST | `/api/checkout/pay` | Begin payment → returns Stripe (or DEMO simulator) URL | — | 15/min/IP |
| POST | `/api/checkout/simulate` | DEMO-only payment simulator (disabled once Stripe configured) | — | — |
| POST | `/api/webhooks/stripe` | Stripe events; confirms reservations. Signature-verified, idempotent | Stripe sig | — |
| GET | `/api/ical/[slug].ics` | Per-property export feed for Booking.com | `?token=` | — |
| GET/POST | `/api/ical/import` | Pull configured Booking feeds → availability_blocks | Bearer token / Vercel cron | — |
| GET | `/api/cron/expire-holds` | Release expired pending holds | Bearer token / Vercel cron | — |

## Metadata routes

`/sitemap.xml`, `/robots.txt` — generated from `src/domains/marketing/navigation.ts`.

## Key server functions

| Function | File | Notes |
|---|---|---|
| `buildQuote(config, req, now?)` | `domains/pricing/engine.ts` | Pure. Seasons, weekend rates, min-stay, LOS discount, extra-guest fee, tax |
| `searchAllProperties / checkProperty / quoteForCheckout` | `domains/booking/service.ts` | Repo availability + pricing |
| `buildCalendar / isRangeAvailable / firstConflictNight` | `domains/booking/availability.ts` | Pure. Half-open ranges, shared turnover day |
| `startCheckout / saveGuestDetails / beginPayment / finalizeReservation` | `domains/booking/checkout.ts` | Orchestration; `finalizeReservation` is idempotent |
| `getRepository()` | `lib/repository/index.ts` | Supabase impl or in-memory (DEMO) |
| `parseIcs / generateIcs` | `domains/integrations/ical.ts` | Pure. RFC 5545 subset |
| `buildExportFeed / importAllFeeds` | `domains/integrations/sync.ts` | Per-property, idempotent |

## Database RPCs (Supabase)

`create_reservation_hold`, `is_stay_available`, `property_busy_ranges`,
`confirm_reservation`, `expire_stale_holds` — see `supabase/migrations/`.
Overlap prevented by a GiST exclusion constraint per table + a cross-table
trigger + per-property advisory lock in the hold RPC.
