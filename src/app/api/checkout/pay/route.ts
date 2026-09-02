import { z } from "zod";
import { apiError, apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { beginPayment, siteOrigin } from "@/domains/booking/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reservationId: z.string().uuid(),
  locale: z.enum(["es", "en"]).optional(),
});

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "checkout-pay", 15, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  // Prefer the request origin (correct in previews) but fall back to configured.
  const origin = req.headers.get("origin") ?? siteOrigin();

  const result = await beginPayment(parsed.data.reservationId, origin, parsed.data.locale ?? "es");
  if (!result.ok) return apiError(result.error, 409);
  return apiOk({ url: result.url, mode: result.mode });
}
