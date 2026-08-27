import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { stripeEnabled } from "@/domains/payments/stripe";
import { getRepository } from "@/lib/repository";
import { finalizeReservation, markPaymentFailed } from "@/domains/booking/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reservationId: z.string().uuid(),
  outcome: z.enum(["success", "failure"]),
});

/**
 * DEMO-only payment simulator (issue #22 end-to-end without Stripe keys).
 * Disabled entirely once Stripe is configured.
 */
export async function POST(req: Request) {
  if (stripeEnabled) return apiError("El simulador está desactivado (Stripe configurado)", 403);

  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  const repo = getRepository();
  const reservation = await repo.getReservation(parsed.data.reservationId);
  if (!reservation) return apiError("Reserva no encontrada", 404);

  if (parsed.data.outcome === "failure") {
    await markPaymentFailed(reservation.id);
    return apiOk({ status: "failed", code: reservation.code });
  }

  const result = await finalizeReservation(
    reservation.id,
    `demo_pi_${reservation.id}`,
    reservation.totalCents,
  );
  if (!result.ok) return apiError("No se pudo confirmar la reserva", 409);
  return apiOk({ status: "confirmed", code: result.reservation!.code });
}
