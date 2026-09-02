import { apiOk, requireServiceAuth } from "@/lib/api";
import { runRetentionSweep } from "@/domains/privacy/sweep";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Issue #79 — monthly data-retention sweep: hard-deletes abandoned holds,
 * anonymises long-past cancelled/completed reservations, trims finished
 * lifecycle messages and old audit rows. Idempotent. Auth: CRON_SECRET (#64).
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;
  try {
    const result = await runRetentionSweep();
    return apiOk(result);
  } catch (err) {
    reportError(err, { scope: "cron/privacy" });
    return apiOk({ error: "sweep failed" }, 200);
  }
}

export const GET = run;
export const POST = run;
