# Praetoria Vacacional

Multi-property direct-booking platform for two holiday rentals with contrasting
experiences — **Javalambre Mountain SuperSki** (snow) and **Valencia Frente al Mar**
(sea) — sharing one booking engine, payment system and admin panel.

Built for strong technical + local SEO, excellent Core Web Vitals, and a
booking flow a first-time visitor can complete in three steps on a phone.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database + admin auth | Supabase (Postgres, Auth) |
| Payments | Stripe Checkout + signed webhooks |
| Email | Resend |
| Hosting | Vercel (target) |
| Tests | Vitest (unit), Playwright (e2e) |

## Architecture

Domain-separated under `src/domains/`:

- `properties/` — the property registry. **Adding a third property is a config change**,
  not an architecture change: add `src/content/properties/<slug>.ts`, register it,
  seed a `properties` row.
- `pricing/` — pure server-side price engine (seasons, weekends, min-stay, discounts,
  extra-guest fees). The browser never sends a price.
- `booking/` — availability (half-open night ranges, overlap prevention), checkout
  orchestration, hold expiry.
- `payments/` — Stripe.
- `integrations/` — iCal import/export per property.
- `marketing/` — the single source of truth for indexable URLs (sitemap, breadcrumbs).
- `admin/` — session auth + destructive-action server actions.

Data access goes through `getRepository()` which returns either the Supabase
implementation or an **in-memory implementation (DEMO mode)** when Supabase is not
configured — so the whole site, including the full booking flow, runs locally with
zero credentials.

## Getting started

```bash
npm install
cp .env.example .env.local     # runs in DEMO mode as-is
npm run dev                      # http://localhost:3000
```

DEMO mode: no database, data seeded from `src/content`, payments simulated at
`/reserva/simular`. See `docs/SETUP.md` to connect Supabase, Stripe and Resend.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run test` | Vitest unit suite |
| `npm run test:e2e` | Playwright |
| `npm run db:reset` | Apply Supabase migrations locally |
| `node scripts/make-placeholders.mjs` | Regenerate placeholder images |

## Deployment

Push `develop` → merge to `main` → Vercel builds. Set every variable from
`.env.example` in the Vercel project. Configure the two cron jobs in `vercel.json`
(hold expiry + iCal import). Add the Stripe webhook endpoint
(`/api/webhooks/stripe`) and paste its signing secret.

## Project state

`docs/PROGRESS.md` is the living status. `docs/decisions.md` records why choices
were made. The work is organised as sprints against the 33 GitHub issues.
