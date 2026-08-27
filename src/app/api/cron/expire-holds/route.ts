import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { apiError, apiOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Releases expired pending holds (issues #10, #11). Wire to Vercel Cron or an
 * external scheduler every ~5 min. Auth: `Authorization: Bearer <ICAL_EXPORT_TOKEN>`
 * (reuses the same shared secret) or Vercel's cron header.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const tokenOk =
    env.icalExportConfigured && auth === `Bearer ${env.ICAL_EXPORT_TOKEN}`;
  if (!isVercelCron && !tokenOk) return apiError("No autorizado", 401);

  const released = await getRepository().expireStaleHolds();
  return apiOk({ released });
}
