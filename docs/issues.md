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

### Phase 1 · Conversión inmediata — P0  ·  ✅ COMPLETE (#86–#93)
| # | Status | Notes |
|---|---|---|
| #86 | ✅ | Search-first hero + MAR/NIEVE `ExperienceSelector` (editorial two-panel: scene-setting photo — sea view / snowy village — + rating) + direct-booking nudge/compare, on DS V4. Gallery reordered for conversion + "Ver todas las fotos" CTA. D-028. |
| #87 | ✅ | Impact block, `<RatingBadge>` header, `<DirectBookingCompare>`, **OpenStreetMap location embed**, "Ideal para" chips, gallery hero = the sea-facing salón. Copy anchored to what the photos prove ("vistas frontales al mar desde el salón y la terraza"); the unverifiable bedroom-facing-sea line was replaced. D-028. |
| #88 | ✅ | Weekend itinerary (`weekendPlan`), "Ideal para" chips, DS V4. "Qué hacer si no esquías" is covered by the existing source-backed section (senderismo · BTT · escalada · barranquismo · micología · Starlight / observatorio) + the Sunday plan; the dynamic season message is `<AvailabilityNote>` (real occupancy only). D-028. |
| #89 | ✅ | `BookingBar` in `SiteChrome` on every public page (hidden on admin/checkout). `stay.ts` sessionStorage store keeps property/dates/guests across nav. Desktop pill after scroll; mobile bottom bar (suppressed on home + fiches which have their own module) + sheet. `<PreferProperty>` on fiche/landing. `e2e/booking-bar.spec.ts`. |
| #90 | ✅ | `<RatingBadge>` (real, source-attributed, per-property) in the BookingWidget header, search results, the Booking Bar sheet and the **checkout summary**. `AvailabilityResult.rating`. |
| #91 | ✅ | `content/site.ts` `directBooking` (promo + factual "aquí vs plataforma", ES/EN). `<DirectBookingCompare>` + `<DirectBookingSaving>` (€ saving when a real total is known). Wired: home, BookingWidget CTA, checkout summary, property closing section. |
| #92 | ✅ | `alternatives.ts` (nearby windows, weekend fallbacks, real availability only). `checkProperty` returns priced `alternatives`. Cards with total price + "Elegir estas fechas" in `AvailabilitySearch`, `BookingWidget`, the Booking Bar sheet. `e2e/smart-availability.spec.ts`. |
| #93 | ✅ | `ResponsivePhoto.focal`/`.category` → `object-position`, `GalleryLightbox` swipe. `photo-manifest.json` curated from the real photos: order tuned for conversion, `focal` on wide-crop shots, `category` tags, misrepresented climbing-topo dropped. D-028. |

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
| #62 | ✅ code — `src/lib/rate-limit.ts` rebuilt: pure window math (`windowBucket`/`evaluate`) + a pluggable store — `memory` (Map) or `redis` (Upstash REST `/pipeline`, 2 s timeout, falls back to memory on error, fails **open** for limiting / **safe** for the denylist). `enforceRateLimit` is now async: per-IP fixed window + `Retry-After`, and ≥25 breaches in 5 min → 15-min temp denylist (`denyClient`/`isDenied`, reported to observability). All 8 API callers updated. Aliases `KV_REST_API_*`. `config-status` "rate_limit" feature. 7 unit tests. D-032. **Owner:** optional — set `UPSTASH_REDIS_REST_URL`/`_TOKEN` only if you run more than one instance. |
| #63 | Production fail-closed: block DEMO_MODE + incomplete critical config | — (buildable) |
| #64 | Internal endpoints + cron: strong auth, CRON_SECRET, service-to-service | — (buildable) |
| #65 | ✅ code — `admin_users` table (migration `20260902130000`: role · `active` · `sessions_valid_from` revoke watermark · `mfa_required` · invite token hash). Pure `resolveAdminAccess` / `sessionAcceptable` / invite-token helpers (9 tests). `getAdminContext()` (React-`cache`d) resolves the current operator from a **Supabase Auth session → `admin_users` row** when Supabase is configured, else the password cookie (+ synthetic `ADMIN_ROLE` context in DEMO). `assertCapability` is now async and per-user, with an MFA gate on `settings.write`/`invoices.write`. `/admin/usuarios` — invite (Supabase `inviteUserByEmail`), change role, activate/deactivate, force MFA, close all sessions, delete; last-admin guard. `/admin/seguridad` + login `MfaGate` — TOTP enroll/challenge via Supabase Auth MFA (AAL2). `logAction` actor = current user. 7 repo methods (memory + supabase, parity green). D-033. **Owner:** enable Auth on the Supabase project, `supabase db push`, sign in once with an `ADMIN_EMAILS` address, then invite the rest + do a live pass. Password login still works as today until then. |
| #66 | ✅ code — `src/lib/observability/*`: always-on structured logging (`log.*`, one JSON line per event in prod, PII-key scrubbing) + `reportError`/`reportMessage` that forward to **Sentry with no SDK** — pure `parseDsn` + `buildEnvelope` (3-line envelope) POSTed with a 2.5 s timeout, fire-and-forget, never throws. `instrumentation.ts` `onRequestError` catches every server error; `/api/observability/client-error` (rate-limited 10/min) receives browser errors from the route + global error boundaries via `sendBeacon`. Stripe webhook handler failures now reported with event context. `config-status` "observability" feature on `/admin/configuracion`. 5 unit tests (scrub, DSN parse, envelope). D-031. **Owner:** set `SENTRY_DSN` (+ `NEXT_PUBLIC_SENTRY_DSN` for the browser path); optional `LOG_LEVEL`. |
| #75 | ✅ code — migration `20260831130000_rls_hardening.sql` + `rls_hardening.test.sql`. RLS enabled+forced on all 24 app tables (`content_overrides` was the gap), anon/authenticated stripped of every table + RPC grant, default privileges locked, availability RPCs → service_role only. D-024. **Owner:** `supabase db push`. |
| #76 | ✅ code — `jobs` table + `claim_jobs` RPC (migration `20260901120000`, `FOR UPDATE SKIP LOCKED`, RLS forced). Pure `backoff`/`policy`/`metrics`; `handlers`/`runner`/`enqueue`; `Repository` gains `enqueueJob`/`claimJobs`/`settleJob`/`listJobs`/`getJob`/`retryJob`/`cancelJob` (memory + supabase). `finalizeReservation` + `markPaymentFailed` enqueue the emails (idempotency-keyed, crash-safe) then drain inline best-effort. `/api/cron/jobs` (CRON_SECRET, every 2 min) is the sole scheduled processor. `/admin/procesos` — queue depth / oldest-pending / error rate, dead-letter list, retry + cancel (`settings.write`, audited). 28 unit + 3 contract cases + e2e. D-029. **Owner:** `supabase db push`; set `CRON_SECRET`. |
| #77 | ✅ code — `globals.css` rebuilt as a token system + `.pv-*` component vocabulary (buttons/cards/fields/chips/badges/notes/FAQ) + `ui/{Button,Card,Field,SectionHeading}`. Full public-site sweep (~45 ad-hoc strings replaced). `e2e/visual.spec.ts` full-page regression, 10 templates × 2 widths. D-027. |
| #78 | Performance budgets + Lighthouse CI + real CWV | CI + deployed URL |
| #80 | Backup, DR, restore drills, RPO/RTO | Supabase plan / ops |
| #83 | ✅ code — `src/lib/repository/contract.ts` shared behavioural spec + `contract.memory.test.ts` (9 cases against the in-memory store) + a static method-surface parity check (memory ⇔ supabase). D-025. |
| #84 | ✅ code — `feed-health.ts` (stale/failing/never verdict, shown on `/admin/sincronizacion`) + `conflicts.ts` (feed night vs direct booking, surfaced in `ImportReport` + `RunSyncButton`). 12 unit tests. Adapters scoped out (two channels, same iCal shape). D-025. |

### V4 product — #67–#74, #79, #81, #82, #85 (deferred; mostly need owner decisions)
| # | Title | Owner input needed |
|---|---|---|
| #67 | Cancellation / refund / Stripe reconciliation cycle | Refund policy, Stripe live |
| #68 | Passwordless guest portal (manage booking, pay, invoice, arrival, requests) | — (large; needs Stripe/email live) |
| #69 | ✅ code — `src/domains/comms/*`: pure `planReservationComms` (reservation + per-property `CommRule[]` → desired `pre_arrival`/`checkin_info`/`checkout_reminder`/`review_request` messages; drops anything under a 24 h lead; 8 tests) + `templates.ts` (ES/EN, property tone, owner-set check-in/out notes, no invented access details — L-008). `scheduled_messages` table (migration `20260902120000`, one row per (reservation, kind), RLS forced, service_role only) + 7 `Repository` methods (memory + supabase). `syncReservationComms` reconciles on confirmation (`finalizeReservation`) + admin re-plan; `cancelReservationMessages` on cancel. `/api/cron/comms` (CRON_SECRET, every 15 min) sends due messages via the existing Resend module, idempotent, 4 attempts w/ 30-min backoff → dead-letter. `/admin/comunicaciones` (log + manual resend) + `/admin/comunicaciones/ajustes` (per-property rules + arrival/departure notes). Audited. Reuses the #12 email pipeline — no new provider. D-030. **Owner:** apply migration `20260902120000`; add `/api/cron/comms` to the cron scheduler (already in `vercel.json`). |
| #70 | Housekeeping & turnovers | Ops workflow decisions |
| #71 | Property maintenance & incidents (tickets, photos, priority, cost) | Ops workflow decisions |
| #72 | Digital check-in + Spain traveller registry (SES.HOSPEDAJES) | Legal/compliance, Guardia Civil creds |
| #73 | Real marketing in production (provider, deliverability, bounces, suppression) | Provider choice (Resend Broadcasts / other) |
| #74 | Revenue management: explainable dynamic pricing, guardrails | Pricing strategy decisions |
| #79 | ✅ code — `src/domains/privacy/*`. Pure `retention.ts` (per-record `keep`/`anonymize`/`delete` verdicts + `DEFAULT_RETENTION`) and `erasure.ts` (`planErasure` respects legal holds — active/future booking, invoice inside the 6-year fiscal window → keep/anonymise with a reason). 11 unit tests. `collectSubjectData(email)` assembles the full bundle; `buildDataExport` → RGPD art. 15/20 JSON; `applyErasurePlan` deletes/anonymises via 5 new repo methods (memory + supabase, parity green). `/admin/privacidad` — search a subject, download their data, preview the erasure plan, apply it (type BORRAR); + retention-policy summary + "ejecutar barrido ahora". `runRetentionSweep` also wired to `/api/cron/privacy` (monthly, CRON_SECRET). Audited (subject hashed). No migration — anonymisation is in-place. D-034. **Owner:** review the retention windows with your DPO; add the monthly cron. |
| #81 | Media Library (secure uploads, optimisation, ALT, focal point, reuse) | Storage bucket |
| #82 | ✅ code — pure `analytics/kpis.ts` (occupancy · ADR · RevPAR · channel mix · lead time · cancellation · direct share) + `/admin/analitica` 12-month view, per-property filter, MoM deltas. 12 unit tests. No schema. D-026. |
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
