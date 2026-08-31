import { apiOk, requireServiceAuth } from "@/lib/api";
import { importAllFeeds, importPropertyFeeds } from "@/domains/integrations/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls the configured Booking iCal feeds and updates availability_blocks
 * (issue #9). Auth (issue #64): `Authorization: Bearer <CRON_SECRET>` — Vercel
 * Cron sends this automatically. Idempotent — re-running does not duplicate.
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;

  const slug = new URL(req.url).searchParams.get("property");
  const reports = slug ? await importPropertyFeeds(slug) : await importAllFeeds();
  return apiOk({ reports });
}

export const GET = run;
export const POST = run;
