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
| 56-D | Customers / CRM — list, detail (history, spend, consents, notes), manual create, duplicate detection + merge | ⬜ |
| 56-E | Invoicing — series JAV/PALM, manual number + suggestion + duplicate/gap detection, "Emitir factura" from reservation, per-property PDF, immutable history, states, configurable tax | ⬜ |
| 56-F | Operational calendar + pricing — monthly visual grid, per/both properties, channel colours, fast price/block editing over ranges | ⬜ |
| 56-G | Marketing — segmentation, saved segments, CSV export, campaign + promo-code scaffolding, consent + unsubscribe, no accidental mass send | ⬜ |
| 56-H | Promotions integration — create from customer/segment, track redemptions, 10PRAETORIA10 | ⬜ |
| 56-I | Booking/Airbnb → internal records — iCal import creates customer + reservation | ⬜ |
| 56-J | Search + filters + exports across reservations / customers / invoices | ⬜ |
| 56-K | Security / roles / dashboard — role architecture (admin/gestión/solo lectura), dashboard widgets, action logs, private-PDF protection, noindex | ⬜ |
| 56-L | Final E2E + docs | ⬜ |

---

## Resolved (awaiting merge to `main`)

_None yet for #56._

---

## Pending / backlog

Issues #1–#55 tracked in `docs/PROGRESS.md` sprint tables.
