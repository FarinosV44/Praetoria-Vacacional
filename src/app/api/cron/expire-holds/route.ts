import { getRepository } from "@/lib/repository";
import { apiOk, requireServiceAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Releases expired pending holds (issues #10, #11). Wire to Vercel Cron or an
 * external scheduler every ~5 min. Auth (issue #64): `Authorization: Bearer
 * <CRON_SECRET>` — Vercel Cron sends this automatically when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;

  const released = await getRepository().expireStaleHolds();
  return apiOk({ released });
}
