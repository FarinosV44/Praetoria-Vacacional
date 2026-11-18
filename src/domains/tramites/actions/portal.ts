"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env, DEMO_MODE } from "@/lib/env";
import { stripeEnabled } from "@/domains/payments/stripe";
import { reportError } from "@/lib/observability/report";
import { getOwnerContext, requireOwner } from "../context";
import {
  audit,
  cancelReservation,
  createCreditsOrder,
  markOrderPaid,
  ownerActor,
  ownerGet,
  postMessage,
  reportReservation,
  saveTravellerData,
  storeDocument,
  getActiveCatalog,
} from "../service";
import { serverStore } from "../repo";
import { createOrderCheckout } from "../stripe";
import {
  documentKindSchema,
  propertyInputSchema,
  reservationReportSchema,
  travellerBundleSchema,
} from "../schema";
import { buildQuote } from "../pricing";
import { shortRef } from "../ids";
import { TRAMITES_LEGAL_VERSIONS } from "@/content/tramites-legal";

export type PortalResult =
  { ok: true; message?: string; id?: string } | { ok: false; error: string };

const site = () => env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

// ------------------------------------------------------------------ pago ----

export async function payOrderAction(formData: FormData): Promise<void> {
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const orderId = String(formData.get("orderId") ?? "");
  const order = await ownerGet(ctx, (s) => s.getOrder(orderId));
  if (!order || order.status !== "pendiente_pago") redirect("/mi-cuenta/tramites/pagos");

  if (stripeEnabled) {
    let url: string;
    try {
      const session = await createOrderCheckout(order, ctx.account, {
        success: `${site()}/mi-cuenta/tramites/pagos?estado=ok&pedido=${order.reference}`,
        cancel: `${site()}/mi-cuenta/tramites/pagos?estado=cancelado&pedido=${order.reference}`,
      });
      await serverStore().updateOrder(order.id, { stripeCheckoutSessionId: session.id });
      await audit(ownerActor(ctx), "pago.iniciar", ctx.account.id, "pedido", order.id, {});
      url = session.url;
    } catch (err) {
      reportError(err, { scope: "tramites/checkout" });
      redirect("/mi-cuenta/tramites/pagos?estado=error");
    }
    redirect(url);
  }
  // Sin Stripe (demo/preview): simulador explícito, nunca en producción.
  redirect(`/mi-cuenta/tramites/pagos/${order.id}/simular`);
}

/** Simulador de pago del modo demo (desactivado si hay Stripe o base de datos real). */
export async function simulatePaymentAction(formData: FormData): Promise<void> {
  if (stripeEnabled || !DEMO_MODE) redirect("/mi-cuenta/tramites/pagos");
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const orderId = String(formData.get("orderId") ?? "");
  const order = await ownerGet(ctx, (s) => s.getOrder(orderId));
  if (!order) redirect("/mi-cuenta/tramites/pagos");
  if (formData.get("outcome") === "ok") {
    await markOrderPaid(order.id, {
      paymentIntentId: `demo_pi_${order.id}`,
      checkoutSessionId: null,
      amountCents: order.totalCents,
    });
    redirect(`/mi-cuenta/tramites/pagos?estado=ok&pedido=${order.reference}`);
  }
  redirect(`/mi-cuenta/tramites/pagos?estado=cancelado&pedido=${order.reference}`);
}

export async function buyCreditsAction(formData: FormData): Promise<void> {
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const credits = Number(formData.get("credits") ?? 0);
  const r = await createCreditsOrder(ctx, credits);
  if (!r.ok) redirect("/mi-cuenta/tramites/pagos?estado=error");
  const fd = new FormData();
  fd.set("orderId", r.orderId);
  await payOrderAction(fd);
}

// ------------------------------------------------------------- reservas ----

export async function reportReservationAction(
  _prev: unknown,
  formData: FormData,
): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const parsed = reservationReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const r = await reportReservation(ctx, parsed.data);
  if (!r.ok) return r;
  revalidatePath("/mi-cuenta/tramites", "layout");
  redirect(`/mi-cuenta/tramites/reservas/${r.reportId}?nueva=1`);
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  const id = String(formData.get("reportId") ?? "");
  const when = String(formData.get("cancelledAt") ?? "");
  await cancelReservation(ctx, id, when || new Date().toISOString());
  revalidatePath(`/mi-cuenta/tramites/reservas/${id}`);
  redirect(`/mi-cuenta/tramites/reservas/${id}`);
}

export async function saveTravellersAction(
  _prev: unknown,
  formData: FormData,
): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, error: "Datos no válidos." };
  }
  const parsed = travellerBundleSchema.safeParse(payload);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de los viajeros.",
    };
  const r = await saveTravellerData(ctx, String(formData.get("reportId") ?? ""), parsed.data);
  if (!r.ok) return r;
  revalidatePath("/mi-cuenta/tramites", "layout");
  return {
    ok: true,
    message: "Datos guardados de forma cifrada. Ya podemos presentar la comunicación.",
  };
}

// ----------------------------------------------------------- documentos ----

export async function uploadDocumentAction(
  _prev: unknown,
  formData: FormData,
): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Elige un archivo." };
  const kind = documentKindSchema.safeParse(formData.get("kind"));
  if (!kind.success || kind.data === "justificante_oficial")
    return { ok: false, error: "Indica qué documento es." };
  const propertyId = String(formData.get("propertyId") ?? "") || null;
  const filingId = String(formData.get("filingId") ?? "") || null;
  const r = await storeDocument({
    accountId: ctx.account.id,
    propertyId,
    filingId,
    kind: kind.data,
    name: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
    actor: ownerActor(ctx),
  });
  if (!r.ok) return r;
  revalidatePath("/mi-cuenta/tramites", "layout");
  return { ok: true, message: "Documento recibido. Lo revisaremos y te avisaremos si falta algo." };
}

// ------------------------------------------------------------- mensajes ----

export async function ownerMessageAction(
  _prev: unknown,
  formData: FormData,
): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const r = await postMessage(
    ctx.account.id,
    "owner",
    ctx.account.contactName,
    String(formData.get("body") ?? ""),
  );
  if (!r.ok) return r;
  revalidatePath("/mi-cuenta/tramites/mensajes");
  return { ok: true, message: "Mensaje enviado." };
}

// ------------------------------------------------------------- viviendas ----

const editableProperty = z.object({
  propertyId: z.string().uuid(),
  tourismRegistryNumber: z.string().trim().max(60).optional().default(""),
  cadastralRef: z.string().trim().max(30).optional().default(""),
  sesEstablishmentCode: z.string().trim().max(40).optional().default(""),
  maxGuests: z.coerce.number().int().min(0).max(60).optional().default(0),
});

export async function updatePropertyAction(
  _prev: unknown,
  formData: FormData,
): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const parsed = editableProperty.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const p = await ownerGet(ctx, (s) => s.getProperty(parsed.data.propertyId));
  if (!p) return { ok: false, error: "Vivienda no encontrada." };
  await serverStore().updateProperty(p.id, {
    tourismRegistryNumber: parsed.data.tourismRegistryNumber || null,
    hasTourismRegistry: parsed.data.tourismRegistryNumber ? "si" : p.hasTourismRegistry,
    cadastralRef: parsed.data.cadastralRef || null,
    sesEstablishmentCode: parsed.data.sesEstablishmentCode || null,
    hasSesAlta: parsed.data.sesEstablishmentCode ? "si" : p.hasSesAlta,
    maxGuests: parsed.data.maxGuests || null,
  });
  await audit(ownerActor(ctx), "vivienda.editar", ctx.account.id, "vivienda", p.id, {});
  revalidatePath(`/mi-cuenta/tramites/viviendas/${p.id}`);
  return { ok: true, message: "Datos guardados." };
}

/** Nueva vivienda desde la carpeta, con alta SES opcional (crea su pedido). */
export async function addPropertyAction(_prev: unknown, formData: FormData): Promise<PortalResult> {
  const ctx = await getOwnerContext();
  if (!ctx) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  const raw = Object.fromEntries(formData);
  const parsed = propertyInputSchema.safeParse({
    ...raw,
    platforms: String(raw.platforms ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    wantsSesAlta: raw.wantsSesAlta === "on",
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const d = parsed.data;
  const store = serverStore();
  const at = new Date().toISOString();
  const prop = await store.createProperty({
    id: randomUUID(),
    accountId: ctx.account.id,
    alias: d.alias,
    street: d.street,
    postalCode: d.postalCode,
    municipality: d.municipality,
    province: d.province,
    cadastralRef: null,
    tourismRegistryNumber: d.tourismRegistryNumber || null,
    hasTourismRegistry: d.hasTourismRegistry,
    hasSesAlta: d.hasSesAlta,
    sesEstablishmentCode: null,
    platforms: d.platforms,
    maxGuests: null,
    createdAt: at,
    updatedAt: at,
  });
  await audit(ownerActor(ctx), "vivienda.crear", ctx.account.id, "vivienda", prop.id, {});
  if (d.wantsSesAlta) {
    const catalog = await getActiveCatalog();
    const q = buildQuote(catalog, {
      planCode: "por_uso",
      properties: [{ propertyId: prop.id, alias: prop.alias, sesAlta: true }],
      reservationCredits: 0,
      historicalReview: false,
    });
    if (q.ok) {
      const order = await store.createOrder({
        id: randomUUID(),
        reference: shortRef("TR"),
        accountId: ctx.account.id,
        planCode: "por_uso",
        catalogVersion: q.catalogVersion,
        vatRatePercent: q.vatRatePercent,
        lines: q.lines,
        netCents: q.netCents,
        vatCents: q.vatCents,
        totalCents: q.totalCents,
        status: "pendiente_pago",
        acceptance: {
          termsVersion: TRAMITES_LEGAL_VERSIONS.terms,
          privacyVersion: TRAMITES_LEGAL_VERSIONS.privacy,
          mandateVersion: TRAMITES_LEGAL_VERSIONS.mandate,
          acceptedAt: at,
          ipHash: null,
          userAgent: null,
        },
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        invoiceUrl: null,
        paidAt: null,
        createdAt: at,
        updatedAt: at,
      });
      revalidatePath("/mi-cuenta/tramites", "layout");
      redirect(`/mi-cuenta/tramites/pagos?pedido=${order.reference}`);
    }
  }
  revalidatePath("/mi-cuenta/tramites", "layout");
  redirect(`/mi-cuenta/tramites/viviendas/${prop.id}`);
}
