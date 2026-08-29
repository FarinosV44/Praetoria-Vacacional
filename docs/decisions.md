# Decisions — Praetoria Vacacional

Append-only. The assistant never re-opens a decision on its own; an explicit user request
that contradicts one supersedes it as a new entry.

---

## D-001 — Stack
**Date:** 2026-08-27
Next.js 15 App Router + TypeScript + Tailwind v4 + Supabase (Postgres/Auth) + Stripe + Resend, deploy Vercel.
Chosen by the user in the build brief. Server-side validation everywhere; secrets never reach the client bundle.

## D-002 — The 33 issues are the functional spec
**Date:** 2026-08-27
We do not run Keel Phases 1–3 as separate ceremony. The GitHub issues define flows, scope
and acceptance criteria. Keel's cross-cutting discipline still applies in full (state files,
git flow, confidential-data gate, `web-app` security profile, accessibility, test-first for
pure logic, public-surface docs). Sprints map to issue clusters (see PROGRESS.md).
**Why:** the spec already exists and is detailed; re-deriving it would burn the budget without adding value.

## D-003 — External services on placeholder keys
**Date:** 2026-08-27 · user choice (batched setup question)
Supabase / Stripe / Resend are wired through a typed env layer. `.env.example` ships
example values; `docs/SETUP.md` is the step-by-step. The app builds, runs and the flows are
exercised with local/test doubles where possible. Live payment + email delivery is marked
`VERIFY` until real keys are added.
**Why:** user does not have the accounts provisioned yet and asked to keep building.

## D-004 — Property content is configurable placeholder data
**Date:** 2026-08-27 · user choice (batched setup question)
Each property = a DB row + a content config file in `src/content/properties/<slug>.ts`.
Placeholder text is clearly marked (`PLACEHOLDER:` prefix in copy fields is avoided in
production rendering by a `contentStatus` flag). No invented amenity, review, rating,
distance or legal fact is ever rendered as real. Reviews block renders empty-safe.
**Why:** the real Booking listings/photos were not provided; user asked to keep building.

## D-005 — Auth: admin only (no guest accounts)
**Date:** 2026-08-27
Issue #23 requires "no registration to book". Guests never authenticate. Supabase Auth is
used exclusively for the admin panel (email+password, single admin role to start, RLS-guarded).
Public booking data is written only through server actions / route handlers using the
service role key, never from the browser.

## D-006 — Money handling
**Date:** 2026-08-27
All money stored and computed as integer cents (`bigint`/`number` of cents), currency EUR.
Pricing is computed and re-validated server-side on every quote and again at checkout and
again in the Stripe webhook. The browser never supplies a price.

## D-008 — Issue #53: brand repositioning "Del Mediterráneo a la nieve, desde Valencia"
**Date:** 2026-08-28 · user choice (batched question on issue #53)
Issue #53 reframes the two properties as one year-round Valencia story (sea + city +
snow) and corrects two location facts the owner supplied as real:
- **Valencia Frente al Mar** is marketed as **playa de la Llastra** (entre Les Palmeres
  y El Perelló, litoral sur de Valencia, municipio de Sueca), **a pie de playa (~5 m de
  la arena)** with **frontal sea views**. "Mareny de Barraquetes" and "Les Palmeretes"
  are removed from all commercial copy.
- **Javalambre**: the drive to the slopes is **~10 min**, not ~20 min — corrected in
  every surface (copy, metadata, JSON-LD via `headlineDistance`/`nearby`, FAQs, photo
  alt text, and the paraphrased Booking review that stated "20 min").
**Scope chosen by the user:** *copy only* — geo coordinates, street address, postal
code and the legal tourist-registry line (`legal.ts`, which legally references Sueca /
Mareny de Barraquetes) are **kept unchanged**. `location.city` stays "Mareny de
Barraquetes" as structured data only: it now feeds JSON-LD `addressLocality` but is no
longer rendered — `PropertyPageView`/`PropertyCard` show `location.area · region`
instead, and `location.area` becomes the positioning label ("playa de la Llastra" /
"Camarena de la Sierra"). New editorial cluster pages proposed in the issue are
**deferred** to a follow-up (avoid thin content).
**Why:** the owner authored the corrected facts; without verified new coordinates/
address we do not invent structured location data (cf. D-004).

## D-007 — Availability source of truth
**Date:** 2026-08-27
`reservations` (status in confirmed/pending-not-expired) + `availability_blocks` together
define occupancy per property. Overlap prevention enforced in Postgres with an exclusion
constraint on a `daterange` (GiST), not only in application code. iCal imports land as
`availability_blocks` with `source='booking'`.

## D-009 — Issue #56: legal data + management intranet (epic)
**Date:** 2026-08-29 · user choice (batched questions on issue #56)
Issue #56 is worked as an epic split into sprints on `develop`; `develop → main`
merge happens only when the full `reserva → cliente → factura → PDF → calendario →
historial → segmento marketing` chain works end to end and persists correctly
(DEMO/in-memory + production migrations ready).
- **Part A (legal):** PRAETORIA, S.L. corporate data centralised in
  `src/content/company.ts` (single source). `legal.ts`, footer, contact page,
  Organization JSON-LD and transactional-email footer all read from it. The four
  legal docs stay separate (aviso-legal / privacidad / cookies / condiciones-reserva).
  Tourist-registry licence lines and property geo/address are unchanged (cf. D-008).
- **Invoice PDF model:** no owner PDF was provided → we build a clean, professional
  per-property invoice layout following the structure described in the issue
  (Javalambre / Valencia branding, emisor PRAETORIA S.L., descripción/cantidad/
  precio/coste table, total, configurable IVA-exemption text art. 20.Uno.23º LIVA).
  Owner refines visuals later.
- **Email campaigns:** the marketing module (segments, saved lists, CSV export of
  emails/phones/WhatsApp, campaign + promo-code scaffolding, consent + unsubscribe)
  is fully implemented; real bulk sending stays in `Aún no configurado` state with
  a double-confirmation step, to prevent accidental mass sends.

## D-010 — Issue #56: invoice document = branded HTML + print-to-PDF
**Date:** 2026-08-29
The invoice "PDF" is a deterministic, per-property-branded HTML document rendered
server-side at `/admin/facturas/[id]/documento` (behind `requireAdmin`, so it also
satisfies §10 "protección contra acceso directo a PDFs privados"). It has full
`@media print` styling and a "Descargar / Imprimir" button that calls
`window.print()` — every browser's "Save as PDF" produces the file.
- **Immutability / "no regenerar silenciosamente":** once issued, the invoice
  row and its line items are frozen by DB triggers (`invoices_immutability_guard`,
  `invoice_items_immutability_guard`); the document renderer is pure, so it always
  produces the identical output from the frozen data. An error is corrected by
  **anular + emitir una nueva**, never by editing.
- Binary PDF archival to object storage (a stored `.pdf` file per invoice) needs
  a storage bucket — recorded as a future option, not built now. The frozen row +
  deterministic renderer are the "copia/registro de cada factura emitida".
- Tax logic is configurable per property in `invoice_settings` (rate, exempt
  flag, note) — default is exempt with the art. 20.Uno.23º LIVA text; nothing is
  hardcoded irreversibly.
**Why:** no owner PDF was provided (D-009); a headless-browser or `@react-pdf`
dependency is heavier and more fragile than print-CSS for a document the owner
will restyle anyway.
