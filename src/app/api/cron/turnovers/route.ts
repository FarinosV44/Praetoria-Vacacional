import { apiOk, requireServiceAuth } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issue #70 — ensure a turnover task exists for every confirmed checkout in the
 * next 45 days. Idempotent (unique on reservation_id). Auth: CRON_SECRET (#64).
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;
  try {
    const created = await getRepository().reconcileTurnovers();
    return apiOk({ created });
  } catch (err) {
    reportError(err, { scope: "cron/turnovers" });
    return apiOk({ error: "reconcile failed" }, 200);
  }
}

export const GET = run;
export const POST = run;
