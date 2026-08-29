import { serveIcalFeed } from "@/domains/integrations/ical-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clean tokenized export feed — no query string, ends in `.ics`:
 *   /api/ical/javalambre/<ICAL_EXPORT_TOKEN>.ics
 *   /api/ical/valencia/<ICAL_EXPORT_TOKEN>.ics
 * This is the URL to paste into Booking.com / Airbnb.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  const { slug, token } = await params;
  return serveIcalFeed(slug, token);
}
