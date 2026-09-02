import { apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { z } from "zod";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";

/**
 * Issue #66 — sink for browser-side errors reported by the route error
 * boundaries. Deliberately tiny surface: a message, an optional digest and the
 * path. No stack from the client is trusted for grouping; it is attached as
 * context only. Heavily rate-limited so it can't be used to spam the log.
 */
const schema = z.object({
  message: z.string().trim().min(1).max(500),
  digest: z.string().trim().max(100).optional(),
  path: z.string().trim().max(300).optional(),
  boundary: z.enum(["route", "global"]).optional(),
});

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "client-error", 10, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  reportError(new Error(parsed.data.message), {
    scope: "client",
    tags: { boundary: parsed.data.boundary ?? "route" },
    extra: { path: parsed.data.path, digest: parsed.data.digest, source: "browser" },
  });

  return apiOk({ received: true });
}
