import { env } from "@/lib/env";
import { propertySlugSchema } from "@/lib/validation";
import { buildExportFeed } from "@/domains/integrations/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public export feed for a property: /api/ical/<slug>.ics?token=<ICAL_EXPORT_TOKEN>
 * Booking.com subscribes to this. Token-guarded so the feed is not world-readable.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.replace(/\.ics$/i, "");

  if (!propertySlugSchema.safeParse(slug).success) {
    return new Response("Not found", { status: 404 });
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!env.icalExportConfigured || token !== env.ICAL_EXPORT_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  const ics = await buildExportFeed(slug);
  if (!ics) return new Response("Not found", { status: 404 });

  return new Response(ics, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}.ics"`,
      "cache-control": "no-store",
    },
  });
}
