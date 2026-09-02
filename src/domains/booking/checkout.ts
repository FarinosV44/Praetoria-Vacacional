import "server-only";
import { env } from "@/lib/env";
import { publicEnv } from "@/lib/env";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug, getPropertyById } from "@/domains/properties/registry";
import { quoteForCheckout } from "./service";
import {
  enqueueReservationEmails,
  enqueuePaymentFailedEmail,
  drainJobsSafely,
} from "@/domains/jobs/enqueue";
import { syncReservationComms } from "@/domains/comms/dispatch";
import { createCheckoutSession, stripeEnabled } from "@/domains/payments/stripe";
import type { Reservation } from "./types";
import type { GuestDetailsInput, StartCheckoutInput } from "@/lib/validation";

export type StartResult =
  | { ok: true; reservation: Reservation; totalCents: number }
  | { ok: false; error: string; code: "unavailable" | "invalid" | "error" };

/** Step 1→2: re-price server-side and create the pending hold (issue #10). */
export async function startCheckout(input: StartCheckoutInput): Promise<StartResult> {
  const repo = getRepository();

  const existing = await repo.getReservationByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { ok: true, reservation: existing, totalCents: existing.totalCents };
  }

  const quote = await quoteForCheckout(
    input.property,
    input.checkIn,
    input.checkOut,
    input.guests,
    input.coupon,
  );
  if (!quote.ok) {
    return {
      ok: false,
      error: quote.error,
      code: quote.error.includes("disponible") ? "unavailable" : "invalid",
    };
  }

  // Only persist a coupon that the server actually applied.
  const applied = quote.quote.coupon?.applied ? quote.quote.coupon : null;

  try {
    const reservation = await repo.createHold({
      propertyId: quote.propertyId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      totalCents: quote.quote.totalCents,
      originalTotalCents: quote.quote.subtotalBeforeCouponCents,
      discountCents: applied?.discountCents ?? 0,
      couponCode: applied?.code ?? null,
      currency: "EUR",
      priceBreakdown: quote.quote,
      holdMinutes: env.RESERVATION_HOLD_MINUTES,
      idempotencyKey: input.idempotencyKey,
    });
    return { ok: true, reservation, totalCents: reservation.totalCents };
  } catch (err) {
    if (err instanceof PropertyUnavailableError) {
      return { ok: false, error: "Las fechas ya no están disponibles", code: "unavailable" };
    }
    console.error("startCheckout failed", err);
    return { ok: false, error: "No se pudo iniciar la reserva", code: "error" };
  }
}

export async function saveGuestDetails(input: GuestDetailsInput): Promise<Reservation> {
  const repo = getRepository();
  return repo.attachGuest({
    reservationId: input.reservationId,
    guestName: input.fullName,
    guestEmail: input.email,
    guestPhone: input.phone ?? null,
    termsAccepted: input.acceptTerms,
    notes: input.notes ?? null,
  });
}

export type PaymentStartResult =
  | { ok: true; mode: "stripe"; url: string }
  | { ok: true; mode: "demo"; url: string }
  | { ok: false; error: string };

/**
 * Step 3: begin payment. Re-validates the hold and availability BEFORE creating
 * any charge (issue #10). In DEMO mode (no Stripe) it returns a link to the
 * internal simulator so the full flow stays testable (issue #22).
 */
export async function beginPayment(
  reservationId: string,
  origin: string,
  locale: "es" | "en" = "es",
): Promise<PaymentStartResult> {
  const repo = getRepository();
  const langQ = locale === "en" ? "&lang=en" : "";
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) return { ok: false, error: "Reserva no encontrada" };
  if (reservation.status === "confirmed") {
    return {
      ok: true,
      mode: "demo",
      url: `${origin}/reserva/exito?code=${reservation.code}${langQ}`,
    };
  }
  if (reservation.status !== "pending") {
    return { ok: false, error: "La reserva ha expirado. Vuelve a empezar." };
  }
  if (reservation.holdExpiresAt && Date.parse(reservation.holdExpiresAt) < Date.now()) {
    await repo.expireStaleHolds();
    return { ok: false, error: "El tiempo de reserva ha expirado. Vuelve a empezar." };
  }
  if (!reservation.guestEmail) return { ok: false, error: "Faltan los datos de contacto" };

  const property = getPropertyById(reservation.propertyId);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  const successUrl = `${origin}/reserva/exito?code=${reservation.code}${langQ}`;
  const cancelUrl = `${origin}/reserva/error?code=${reservation.code}${langQ}`;

  if (!stripeEnabled) {
    await repo.upsertPayment({
      reservationId: reservation.id,
      provider: "demo",
      providerCheckoutSession: `demo_${reservation.id}`,
      status: "created",
      amountCents: reservation.totalCents,
      currency: "EUR",
    });
    return {
      ok: true,
      mode: "demo",
      url: `${origin}/reserva/simular?id=${reservation.id}${langQ}`,
    };
  }

  try {
    const session = await createCheckoutSession({
      reservationId: reservation.id,
      propertyId: reservation.propertyId,
      propertySlug: property.slug,
      propertyName: property.name,
      amountCents: reservation.totalCents,
      currency: "EUR",
      guestEmail: reservation.guestEmail,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      successUrl,
      cancelUrl,
    });
    await repo.upsertPayment({
      reservationId: reservation.id,
      provider: "stripe",
      providerCheckoutSession: session.id,
      providerPaymentIntent:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: "created",
      amountCents: reservation.totalCents,
      currency: "EUR",
    });
    return { ok: true, mode: "stripe", url: session.url! };
  } catch (err) {
    console.error("beginPayment stripe error", err);
    return { ok: false, error: "No se pudo iniciar el pago" };
  }
}

/**
 * Confirm a reservation after a VERIFIED payment. Idempotent — safe to call from
 * a repeated webhook (issue #11). Sends the confirmation email with retry.
 */
export async function finalizeReservation(
  reservationId: string,
  paymentIntentId: string,
  amountCents: number,
): Promise<{ ok: boolean; reservation?: Reservation }> {
  const repo = getRepository();
  const current = await repo.getReservation(reservationId);
  if (!current) return { ok: false };

  if (amountCents < current.totalCents) {
    console.error(`finalizeReservation: amount mismatch ${amountCents} < ${current.totalCents}`);
    return { ok: false };
  }

  const alreadyConfirmed = current.status === "confirmed";
  const reservation = alreadyConfirmed
    ? current
    : await repo.confirmReservation(reservationId, paymentIntentId);

  // Redeem the coupon exactly once, on first confirmation (issue #45).
  if (!alreadyConfirmed && reservation.couponCode) {
    try {
      const coupon = await repo.getCouponByCode(reservation.couponCode);
      if (coupon) {
        await repo.redeemCoupon(
          coupon.id,
          reservation.id,
          reservation.guestEmail,
          reservation.discountCents,
        );
      }
    } catch (err) {
      console.error("coupon redemption failed (reservation still confirmed)", err);
    }
  }

  await repo.upsertPayment({
    reservationId,
    provider: current.status === "confirmed" ? "stripe" : "stripe",
    providerPaymentIntent: paymentIntentId,
    providerCheckoutSession: null,
    status: "succeeded",
    amountCents,
    currency: "EUR",
  });

  // Emails go through the durable outbox (issue #76): the intention is persisted
  // in the same operation as the confirmation, so a crash here cannot lose it,
  // and a transient Resend failure is retried with backoff by the worker.
  // Failure to *enqueue* still never changes reservation state (issue #12/#42).
  if (!alreadyConfirmed) {
    await enqueueReservationEmails(reservation.id);
    // Best-effort: send synchronously now so the guest doesn't wait for a cron
    // tick. If this throws or the process dies, the queued job is the guarantee.
    await drainJobsSafely();
    // Schedule the lifecycle messages (pre-arrival … review). Issue #69.
    await syncReservationComms(reservation.id).catch((err) =>
      console.error("comms scheduling failed (reservation still confirmed)", err),
    );
  }

  return { ok: true, reservation };
}

export async function markPaymentFailed(reservationId: string): Promise<void> {
  const repo = getRepository();
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) return;
  await repo.upsertPayment({
    reservationId,
    provider: "stripe",
    providerPaymentIntent: null,
    providerCheckoutSession: null,
    status: "failed",
    amountCents: reservation.totalCents,
    currency: "EUR",
  });
  if (reservation.status === "pending") {
    await enqueuePaymentFailedEmail(reservation.id);
    await drainJobsSafely();
  }
}

export function siteOrigin(): string {
  return publicEnv.siteUrl.replace(/\/$/, "");
}

export { getPropertyBySlug };
