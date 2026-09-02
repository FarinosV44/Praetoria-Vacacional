# Durable jobs + transactional outbox (issue #76)

A single persisted queue for critical asynchronous work. Business code writes the
*intention* to do the work in the same operation as the change that needs it, so
a crash cannot lose it; idempotent workers lease and run the jobs.

## Why

Before this, `finalizeReservation` sent the confirmation email inline with a
3× in-process retry. A process restart between "reservation confirmed" and
"email sent" lost the email with no trace. Now the send is a `jobs` row written
next to the confirmation; a worker finishes it even across a redeploy.

## Model

| Concept | Where |
|---|---|
| Table | `jobs` — `supabase/migrations/20260901120000_jobs.sql` |
| Types (pure) | `src/domains/jobs/types.ts` |
| Backoff (pure) | `src/domains/jobs/backoff.ts` — exp. 30 s × 4, cap 6 h, 20 % floor jitter |
| State machine (pure) | `src/domains/jobs/policy.ts` — `decideNext` / `decideOrphan` |
| Metrics (pure) | `src/domains/jobs/metrics.ts` — `summarizeJobs` |
| Handlers | `src/domains/jobs/handlers.ts` — one idempotent fn per job type |
| Worker | `src/domains/jobs/runner.ts` — `runDueJobs()` |
| Enqueue / outbox helpers | `src/domains/jobs/enqueue.ts` |
| Repository | `enqueueJob` / `claimJobs` / `settleJob` / `listJobs` / `getJob` / `retryJob` / `cancelJob` (memory + supabase) |
| Admin | `/admin/procesos` |
| Scheduler | `/api/cron/jobs` — `CRON_SECRET`, every 2 min (`vercel.json`) |

### Statuses

`queued → running → (succeeded | retrying | dead_letter)` · `cancelled` (admin).
`retrying` returns to `running` once `run_after` passes.

### Job types

| Type | Payload | Handler does |
|---|---|---|
| `email.reservation_confirmation` | `{ reservationId }` | `sendReservationConfirmation` |
| `email.internal_notice` | `{ reservationId }` | `sendInternalReservationNotice` |
| `email.payment_failed` | `{ reservationId }` | `sendPaymentFailedNotice` |
| `ical.import` | `{ slug? }` | `importPropertyFeeds` / `importAllFeeds` |
| `holds.expire` | `{}` | `expireStaleHolds` |

`ical.import` and `holds.expire` still have their own dedicated cron endpoints
(`/api/ical/import`, `/api/cron/expire-holds`); they are *also* registered job
types so they can move onto the queue later with no new code.

## Guarantees (issue #76 acceptance criteria)

- **A crash after confirming a reservation cannot lose the confirmation email.**
  `finalizeReservation` calls `enqueueReservationEmails()` (persisted, keyed by
  `email.reservation_confirmation:<reservationId>`) *before* the inline
  `drainJobsSafely()` best-effort send.
- **Two workers never double-process a job.** `claimJobs` leases atomically —
  Postgres `claim_jobs` RPC (`FOR UPDATE SKIP LOCKED`); the in-memory claim body
  is synchronous.
- **Failed jobs survive redeploys and can be retried.** Rows in Postgres; the
  admin "Reintentar" button re-queues a `dead_letter`.
- **The admin can see what is stuck.** `/admin/procesos` → filter *Fallido
  (atascado)*, plus queue depth / oldest-pending age / error rate.
- **No coupling to a queue provider.** Callers use `enqueueJob()` and the
  `Repository`; a real broker can back the same methods later.

## Operating

- Set `CRON_SECRET` (Hostinger / Vercel). Without it `/api/cron/jobs` returns
  503 and the queue only advances opportunistically (on each confirmed booking).
- Dead letters need a human: fix the cause, then "Reintentar".
- `enqueueJob` with an `idempotencyKey` that already exists (non-cancelled) is a
  no-op returning the existing job.

## Tests

`backoff.test.ts` · `policy.test.ts` · `metrics.test.ts` · `runner.test.ts`
(happy path, idempotent enqueue, two concurrent workers, retry → dead-letter,
unknown type, admin retry, lease recovery) · repository contract cases in
`src/lib/repository/contract.ts`. `e2e/production.spec.ts` covers `/api/cron/jobs`
auth; `e2e/intranet.spec.ts` covers `/admin/procesos` privacy.
