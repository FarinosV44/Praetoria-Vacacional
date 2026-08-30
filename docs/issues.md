# Forge issues — Praetoria Vacacional

Living log of GitHub issues accessed or worked. Records the inventory, how each
resolved issue was fixed (diagnosis, resolution, commits, verification), and what
remains pending. Keel never closes an issue from code reading — comments only.

Last sweep: 2026-08-31

---

## V4 backlog — issues #61–#98 (opened 2026-08-31)

The **master issue #98** defines the order and philosophy: V4 optimises **one
metric — direct-booking conversion**. Visible product first; invisible infra
(#61–#85) only where it blocks bookings.

### Phase 1 · Conversión inmediata — P0 (do first, in this order)
| # | Title | Notes |
|---|---|---|
| #86 | Home "máquina de reservar" | Full rebuild: hero, trust bar, MAR/NIEVE selector, search-first, availability-with-price, social proof, direct-booking, editorial gallery, seasonal content, closing CTA. Assembles #89/#90/#91/#92. |
| #87 | Ficha Valencia "wow" | High-desire landing: sea-first hero, boutique gallery, impact block, sticky booking card, "despertarse frente al Mediterráneo", nearby, map, ideal-for, reviews, objection FAQ, blog links. |
| #88 | Ficha Javalambre "wow" | Snow-escape landing: hero, ~10 min claim, sticky card, "tu base para esquiar", Camarena, para-quién, weekend itinerary, non-ski, distances, snow FAQ. |
| #89 | Booking Bar V4 | Persistent premium booking bar — desktop sticky-on-scroll, mobile bottom bar + sheet, context-aware property preselect, keeps dates across navigation, no layout shift. |
| #90 | Prueba social premium | Rating + review count next to each property name; curated 3–5 review block per property; "lo que más valoran"; rating in home/fiche/results/checkout; mini social proof by CTA. Real data only, never mixed between properties. |
| #91 | Reserva directa que gane a Booking | Configurable real direct-booking benefits; "Reservando aquí vs plataforma" microblock; € savings when a promo applies (10PRAETORIA10); shown at decision points (home, fiche, checkout, landings). |
| #92 | Disponibilidad inteligente | Rescue a no-availability search: nearby free dates, equivalent weekends, the other property, keep guests+duration, one-tap to move. Alternative cards with total price + "Elegir estas fechas". Real availability only. |
| #93 | Galería premium | Reorder galleries by commercial impact; 1 hero + 4–6 sales photos + full gallery; categories; fast fullscreen mobile lightbox; per-image focal point; property-specific crops. |

### Phase 2 · Captación orgánica — P0/P1
| # | Title | Notes |
|---|---|---|
| #94 | Blog SEO que venda | Editorial calendar, local clusters, contextual CTAs to booking. Absorb non-duplicating parts of #46. |
| #95 | Landings SEO locales | Llastra, El Perelló, Albufera, Camarena, Javalambre. Absorb non-duplicating parts of #47. |
| #96 | Ofertas y escapadas | Commercial pages: weekends, puentes, verano, nieve, última hora. Absorb non-duplicating parts of #48. |

### Phase 3 · Cierre asistido — P1
| # | Title | Notes |
|---|---|---|
| #97 | WhatsApp Concierge comercial | Resolve doubts + close bookings without leaving the funnel. |

### Infra / platform hardening — #61–#85 (deferred by #98 unless it blocks bookings)
| # | Title | Owner input needed |
|---|---|---|
| #61 | CI/CD: quality gates, previews, dep security, branch protection | GitHub settings / Vercel |
| #62 | Distributed rate limiting + anti-abuse for Vercel/serverless | Upstash/KV provider choice |
| #63 | Production fail-closed: block DEMO_MODE + incomplete critical config | — (buildable) |
| #64 | Internal endpoints + cron: strong auth, CRON_SECRET, service-to-service | — (buildable) |
| #65 | Admin multiuser: Supabase Auth, MFA, revocable sessions, per-user RBAC | Supabase Auth + MFA decision |
| #66 | Observability: errors, traces, structured logs, metrics, alerts | Sentry/monitoring vendor |
| #75 | Supabase security hardening: RLS, least privilege, service-role boundaries | — (buildable, partly done in D-021) |
| #76 | Durable jobs + transactional outbox (emails, sync, campaigns) | — (buildable) |
| #77 | Design system V4 + visual regression | — (buildable; feeds Phase 1) |
| #78 | Performance budgets + Lighthouse CI + real CWV | CI + deployed URL |
| #80 | Backup, DR, restore drills, RPO/RTO | Supabase plan / ops |
| #83 | Repo refactor by domain + contract tests (Memory vs Supabase parity) | — (buildable; D-021 started this pattern) |
| #84 | Channel sync resilience: iCal reconciliation, stale feeds, conflicts, adapters | — (buildable) |

### V4 product — #67–#74, #79, #81, #82, #85 (deferred; mostly need owner decisions)
| # | Title | Owner input needed |
|---|---|---|
| #67 | Cancellation / refund / Stripe reconciliation cycle | Refund policy, Stripe live |
| #68 | Passwordless guest portal (manage booking, pay, invoice, arrival, requests) | — (large; needs Stripe/email live) |
| #69 | Guest comms automation (pre-stay, arrival, checkout, review) | Email/WhatsApp provider |
| #70 | Housekeeping & turnovers | Ops workflow decisions |
| #71 | Property maintenance & incidents (tickets, photos, priority, cost) | Ops workflow decisions |
| #72 | Digital check-in + Spain traveller registry (SES.HOSPEDAJES) | Legal/compliance, Guardia Civil creds |
| #73 | Real marketing in production (provider, deliverability, bounces, suppression) | Provider choice (Resend Broadcasts / other) |
| #74 | Revenue management: explainable dynamic pricing, guardrails | Pricing strategy decisions |
| #79 | Privacy lifecycle / GDPR operational (retention, rights, consent, deletion) | Legal / DPO |
| #81 | Media Library (secure uploads, optimisation, ALT, focal point, reuse) | Storage bucket |
| #82 | Business Intelligence: occupancy, ADR, RevPAR, channel, conversion, profitability | — (buildable once data exists) |
| #85 | Complete i18n: ES/EN across SEO content, blog, guides, legal, end-to-end | Translation effort |
| #98 | MASTER · Sales Machine roadmap | (this triage) |

**Working plan:** execute Phase 1 (#86→#93) in #98's order, then Phase 2, then
#97. Infra issues are picked up only when they block a Phase 1/2 item. Each issue
→ its own commit(s) on `develop`; `develop → main` in batches on the user's
instruction.

---

## In progress (on `develop`, not yet on `main`)

### #60 · Admin Panel V2 — ✅ code, merged to `main`

Premium admin redesign, built in-code (no design handoff — D-020). Sprints:
60-A shell (`admin.css` design system scoped to `.admin-shell`, `AdminNav`
11-item IA, `AdminTopbar` "Acciones" menu, responsive drawer, `/admin/
alojamientos` hub, `SiteChrome` removes public chrome under `/admin`) ·
60-B dashboard V2 (entradas/salidas, alojados ahora, ocupación 30/60/90, huecos
difíciles `calendar/gaps.ts`, pagos con incidencia) · 60-C/D calendar + price
editing (weekday/weekend/month selection, fixed € or %, preview, save
confirmation) · 60-E `sellExactGaps` (gap-fill below minimum stay, pure
`booking/gap-fill.ts`) · 60-F per-property tabbed fiche
`/admin/alojamientos/[slug]` · 60-G reservations V2 table + quick-filter chips +
detail timeline · 60-H whole-admin harmonisation via token remapping.
`e2e/admin-dod.spec.ts` drives the issue's full "definición de terminado" flow.
Verification: `tsc`+`lint`+`build` clean · 212 unit · 17 admin e2e · 78 public
e2e. D-018…D-020. **Post-merge (owner):** redeploy `main`; close on GitHub.

### #58 · Limpieza opcional y configurable — ✅ code on `develop`

**Resolution:** `RateConfig.cleaningFeeCents` → configurable `fees: StayFee[]`
(`key`/`label`/`enabled`/`amountCents`/opt. `description`/`taxable`). Pure
`src/domains/pricing/fees.ts` resolves only `enabled && amountCents > 0` charges;
the engine adds them and taxes the taxable ones. **Default OFF** for both
properties (`src/content/rates/index.ts`); owner enables from Admin → Precios y
reglas → "Cargos opcionales" (no redeploy). Legacy `cleaningFeeCents > 0`
overrides still bill one cleaning charge (no silent change). Applied `fees` are
snapshotted in the reservation breakdown. `Quote.cleaningFeeCents` removed
(→ `fees` / `feesCents`) so no "0 €" line can render. Stripe already bills one
line at the total; invoice draft is one stay line at the total → both reflect
only applied concepts. Public "limpieza incluida" copy softened. Also raised
Valencia `maxGuests` 4 → 6 to match D-013 (D-019). D-018.
`e2e/cleaning-fee.spec.ts` (2). 24 fee/engine unit tests.

### #59 · Calendario: checkout en día ocupado + estancia mínima por noches — ✅ code on `develop`

**Diagnosis:** the half-open `[check-in, check-out)` model was already correct in
the booking engine, the pricing min-nights check, the iCal parser and the
Postgres exclusion constraints. The only defect was the public
`AvailabilityCalendar` UI: it disabled every `busy` day, so a day occupied purely
by another guest's arrival (previous night free) could not be chosen as a
check-out — the exact 21→24 scenario from the issue.

**Resolution:** new pure `src/domains/booking/calendar-select.ts`
(`isDaySelectable` / `applyDayClick` / `dayRole` / `nightsClear` / `stayNights`,
15 unit tests covering all 8 mandatory cases). `AvailabilityCalendar` rebuilt on
it: departure-only days stay selectable, drawn as a diagonal half-cell with an
explicit aria-label + a 3-state legend; min-stay shown by real nights and flagged
red below the minimum. `e2e/calendar-checkout.spec.ts` seeds a hold and verifies
its arrival day is `exit-only`, enabled and completes a 3-night range. D-017.
Also fixed a latent pre-existing `tsc` error in `e2e/home-faq-spacing.spec.ts`.

**Verification (#58 + #59 together):** `tsc` + `next lint` + `next build` clean ·
**199 unit** · **full chromium e2e suite 89 green** (fresh server, `--workers=1`).

**Post-merge (owner):** redeploy `main` — no migration. To start charging for
cleaning again, open Admin → Precios y reglas, tick "Activado" on the Limpieza
row for each property and set the amount.

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
