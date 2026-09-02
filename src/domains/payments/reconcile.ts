import "server-only";
import { getRepository } from "@/lib/repository";
import { env } from "@/lib/env";
import { reportError, reportMessage } from "@/lib/observability/report";

/**
 * Issue #67 — Stripe reconciliation cycle.
 *
 * Catches drift the webhook might have missed (a refund issued from the Stripe
 * dashboard, a `payment_intent` that succeeded while our endpoint was down).
 * Walks recent PaymentIntents that carry our `reservation_id` metadata and
 * aligns our `payments` row + the reservation's `paymentState`.
 */

export interface ReconcileResult {
  scanned: number;
  updated: number;
  refundsDetected: number;
}

export async function reconcileStripe(lookbackHours = 72): Promise<ReconcileResult> {
  const result: ReconcileResult = { scanned: 0, updated: 0, refundsDetected: 0 };
  if (!env.stripeConfigured) return result;

  const { stripe } = await import("./stripe");
  const repo = getRepository();
  const since = Math.floor((Date.now() - lookbackHours * 3_600_000) / 1000);

  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const list = await stripe().paymentIntents.list({
      limit: 100,
      created: { gte: since },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const pi of list.data) {
      const reservationId = pi.metadata?.reservation_id;
      if (!reservationId) continue;
      result.scanned += 1;

      const existing = await repo.getPaymentByIntent(pi.id).catch(() => null);
      const amountRefunded =
        typeof (pi as { amount_received?: number }).amount_received === "number"
          ? pi.amount_received
          : pi.amount;

      // A charge on the PI tells us about refunds.
      const charge =
        typeof pi.latest_charge === "string"
          ? await stripe().charges.retrieve(pi.latest_charge).catch(() => null)
          : (pi.latest_charge ?? null);
      const refunded = !!charge?.refunded || (charge?.amount_refunded ?? 0) > 0;

      let desiredStatus: "succeeded" | "failed" | "refunded" | "processing" = "processing";
      if (refunded) desiredStatus = "refunded";
      else if (pi.status === "succeeded") desiredStatus = "succeeded";
      else if (pi.status === "canceled" || pi.status === "requires_payment_method") desiredStatus = "failed";

      if (!existing || existing.status !== desiredStatus) {
        await repo.upsertPayment({
          reservationId,
          provider: "stripe",
          providerPaymentIntent: pi.id,
          providerCheckoutSession: existing?.providerCheckoutSession ?? null,
          status: desiredStatus,
          amountCents: amountRefunded || pi.amount,
          currency: "EUR",
          raw: { reconciledAt: new Date().toISOString(), piStatus: pi.status },
        });
        result.updated += 1;
        if (desiredStatus === "refunded") {
          result.refundsDetected += 1;
          await repo
            .updateReservation(reservationId, {
              paymentState: (charge?.amount_refunded ?? 0) >= pi.amount ? "refunded" : "partial",
            })
            .catch(() => undefined);
        }
      }
    }

    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  if (result.updated) {
    reportMessage("stripe reconciliation applied changes", "info", {
      scope: "payments/reconcile",
      extra: { ...result },
    });
  }
  return result;
}

export async function reconcileStripeSafe(lookbackHours?: number): Promise<ReconcileResult> {
  try {
    return await reconcileStripe(lookbackHours);
  } catch (err) {
    reportError(err, { scope: "payments/reconcile" });
    return { scanned: 0, updated: 0, refundsDetected: 0 };
  }
}
