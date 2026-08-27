import { apiError, apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { startCheckoutSchema } from "@/lib/validation";
import { startCheckout } from "@/domains/booking/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "checkout-start", 20, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, startCheckoutSchema);
  if (!parsed.ok) return parsed.response;

  const result = await startCheckout(parsed.data);
  if (!result.ok) {
    return apiError(result.error, result.code === "unavailable" ? 409 : 422, { code: result.code });
  }

  const r = result.reservation;
  return apiOk({
    reservationId: r.id,
    code: r.code,
    holdExpiresAt: r.holdExpiresAt,
    totalCents: r.totalCents,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    guests: r.guests,
  });
}
