import { serveIcalFeed } from "@/domains/integrations/ical-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legacy export feed: /api/ical/<slug>.ics?token=<ICAL_EXPORT_TOKEN>
 * Prefer the clean tokenized path /api/ical/<slug>/<token>.ics
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  return serveIcalFeed(slug, token);
}
