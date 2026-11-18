import "server-only";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { stripe, stripeEnabled } from "@/domains/payments/stripe";
import { company } from "@/content/company";
import type { OwnerAccount, ServiceOrder } from "./types";

/**
 * Cobros del servicio de trámites (#175) con el Stripe que ya usa la web.
 *
 *  - Pago puntual: Checkout en modo `payment` con factura de Stripe. Las líneas
 *    van sin IVA y el IVA como línea propia, para que el total cobrado sea
 *    EXACTAMENTE el total del pedido calculado en el servidor.
 *  - Metadatos mínimos y sin datos personales: `kind` y el id opaco del pedido.
 *  - La confirmación llega SOLO por el webhook firmado (route /api/webhooks/stripe).
 *  - Suscripción «Gestión continua»: preparada pero bloqueada hasta que se
 *    apruebe el plan y se configure su precio (`STRIPE_PRICE_TRAMITES_MENSUAL`).
 */

export const TRAMITES_ORDER_KIND = "tramites_order";
export const TRAMITES_SUBSCRIPTION_KIND = "tramites_subscription";

export function tramitesStripeEnabled(): boolean {
  return stripeEnabled;
}

export async function createOrderCheckout(
  order: ServiceOrder,
  account: OwnerAccount,
  urls: { success: string; cancel: string },
): Promise<{ id: string; url: string }> {
  const s = stripe();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: "eur",
      unit_amount: l.unitNetCents,
      product_data: { name: l.description.slice(0, 250) },
    },
  }));
  if (order.vatCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: order.vatCents,
        product_data: { name: `IVA (${order.vatRatePercent} %)` },
      },
    });
  }
  const metadata = { kind: TRAMITES_ORDER_KIND, order_id: order.id };
  // Ventana de 30 min: reintentos dentro de ella devuelven la misma sesión.
  const window = Math.floor(Date.now() / (30 * 60 * 1000));
  const session = await s.checkout.sessions.create(
    {
      mode: "payment",
      ...(account.stripeCustomerId
        ? { customer: account.stripeCustomerId }
        : { customer_email: account.email }),
      line_items: lineItems,
      metadata,
      payment_intent_data: {
        metadata,
        description: `Encargo ${order.reference} · ${company.tradeName}`,
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata,
          description: `Encargo ${order.reference} · gestión de trámites`,
          footer: `${company.legalName} · NIF ${company.taxId}`,
        },
      },
      success_url: urls.success,
      cancel_url: urls.cancel,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      locale: "es",
    },
    { idempotencyKey: `tramites_${order.id}_${window}` },
  );
  if (!session.url) throw new Error("Stripe no devolvió la URL de pago");
  return { id: session.id, url: session.url };
}

/** Plan mensual: no se usa hasta aprobación comercial (#173). */
export async function createSubscriptionCheckout(): Promise<never> {
  const price = process.env.STRIPE_PRICE_TRAMITES_MENSUAL;
  if (!price)
    throw new Error("Plan mensual no activado: falta aprobación y STRIPE_PRICE_TRAMITES_MENSUAL.");
  throw new Error("Plan mensual pendiente de aprobación comercial.");
}

/** URL pública de la factura de Stripe asociada a una sesión de Checkout. */
export async function invoiceUrlForSession(
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const id = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (!id) return null;
  try {
    const inv = await stripe().invoices.retrieve(id);
    return inv.hosted_invoice_url ?? null;
  } catch {
    return null;
  }
}

export function isDemoPayments(): boolean {
  return !stripeEnabled && !env.stripeConfigured;
}
