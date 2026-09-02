import { apiError, apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { guestDetailsSchema } from "@/lib/validation";
import { saveGuestDetails } from "@/domains/booking/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "checkout-guest", 30, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, guestDetailsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const reservation = await saveGuestDetails(parsed.data);
    return apiOk({ reservationId: reservation.id, code: reservation.code });
  } catch (err) {
    console.error("checkout/guest failed", err);
    return apiError("No se pudieron guardar los datos", 500);
  }
}
