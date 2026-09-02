import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { env } from "@/lib/env";
import { reportError } from "@/lib/observability/report";
import { sendEmail, brandedEmail } from "@/domains/notifications/email";
import { formatMoney } from "@/lib/format";
import { computeRefund, type RefundComputation } from "./refund";

/**
 * Issue #67 — cancel a reservation and settle the refund in one operation.
 *
 * Refund amount comes from the property's cancellation policy (or an explicit
 * override). If Stripe holds a captured payment we issue the refund there
 * (idempotency-keyed); otherwise it's recorded as `manual` for the owner to pay
 * out. The reservation is always cancelled and its pending guest messages
 * retired even if the refund call fails — the refund is then reconciled later.
 */

export type RefundMethod = "stripe" | "manual" | "none";

export interface CancellationOutcome {
  refund: RefundComputation;
  refundCents: number;
  method: RefundMethod;
  stripeRefundId: string | null;
  note: string;
}

export async function cancelWithRefund(
  reservationId: string,
  opts: { reason: string; actorEmail?: string | null; overrideRefundCents?: number | null },
): Promise<CancellationOutcome> {
  const repo = getRepository();
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

  const property = getPropertyById(reservation.propertyId);
  const policy = property?.cancellationPolicy ?? { tiers: [{ daysBefore: 0, refundPercent: 0 }] };
  const refund = computeRefund(policy, reservation.checkIn, reservation.totalCents);

  const refundCents =
    opts.overrideRefundCents != null
      ? Math.max(0, Math.min(opts.overrideRefundCents, reservation.totalCents))
      : refund.refundCents;

  const payments = await repo.listPayments(500).catch(() => []);
  const captured = payments.find(
    (p) => p.reservationId === reservationId && p.status === "succeeded" && p.providerPaymentIntent,
  );

  let method: RefundMethod = "none";
  let stripeRefundId: string | null = null;
  let note = "";

  if (refundCents > 0 && captured?.providerPaymentIntent && env.stripeConfigured) {
    try {
      const { createRefund } = await import("@/domains/payments/stripe");
      const res = await createRefund(captured.providerPaymentIntent, refundCents, {
        idempotencyKey: `refund_${reservationId}`,
        reason: "requested_by_customer",
      });
      stripeRefundId = res.id;
      method = "stripe";
      note = `Reembolso Stripe ${res.id} (${formatMoney(refundCents)}, ${res.status}).`;
      await repo.upsertPayment({
        reservationId,
        provider: "stripe",
        providerPaymentIntent: captured.providerPaymentIntent,
        providerCheckoutSession: captured.providerCheckoutSession,
        status: "refunded",
        amountCents: captured.amountCents,
        currency: "EUR",
        raw: { refund: res },
      });
    } catch (err) {
      reportError(err, { scope: "booking/cancellation", extra: { reservationId } });
      method = "manual";
      note = `Reembolso de ${formatMoney(refundCents)} PENDIENTE — Stripe falló, revísalo manualmente.`;
    }
  } else if (refundCents > 0) {
    method = "manual";
    note = `Reembolso de ${formatMoney(refundCents)} pendiente de pago manual (sin pago capturado en Stripe).`;
  } else {
    note = "Sin reembolso según la política de cancelación.";
  }

  await repo.cancelReservation(reservationId, opts.reason);
  await repo.cancelReservationMessages(reservationId).catch(() => undefined);
  await repo
    .updateReservation(reservationId, {
      paymentState: refundCents >= reservation.totalCents ? "refunded" : refundCents > 0 ? "partial" : undefined,
      notes: `${opts.reason} · ${note}`,
    })
    .catch(() => undefined);

  // Guest notification — best effort, never blocks the cancellation.
  if (reservation.guestEmail) {
    const name = property?.name ?? "tu reserva";
    const html = brandedEmail({
      heading: "Reserva cancelada",
      intro: `Hemos cancelado tu reserva ${reservation.code} de ${name}.`,
      rows: [
        ["Localizador", reservation.code],
        ["Entrada", reservation.checkIn],
        ["Salida", reservation.checkOut],
        [
          "Reembolso",
          refundCents > 0
            ? `${formatMoney(refundCents)} (${refund.refundPercent}% según la política)`
            : "Sin reembolso según la política de cancelación",
        ],
      ],
      footer:
        method === "stripe"
          ? "El reembolso se abonará en el método de pago original en unos días hábiles."
          : refundCents > 0
            ? "Nos pondremos en contacto contigo para gestionar el reembolso."
            : "Si crees que hay un error, respóndenos a este correo.",
    });
    await sendEmail(
      reservation.guestEmail,
      `Reserva cancelada · ${name} · ${reservation.code}`,
      html,
      `Tu reserva ${reservation.code} ha sido cancelada. Reembolso: ${
        refundCents > 0 ? formatMoney(refundCents) : "0 €"
      }.`,
      { kind: "internal", reservationId },
    ).catch(() => undefined);
  }

  return { refund, refundCents, method, stripeRefundId, note };
}
