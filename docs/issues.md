# Forge issues — Praetoria Vacacional

Living log of GitHub issues accessed or worked. Records the inventory, how each
resolved issue was fixed (diagnosis, resolution, commits, verification), and what
remains pending. Keel never closes an issue from code reading — comments only.

Last sweep: 2026-08-29

---

## In progress

### #56 · Aviso legal completo + intranet de gestión (epic)

Split into sprints on `develop`. `develop → main` merge only when the full
`reserva → cliente → factura → PDF → calendario → historial → segmento` chain
works and persists. Decision: D-009.

| Sprint | Scope | Status |
|--------|-------|--------|
| 56-A | Part A — PRAETORIA, S.L. legal data centralised (`company.ts`), aviso legal + registry data, footer, contact page, Organization JSON-LD, email footer | ✅ code |
| 56-B | CRM foundation — `customers` table + `customer_merges`; reservation enrichment (customer_id, channel detail, guest fiscal data, external locator, manual invoice number, payment_state); `reservation_source` widened (airbnb, other); pure dedup (email/phone/doc/name) + merge + profile stats; repository CRM methods (memory + supabase); `/admin/clientes` list+filters, detail (stats, history, duplicates+merge), manual create/edit. 20 unit tests | ✅ code |
| 56-C | Reservations intranet — new `external` status (informational, non-occupying); `createManualReservation` (memory + supabase); `/admin/reservas/nuevo` + `/admin/reservas/[id]` (all channels, full guest/fiscal fields, customer link/auto-create, invoice number, payment state, notes); list gains channel + payment + search filters, customer link, invoice column. Auto-link customer on manual create | ✅ code |
| 56-D | Customers / CRM — list, detail, manual create, dedup + merge | ✅ folded into 56-B |
| 56-E | Invoicing — `invoices` + `invoice_items` + `invoice_settings` migration w/ immutability triggers. Pure numbering (`JAV-YY####` / `PALM-YY####`, parse/format, suggest-next, duplicate + gap detection — 11 tests) + totals w/ configurable exempt tax (art. 20.Uno.23º LIVA default — 7 tests). Repo methods (memory + supabase). `/admin/facturas` list + per-series numbering insight; `/admin/facturas/[id]` draft editor (dynamic line rows, live totals) / issued viewer + issue/paid/void; `/admin/facturas/[id]/documento` branded print-to-PDF doc (per-property colour, emisor PRAETORIA S.L., requireAdmin = private); `/admin/facturas/ajustes` per-property series + tax config. "Emitir factura" on reservation detail. Flow test (reserva→cliente→factura→historial + immutability). D-010 | ✅ code |
| 56-F | Operational calendar + pricing — `daily_rates` (per-date price + min-stay override, migration `20260829130000`) wired into the pricing engine (`nightlyRateCents`, `effectiveMinNights`) + `resolveRateConfig` (so checkout/webhook honour it) — schema optional, backward-compatible. Pure `buildMonthGrid` (6×7 Monday grid: price, reservation-by-channel, block, override flags) + `monthNav` — 9 tests + 3 engine tests. Repo `listDailyRates`/`setDailyRates`/`clearDailyRates` (memory + supabase). `/admin/calendario` rebuilt: month grid per property, month nav, channel-colour legend, multi-day select → bulk apply price / min-stay / clear / cerrar (manual block, contiguous-range) / abrir | ✅ code |
| 56-G | Marketing — `segments` + `campaigns` + `campaign_recipients` + `marketing_unsubscribes` (migration `20260829140000`). Pure `matchSegment`/`evaluateSegment` (property, channel, language, national/foreign, repeaters, spend, win-back date, consent, coupon — all AND-ed) + `describeCriteria` — 8 tests. Repo: profiles, segment CRUD + live members, campaign CRUD, `prepareCampaign` (materialises recipients honouring consent + unsubscribes), `markCampaignSent` (records intent, recipients skipped — real send **Aún no configurado**), unsubscribe list (retires consent). `/admin/marketing` (segments + campaigns), segment editor w/ live counts + CSV export route (`/admin/marketing/export`, requireAdmin, email/phone/all), campaign editor + prepare + recipients + double-confirm send (type ENVIAR), `/admin/marketing/bajas`. config-status: `campaigns` feature | ✅ code |
| 56-H | Promotions integration — the coupon system (code, %/fixed, per-property, limits, expiry, redemption tracking incl. 10PRAETORIA10) already exists (#45/#54). Added: pure `quickCode` (readable code from a customer/segment label — 3 tests); `createQuickCouponAction`; "Crear cupón para este cliente" on the customer fiche and "para este segmento" on the segment page; campaign detail shows its linked coupon + redemption count | ✅ code |
| 56-I | Booking/Airbnb → internal records — pure `planExternalReservations` (imported block → create `external` reservation; dates drift → update; block gone → cancel; never touches a confirmed booking sharing a uid; idempotent — 5 tests). Repo `reconcileExternalReservations` (memory + supabase) + `listImportFeeds`. `sync.ts` runs it after every iCal import and iterates Booking ∪ Airbnb ∪ any admin-added channel. `/admin/sincronizacion` gains an Airbnb feed URL field. Imported reservations then appear in Reservas + calendar; the admin fills guest data → customer auto-created (56-C) | ✅ code |
| 56-J | Search + filters + exports — per-entity search already in place (56-C/E/B: reservas by localizador/nombre/email/doc/factura/localizador, clientes by nombre/email/tel/doc, facturas by nº/nombre/NIF/email). Added `lib/csv.ts` (RFC-4180 + BOM, 2 tests) + CSV export routes for clientes, reservas, facturas (requireAdmin, honour the current filters) with "Exportar CSV" buttons; segments export from 56-G | ✅ code |
| 56-K | Security / roles / dashboard — `roles.ts` capability matrix (admin / gestion / lectura), `ADMIN_ROLE` env, `assertCapability` wired into the critical mutating actions (reservations, invoices, customers, calendar, marketing, promotions) — 3 tests. `admin_audit_log` repo methods + `logAction` helper wired into cancel / issue / void / merge / campaign-send / close-dates; `/admin/actividad` page. Dashboard rebuilt with §1 widgets + month/property filter: ingresos, pagos recibidos, ocupación, reservas por canal, próximas + recientes, facturas pendientes de emitir, estado de sincronización, accesos rápidos. Role shown in the header. (noindex + private PDF already in place.) | ✅ code |
| 56-L | Final E2E + docs | ⬜ |

---

## Resolved (awaiting merge to `main`)

_None yet for #56._

---

## Pending / backlog

Issues #1–#55 tracked in `docs/PROGRESS.md` sprint tables.
