"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { isIsoDate } from "@/lib/dates";
import type { ReservationPatch } from "@/lib/repository/types";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const SOURCES = ["direct", "booking", "airbnb", "manual", "other"] as const;
const PAYMENT_STATES = ["pending", "partial", "paid", "refunded"] as const;
const DOC_TYPES = ["dni", "nie", "passport", "cif", "other"] as const;

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);
const opt = (max = 200) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());

const createSchema = z.object({
  propertySlug: z.string().min(1),
  source: z.enum(SOURCES),
  channelDetail: opt(120),
  occupy: z.preprocess((v) => v === "true" || v === "on", z.boolean()).default(false),
  checkIn: z.string().refine(isIsoDate, "Fecha de entrada no válida"),
  checkOut: z.string().refine(isIsoDate, "Fecha de salida no válida"),
  guests: z.coerce.number().int().min(1).max(30),
  totalEuros: z.coerce.number().min(0),
  customerId: opt(80),
  guestName: opt(160),
  guestEmail: z.preprocess(emptyToUndef, z.string().trim().email().max(200).optional()),
  guestPhone: opt(40),
  guestDocType: z.preprocess(emptyToUndef, z.enum(DOC_TYPES).optional()),
  guestDocNumber: opt(40),
  guestAddress: opt(200),
  guestPostalCode: opt(20),
  guestCity: opt(120),
  guestProvince: opt(120),
  guestCountry: opt(120),
  externalLocator: opt(80),
  invoiceNumber: opt(40),
  paymentMethod: opt(60),
  paymentState: z.enum(PAYMENT_STATES).default("pending"),
  notes: opt(4000),
});

export async function createReservationAndRedirect(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const d = parsed.data;
  if (d.checkIn >= d.checkOut) {
    return { ok: false, error: "La fecha de salida debe ser posterior a la de entrada" };
  }
  const property = getPropertyBySlug(d.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  // Direct/manual reservations that should hold the dates → confirmed.
  // Booking/Airbnb records whose block already holds the dates → external.
  const status =
    d.occupy || d.source === "direct" || d.source === "manual" ? "confirmed" : "external";

  try {
    const reservation = await getRepository().createManualReservation({
      propertyId: property.id,
      source: d.source,
      channelDetail: d.channelDetail ?? null,
      status,
      checkIn: d.checkIn,
      checkOut: d.checkOut,
      guests: d.guests,
      totalCents: Math.round(d.totalEuros * 100),
      customerId: d.customerId ?? null,
      guestName: d.guestName ?? null,
      guestEmail: d.guestEmail ?? null,
      guestPhone: d.guestPhone ?? null,
      guestDocType: d.guestDocType ?? null,
      guestDocNumber: d.guestDocNumber ?? null,
      guestAddress: d.guestAddress ?? null,
      guestPostalCode: d.guestPostalCode ?? null,
      guestCity: d.guestCity ?? null,
      guestProvince: d.guestProvince ?? null,
      guestCountry: d.guestCountry ?? null,
      externalLocator: d.externalLocator ?? null,
      invoiceNumber: d.invoiceNumber ?? null,
      paymentMethod: d.paymentMethod ?? null,
      paymentState: d.paymentState,
      notes: d.notes ?? null,
    });
    revalidatePath("/admin/reservas");
    revalidatePath("/admin");
    revalidatePath(`/${property.slug}`);
    redirect(`/admin/reservas/${reservation.id}`);
  } catch (err) {
    if (err instanceof PropertyUnavailableError) {
      return {
        ok: false,
        error:
          "Esas fechas ya están ocupadas en ese alojamiento. Si es una reserva de Booking/Airbnb cuyo bloqueo ya existe, desmarca «bloquear disponibilidad».",
      };
    }
    throw err;
  }
  return { ok: true };
}

const patchSchema = z.object({
  id: z.string().min(1),
  source: z.enum(SOURCES).optional(),
  channelDetail: opt(120),
  customerId: opt(80),
  guestName: opt(160),
  guestEmail: z.preprocess(emptyToUndef, z.string().trim().email().max(200).optional()),
  guestPhone: opt(40),
  guestDocType: z.preprocess(emptyToUndef, z.enum(DOC_TYPES).optional()),
  guestDocNumber: opt(40),
  guestAddress: opt(200),
  guestPostalCode: opt(20),
  guestCity: opt(120),
  guestProvince: opt(120),
  guestCountry: opt(120),
  externalLocator: opt(80),
  invoiceNumber: opt(40),
  paymentMethod: opt(60),
  paymentState: z.enum(PAYMENT_STATES).optional(),
  notes: opt(4000),
});

export async function updateReservationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = patchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const { id, ...rest } = parsed.data;
  const patch: ReservationPatch = {};
  for (const [k, v] of Object.entries(rest)) {
    // "" cleared fields come through as undefined already (preprocess);
    // send explicit null so the field is actually cleared.
    (patch as Record<string, unknown>)[k] = v === undefined ? null : v;
  }
  // Never null the customer link by accident when the select was left on "".
  if (rest.customerId === undefined) delete (patch as Record<string, unknown>).customerId;

  await getRepository().updateReservation(id, patch);
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${id}`);
  return { ok: true, id };
}

export async function linkCustomerFromReservationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().linkOrCreateCustomerFromReservation(id);
  revalidatePath(`/admin/reservas/${id}`);
}
