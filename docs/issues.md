# Forge issues — Praetoria Vacacional

Living log of GitHub issues accessed or worked. Records the inventory, how each
resolved issue was fixed (diagnosis, resolution, commits, verification), and what
remains pending. Keel never closes an issue from code reading — comments only.

Last sweep: 2026-08-30

---

## Resolved (awaiting owner close)

### #57 · Capacidad a 6 plazas + blog/CMS SEO desde `/admin` — MERGED TO main

**Diagnosis + resolution:**
- **Capacidad (Valencia Frente al Mar):** el contenido decía 4 huéspedes / 3
  dormitorios / "1 cama doble · 2 literas". El issue pedía 6 plazas manteniendo
  2 habitaciones; preguntado, el propietario aclaró que **son 3 habitaciones**
  (una con cama doble, dos con literas). Aplicado: `guests` 4 → 6, `bedrooms`
  se queda en 3, `bedConfig` reescrito, y toda la copia ES+EN ("hasta 4
  personas" / "up to 4 people") corregida a 6 en `valencia.ts` y
  `landings/index.ts`. JSON-LD, tabla de datos y `BookingWidget` derivan de
  `capacity.*` → se corrigen solos. Javalambre ya estaba a 6 / 2. D-013.
- **Blog/CMS:** nuevo módulo `src/domains/blog/*` (types, schema zod, renderer
  Markdown propio y seguro, helpers, store sobre `content_overrides`, acciones
  server). Admin en `/admin/blog` (lista + `/nuevo` + `/[id]`) con crear /
  editar / borrador / publicar / programar / eliminar y todos los campos del
  issue (slug, extracto, contenido, imagen destacada + ALT, categoría,
  etiquetas, destino, alojamiento para el CTA, autor, fechas, bloque SEO/OG).
  Capacidad nueva `content.write` (admin + gestión). Público: `/blog` +
  `/blog/[slug]` (SSG desde publicados, ISR 1h), `Article` + `BreadcrumbList`
  JSON-LD, breadcrumbs, canonical, sitemap automático, CTA contextual a la
  ficha, bloque "sigue leyendo", 3 últimos en la home. `Blog` en header + menú
  móvil + footer. Sin canibalización con `/guias` (hub evergreen vs. actualidad
  fechada). D-014.
- **404 de `/valencia` en producción:** reproducido solo en el sitio desplegado
  (Hostinger), no en un build limpio de `main`. `/[property]` y `/en/[property]`
  pasan a `dynamicParams = true`: los slugs conocidos se siguen pre-generando y
  uno válido que un build omita se renderiza bajo demanda en vez de quedar como
  404 permanente. **Requiere un redespliegue limpio de `main`.**

**Verificación:** `tsc` + `next lint` + `next build` limpios · 161 unit
(19 nuevos: `blog/markdown.test.ts`, `blog/helpers.test.ts`) · 86 chromium e2e
(4 nuevos en `e2e/blog.spec.ts` — índice indexable, slug desconocido 404, panel
privado, y el ciclo admin completo crear→publicar→público 200→despublicar→404→
borrar; `/blog` añadido a `e2e/accessibility.spec.ts`, 0 serias). Los feeds
iCal, checkout y JSON-LD de propiedad reverificados.

**Post-merge (owner):** redesplegar `main` en Hostinger con caché de build
limpia para que desaparezca el 404 de `/valencia`; luego revisar los dos
borradores del blog y publicarlos/editarlos; cerrar el issue en GitHub.

### Bugfixes 2026-08-30 (reportados en conversación, sin issue en GitHub) — en `main`

- **Calendario público desfasado un día** (junio mostraba "31" de mayo como
  primer día, etc.). Causa: `new Date(y,m,d).toISOString()` en zona horaria
  UTC+ . Arreglado con `src/lib/calendar-cells.ts` (puro, 7 tests). D-015, L-006.
- **La URL de importación iCal se perdía en cada redespliegue** (modo demo, sin
  base de datos). Añadida variable de entorno de reserva
  `ICAL_IMPORT_<ALOJAMIENTO>_<CANAL>` que sobrevive a los despliegues; orden
  valor guardado → variable → fichero. D-016. **El propietario debe definir
  `ICAL_IMPORT_VALENCIA_BOOKING` / `ICAL_IMPORT_JAVALAMBRE_BOOKING` en el panel
  de Hostinger** (o configurar Supabase).

### #56 · Aviso legal completo + intranet de gestión (epic) — MERGED TO main

All 12 sprints (56-A…56-L) complete on `develop` and merged to `main`.
`develop → main` was the user's explicit instruction ("cuando acabes súbelo a
main"). The full `reserva → cliente → factura → PDF → calendario → historial →
segmento` chain works and persists (`src/domains/invoicing/chain.test.ts`).
Decisions D-009, D-010. Overview: `docs/intranet.md`.

**Post-merge (owner):** run the intranet migrations against production Supabase
(`supabase/migrations/20260829*.sql`), set `ADMIN_ROLE` if not `admin`, decide a
bulk-send provider for campaigns, then close the issue on GitHub.

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
| 56-L | Final E2E + docs — `chain.test.ts` drives the whole `reserva → cliente → factura → documento → calendario → historial → segmento` chain against the repository (134 unit total). `e2e/intranet.spec.ts` asserts every intranet route + export endpoint is private (75 chromium e2e green). `docs/intranet.md`, `docs/api/INDEX.md` (intranet functions + routes + migrations), `docs/SETUP.md` (ADMIN_ROLE, Airbnb feeds, campaign-send note), `.env.example`. Merged `develop → main`. | ✅ |

---

## Pending / backlog

Issues #1–#55 tracked in `docs/PROGRESS.md` sprint tables.
