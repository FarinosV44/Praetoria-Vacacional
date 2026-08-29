import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { propertySlugSchema } from "@/lib/validation";
import { buildExportFeed } from "./sync";

/**
 * Shared handler for the public iCal export feeds (issue #9).
 *
 * Maximally compatible with Booking.com's iCal importer:
 *  - always HTTP 200, no redirects
 *  - Content-Type: text/calendar; charset=utf-8
 *  - NO Content-Disposition (an "attachment" makes validators treat it as a
 *    file download, not a live calendar)
 *  - the body is a full RFC 5545 VCALENDAR (CRLF, folded lines, never empty)
 *
 * Reached via either:
 *  - /api/ical/<slug>/<token>.ics   (clean, no query string — preferred)
 *  - /api/ical/<slug>.ics?token=…   (legacy, still supported)
 */
function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function tokenMatches(provided: string): boolean {
  const expected = env.ICAL_EXPORT_TOKEN;
  if (!env.icalExportConfigured || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function serveIcalFeed(rawSlug: string, rawToken: string): Promise<Response> {
  const slug = rawSlug.replace(/\.ics$/i, "").trim().toLowerCase();
  const token = rawToken.replace(/\.ics$/i, "").trim();

  if (!propertySlugSchema.safeParse(slug).success) {
    return textResponse("Not found", 404);
  }
  if (!tokenMatches(token)) {
    return textResponse("Forbidden", 403);
  }

  const ics = await buildExportFeed(slug);
  if (!ics) return textResponse("Not found", 404);

  return new Response(ics, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-length": String(Buffer.byteLength(ics, "utf8")),
      // Booking re-fetches frequently; keep it fresh, never a stale cache.
      "cache-control": "no-cache, max-age=0, must-revalidate",
      "x-robots-tag": "noindex, nofollow",
      // deliberately NO content-disposition
    },
  });
}
