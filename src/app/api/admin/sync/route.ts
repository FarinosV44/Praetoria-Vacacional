import { apiError, apiOk } from "@/lib/api";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { importAllFeeds, importPropertyFeeds } from "@/domains/integrations/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Admin-triggered iCal import. Auth = admin session (issue #42). */
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return apiError("No autorizado", 401);
  const slug = new URL(req.url).searchParams.get("property");
  const reports = slug ? await importPropertyFeeds(slug) : await importAllFeeds();
  return apiOk({ reports });
}
