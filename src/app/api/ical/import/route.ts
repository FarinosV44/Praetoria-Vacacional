import { env } from "@/lib/env";
import { apiError, apiOk } from "@/lib/api";
import { importAllFeeds, importPropertyFeeds } from "@/domains/integrations/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls the configured Booking iCal feeds and updates availability_blocks
 * (issue #9). Auth: `Authorization: Bearer <ICAL_EXPORT_TOKEN>` or Vercel cron.
 * Idempotent — re-running does not duplicate events.
 */
async function run(req: Request) {
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const tokenOk = env.icalExportConfigured && auth === `Bearer ${env.ICAL_EXPORT_TOKEN}`;
  if (!isVercelCron && !tokenOk) return apiError("No autorizado", 401);

  const slug = new URL(req.url).searchParams.get("property");
  const reports = slug ? await importPropertyFeeds(slug) : await importAllFeeds();
  return apiOk({ reports });
}

export const GET = run;
export const POST = run;
