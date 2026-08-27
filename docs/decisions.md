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

## D-007 — Availability source of truth
**Date:** 2026-08-27
`reservations` (status in confirmed/pending-not-expired) + `availability_blocks` together
define occupancy per property. Overlap prevention enforced in Postgres with an exclusion
constraint on a `daterange` (GiST), not only in application code. iCal imports land as
`availability_blocks` with `source='booking'`.
