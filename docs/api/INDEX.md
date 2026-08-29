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
| `buildExportFeed / importAllFeeds` | `domains/integrations/sync.ts` | Per-property, idempotent; runs `reconcileExternalReservations` after each import |
| `planExternalReservations(blocks, reservations)` | `domains/integrations/reconcile.ts` | Pure. Booking/Airbnb blocks → internal `external` reservations (create/update/cancel), never touches a confirmed booking |

## Intranet — key server functions (issue #56)

| Function | File | Notes |
|---|---|---|
| Company data (`company`, `companyLegalParagraph`, …) | `content/company.ts` | Single source for PRAETORIA, S.L. — legal notice, footer, contact, JSON-LD, emails, invoices |
| `findDuplicates / mergedFields` | `domains/crm/dedup.ts` | Pure. Email / phone (last 9 digits) / doc / name+contact match; field-level merge |
| `buildCustomerProfile(customer, reservations)` | `domains/crm/profile.ts` | Pure. Spend, properties visited, first/last stay, coupons, channels |
| `parseInvoiceNumber / formatInvoiceNumber / suggestNextNumber / detectGaps / numberingInsight` | `domains/invoicing/numbering.ts` | Pure. `JAV-YY####` / `PALM-YY####` |
| `computeInvoiceTotals(items, {taxExempt, taxRate})` | `domains/invoicing/totals.ts` | Pure. Integer cents; exempt tax by default (art. 20.Uno.23º LIVA) |
| `draftInvoiceFromReservation(args)` | `domains/invoicing/draft.ts` | Pure. Pre-fills billing party + stay line + series + tax |
| `nightlyRateCents(config, iso)` / `buildMonthGrid(args)` / `monthNav(y, m)` | `domains/pricing/engine.ts`, `domains/calendar/month.ts` | Pure. Per-date overrides honoured; Monday-first 6×7 grid |
| `matchSegment / evaluateSegment / describeCriteria` | `domains/marketing/segments.ts` | Pure. AND-ed criteria over a `CustomerProfile` |
| `quickCode(label, rand?)` | `domains/promotions/quick-code.ts` | Pure. Readable promo code from a label |
| `can(role, cap) / assertCapability(cap) / currentRole()` | `domains/admin/roles.ts` | Capability matrix: admin / gestion / lectura |
| `logAction(action, opts)` | `domains/admin/audit.ts` | Non-throwing; writes `admin_audit_log` |
| `toCsv / csvCell / csvResponse` | `lib/csv.ts` | RFC-4180 + UTF-8 BOM |

## Intranet — HTTP routes (all `requireAdmin`, non-indexable)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/facturas/[id]/documento` | Deterministic branded invoice document (print → PDF) |
| GET | `/admin/clientes/export` `?q&channel&property&consent&repeaters` | Customers CSV |
| GET | `/admin/reservas/export` `?property&status&channel&payment&q` | Reservations CSV |
| GET | `/admin/facturas/export` `?property&status&q` | Invoices CSV |
| GET | `/admin/marketing/export` `?segment&field=email\|phone\|all` | Segment contacts CSV |

## Repository additions (issue #56)

`Repository` (`lib/repository/types.ts`) gains: customers (`listCustomers`,
`getCustomer`, `createCustomer`, `updateCustomer`, `customerProfile`,
`findCustomerDuplicates`, `mergeCustomers`), reservation editing
(`createManualReservation`, `updateReservation`,
`linkOrCreateCustomerFromReservation`), invoicing (`listInvoices`, `getInvoice`,
`getInvoiceByNumber`, `invoicesForReservation`, `allInvoiceNumbers`,
`invoiceSettings`/`setInvoiceSettings`, `createInvoice`, `updateInvoiceDraft`,
`issueInvoice`, `setInvoiceStatus`, `deleteInvoiceDraft`), daily rates
(`listDailyRates`, `setDailyRates`, `clearDailyRates`), marketing
(`listCustomerProfiles`, `segmentMembers`, segment + campaign CRUD,
`prepareCampaign`, `markCampaignSent`, unsubscribes), channel reconciliation
(`listImportFeeds`, `reconcileExternalReservations`) and the audit log
(`auditLog`, `listAuditLog`). Both the Supabase and in-memory implementations
provide all of them.

## Database RPCs (Supabase)

`create_reservation_hold`, `is_stay_available`, `property_busy_ranges`,
`confirm_reservation`, `expire_stale_holds` — see `supabase/migrations/`.
Overlap prevented by a GiST exclusion constraint per table + a cross-table
trigger + per-property advisory lock in the hold RPC.

## Intranet migrations (issue #56)

| File | Adds |
|---|---|
| `20260829100000_intranet_crm.sql` | `customers`, `customer_merges`; `reservation_source` += airbnb/other; reservation fiscal + channel + invoice-number + payment-state columns |
| `20260829110000_reservation_external_status.sql` | `reservation_status` += `external` (informational, non-occupying) |
| `20260829120000_invoicing.sql` | `invoices`, `invoice_items`, `invoice_settings` + immutability triggers |
| `20260829130000_daily_rates.sql` | `daily_rates` (per-date price / min-stay override) |
| `20260829140000_marketing.sql` | `segments`, `campaigns`, `campaign_recipients`, `marketing_unsubscribes` |
| `20260830090000_channel_feeds.sql` | `channel_feeds` (property_id, channel) → url — the authoritative store for Booking/Airbnb iCal import URLs, decoupled from `calendar_syncs` telemetry (D-011). Backfills from `calendar_syncs.feed_url` |

`ADMIN_ROLE` (`admin` \| `gestion` \| `lectura`, default `admin`) selects the
single login's role.
