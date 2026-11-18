import "server-only";
import type Stripe from "stripe";
import { markOrderPaid, markOrderPaymentFailed } from "./service";
import { invoiceUrlForSession, TRAMITES_ORDER_KIND, TRAMITES_SUBSCRIPTION_KIND } from "./stripe";
import { serverStore } from "./repo";

/**
 * Eventos de Stripe del servicio de trámites. Devuelve `true` si el evento era
 * nuestro (y se ha procesado), `false` para que el webhook siga con reservas.
 * La firma y la deduplicación por id de evento las hace la ruta común.
 */
export async function handleTramitesStripeEvent(event: Stripe.Event): Promise<boolean> {
  const obj = event.data.object as { metadata?: Record<string, string> | null };
  const kind = obj.metadata?.kind;

  if (kind === TRAMITES_ORDER_KIND) {
    const orderId = obj.metadata?.order_id;
    if (!orderId) return true;
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") return true;
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);
        await markOrderPaid(orderId, {
          paymentIntentId: pi,
          checkoutSessionId: session.id,
          amountCents: session.amount_total ?? 0,
          invoiceUrl: await invoiceUrlForSession(session),
        });
        return true;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markOrderPaid(orderId, {
          paymentIntentId: pi.id,
          checkoutSessionId: null,
          amountCents: pi.amount_received ?? pi.amount,
        });
        return true;
      }
      case "payment_intent.payment_failed":
      case "checkout.session.expired":
        await markOrderPaymentFailed(orderId);
        return true;
      default:
        return true;
    }
  }

  // Suscripciones (plan mensual, desactivado): mantenemos su estado si existen.
  if (kind === TRAMITES_SUBSCRIPTION_KIND && event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const store = serverStore();
    const existing = await store.getSubscriptionByStripeId(sub.id);
    if (existing) {
      const status =
        sub.status === "active" || sub.status === "trialing"
          ? "activa"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "impagada"
            : sub.status === "canceled"
              ? "cancelada"
              : existing.status;
      await store.upsertSubscription({
        ...existing,
        status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }
    return true;
  }
  return false;
}
