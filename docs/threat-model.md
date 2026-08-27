# Threat model — Praetoria Vacacional

Project class: **web app** (public booking + payments + admin). Profile:
`references/security/web-app.md`.

## Assumptions

- Deployed on Vercel behind HTTPS; env vars set in the platform, never committed.
- Supabase base tables have RLS enabled with **no** anon/authenticated policies —
  only the service role (server-side) touches booking data (D-005).
- Guests never authenticate; the only credentialed surface is `/admin`.

## Controls

| Control | State | Where |
|---|---|---|
| Server-side price computation & re-validation | present | `domains/pricing`, `booking/checkout.ts` |
| Zod validation on every route/action input | present | `lib/validation.ts`, `lib/api.ts` |
| Overlap / double-booking prevention (DB-level) | present | GiST exclusion constraints + trigger + advisory lock |
| Reservation confirmed only via signed Stripe webhook | present | `api/webhooks/stripe`; success URL is not proof |
| Webhook + checkout idempotency | present | `webhook_events` unique; `idempotency_key` unique |
| Rate limiting on public POST routes | present (in-memory) | `lib/rate-limit.ts` — VERIFY: swap to Redis if multi-instance |
| Security headers (HSTS, XFO, nosniff, Referrer-Policy) | present | `next.config.ts` |
| Admin routes protected server-side | present | `middleware.ts` (cheap gate) + `requireAdmin()` in layout |
| Admin session cookie signed (HMAC), HttpOnly | present | `domains/admin/auth.ts` |
| Secrets never in client bundle | present | only `NEXT_PUBLIC_*` exposed via `publicEnv` |
| iCal feeds token-guarded | present | `?token=` / Bearer on import & cron |
| noindex on admin/checkout/api | present | `middleware.ts` X-Robots-Tag + route metadata |
| CSP | TO BUILD | add `Content-Security-Policy` once inline-script inventory is fixed |
| CSRF on admin server actions | partial | same-site cookie + Next action origin check; add explicit token if admin grows |
| Timing-safe admin password compare | present | `timingSafeEqual` |

## Not defended (deliberate, V1)

| Omission | Consequence | Why |
|---|---|---|
| No account lockout / captcha on admin login | brute-force possible against `ADMIN_PASSWORD` | single admin, strong password expected; rate-limit + long secret. Revisit if multi-user |
| In-memory rate limiter | resets per instance / on deploy | fine for single-region Vercel; documented upgrade path |
| No fraud scoring on payments | chargeback risk | Stripe Radar handles baseline; low volume |
| DEMO mode has no auth on the payment simulator | anyone can "confirm" a demo reservation | simulator is disabled the moment Stripe is configured; never in real production |
| No WAF beyond Vercel defaults | — | acceptable for V1 traffic |
