import { apiOk, requireServiceAuth } from "@/lib/api";
import { reconcileStripeSafe } from "@/domains/payments/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Issue #67 — Stripe reconciliation cycle. Aligns our payment/reservation state
 * with Stripe for anything the webhook missed (dashboard refunds, downtime).
 * Auth: CRON_SECRET (#64). Run a few times a day.
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;
  const result = await reconcileStripeSafe();
  return apiOk(result);
}

export const GET = run;
export const POST = run;
