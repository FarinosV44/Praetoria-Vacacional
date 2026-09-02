import { apiOk, requireServiceAuth } from "@/lib/api";
import { runDueJobs } from "@/domains/jobs/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Job queue worker (issue #76). Leases and runs a batch of due jobs — durable
 * emails, iCal sync, hold expiry. Wire to Vercel Cron every ~2 min. Auth (issue
 * #64): `Authorization: Bearer <CRON_SECRET>`.
 *
 * The scheduler NEVER does work inline — it only drains this queue. Safe to run
 * concurrently: `claim_jobs` leases atomically.
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;

  const batch = Number(new URL(req.url).searchParams.get("batch")) || 20;
  const summary = await runDueJobs({ worker: "cron", batch: Math.min(Math.max(batch, 1), 50) });
  return apiOk(summary);
}

export const GET = run;
export const POST = run;
