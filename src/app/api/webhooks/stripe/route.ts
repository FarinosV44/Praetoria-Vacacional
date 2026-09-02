import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { stripe, stripeWebhookEnabled } from "@/domains/payments/stripe";
import { finalizeReservation, markPaymentFailed } from "@/domains/booking/checkout";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook (issue #11).
 *  - signature verified against STRIPE_WEBHOOK_SECRET
 *  - event id de-duplicated via webhook_events (idempotent)
 *  - reservation confirmed ONLY here, from payment_intent metadata — never from
 *    a success URL.
 */
export async function POST(req: Request) {
  if (!stripeWebhookEnabled) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("stripe signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const repo = getRepository();
  const fresh = await repo.claimWebhookEvent("stripe", event.id, event.type, event.data.object);
  if (!fresh) return new Response("Already processed", { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const reservationId = session.metadata?.reservation_id;
        if (reservationId && session.payment_status === "paid") {
          const pi =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? session.id);
          await finalizeReservation(reservationId, pi, session.amount_total ?? 0);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const reservationId = pi.metadata?.reservation_id;
        if (reservationId) {
          await finalizeReservation(reservationId, pi.id, pi.amount_received ?? pi.amount);
        }
        break;
      }
      case "payment_intent.payment_failed":
      case "checkout.session.expired": {
        const obj = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session;
        const reservationId = obj.metadata?.reservation_id;
        if (reservationId) await markPaymentFailed(reservationId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    reportError(err, { scope: "webhook/stripe", tags: { eventType: event.type }, extra: { eventId: event.id } });
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
