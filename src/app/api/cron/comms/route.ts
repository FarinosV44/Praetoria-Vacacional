import { apiOk, requireServiceAuth } from "@/lib/api";
import { dispatchDueMessages } from "@/domains/comms/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Guest communications worker (issue #69). Sends the scheduled lifecycle
 * messages (pre-arrival, check-in info, check-out reminder, review request)
 * whose time has come. Idempotent — a message is sent exactly once; failures
 * retry on later ticks and land in `failed` after 4 attempts. Auth (#64):
 * `Authorization: Bearer <CRON_SECRET>`. Wire to a ~15-min cron.
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;

  const limit = Number(new URL(req.url).searchParams.get("limit")) || 25;
  const summary = await dispatchDueMessages(Math.min(Math.max(limit, 1), 100));
  return apiOk(summary);
}

export const GET = run;
export const POST = run;
