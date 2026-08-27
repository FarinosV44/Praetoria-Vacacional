import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.stripeConfigured) throw new Error("Stripe is not configured (DEMO mode).");
  if (!cached) {
    cached = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  }
  return cached;
}

export const stripeEnabled = env.stripeConfigured;
export const stripeWebhookEnabled = env.stripeWebhookConfigured;

export interface CheckoutSessionInput {
  reservationId: string;
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  amountCents: number;
  currency: "EUR";
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(input: CheckoutSessionInput) {
  const s = stripe();
  return s.checkout.sessions.create({
    mode: "payment",
    customer_email: input.guestEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          product_data: {
            name: `Reserva · ${input.propertyName}`,
            description: `${input.checkIn} → ${input.checkOut}`,
          },
        },
      },
    ],
    // Idempotency + linkage: the webhook trusts ONLY this metadata, never the URL.
    payment_intent_data: {
      metadata: { reservation_id: input.reservationId, property_id: input.propertyId },
    },
    metadata: { reservation_id: input.reservationId, property_id: input.propertyId },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
}
