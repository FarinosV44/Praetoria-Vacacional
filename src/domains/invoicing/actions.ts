"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import {
  getRepository,
  InvoiceLockedError,
  InvoiceNumberTakenError,
} from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { todayIso } from "@/lib/dates";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { draftInvoiceFromReservation } from "./draft";
import { numberingInsight } from "./numbering";
import { yearCodeOf } from "./numbering";
import { DEFAULT_TAX_NOTE, type CreateInvoiceInput, type InvoiceStatus } from "./types";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

/** "Emitir factura" from a reservation → create a draft and open its editor. */
export async function draftInvoiceFromReservationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const reservationId = String(formData.get("reservationId") ?? "");
  const repo = getRepository();
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

  const [customer, settings, numbers] = await Promise.all([
    reservation.customerId ? repo.getCustomer(reservation.customerId) : Promise.resolve(null),
    repo.invoiceSettings(reservation.propertyId),
    repo.allInvoiceNumbers(reservation.propertyId),
  ]);
  const property = getPropertyById(reservation.propertyId);
  const issueDate = todayIso();
  const insight = numberingInsight(settings.series, yearCodeOf(issueDate), numbers);

  const input = draftInvoiceFromReservation({
    reservation,
    customer,
    propertyName: property?.name ?? reservation.propertyId,
    settings,
    suggestedNumber: insight.suggestedNext,
    issueDate,
  });
  const invoice = await repo.createInvoice(input);
  revalidatePath("/admin/facturas");
  revalidatePath(`/admin/reservas/${reservationId}`);
  redirect(`/admin/facturas/${invoice.id}`);
}

const itemRow = z.object({
  description: z.string().trim().max(300),
  quantity: z.coerce.number().min(0),
  unitEuros: z.coerce.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string().min(1),
  reservationId: z.string().optional(),
  customerId: z.string().optional(),
  series: z.string().trim().min(1).max(6),
  number: z.string().trim().min(3).max(40),
  issueDate: z.string().min(8),
  billName: z.string().trim().max(200).default(""),
  billTaxId: z.string().trim().max(40).optional(),
  billAddress: z.string().trim().max(200).optional(),
  billPostal: z.string().trim().max(20).optional(),
  billCity: z.string().trim().max(120).optional(),
  billProvince: z.string().trim().max(120).optional(),
  billCountry: z.string().trim().max(120).optional(),
  billEmail: z.string().trim().max(200).optional(),
  taxExempt: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()).default(true),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxNote: z.string().trim().max(400).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function parseItems(formData: FormData) {
  const descriptions = formData.getAll("itemDescription").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const units = formData.getAll("itemUnitEuros").map(String);
  const items: CreateInvoiceInput["items"] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const parsed = itemRow.safeParse({
      description: descriptions[i] ?? "",
      quantity: quantities[i] ?? "0",
      unitEuros: units[i] ?? "0",
    });
    if (parsed.success && parsed.data.description) {
      items.push({
        description: parsed.data.description,
        quantity: parsed.data.quantity,
        unitCents: Math.round(parsed.data.unitEuros * 100),
      });
    }
  }
  return items;
}

export async function saveInvoiceDraftAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const d = parsed.data;
  const items = parseItems(formData);
  if (items.length === 0) return { ok: false, error: "Añade al menos una línea con descripción" };

  const input: CreateInvoiceInput = {
    propertyId: d.propertyId,
    reservationId: d.reservationId || null,
    customerId: d.customerId || null,
    series: d.series,
    number: d.number,
    issueDate: d.issueDate,
    billTo: {
      name: d.billName,
      taxId: d.billTaxId || null,
      address: d.billAddress || null,
      postalCode: d.billPostal || null,
      city: d.billCity || null,
      province: d.billProvince || null,
      country: d.billCountry || null,
      email: d.billEmail || null,
    },
    taxExempt: d.taxExempt,
    taxRate: d.taxExempt ? d.taxRate : d.taxRate,
    taxNote: d.taxExempt ? d.taxNote || DEFAULT_TAX_NOTE : d.taxNote || null,
    notes: d.notes || null,
    items,
  };

  try {
    const repo = getRepository();
    const invoice = d.id
      ? await repo.updateInvoiceDraft(d.id, input)
      : await repo.createInvoice(input);
    revalidatePath("/admin/facturas");
    revalidatePath(`/admin/facturas/${invoice.id}`);
    return { ok: true, id: invoice.id };
  } catch (err) {
    if (err instanceof InvoiceNumberTakenError) {
      return { ok: false, error: "Ese número de factura ya está en uso" };
    }
    if (err instanceof InvoiceLockedError) {
      return { ok: false, error: "La factura ya está emitida y no se puede modificar" };
    }
    throw err;
  }
}

export async function issueInvoiceAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("invoices.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    const inv = await getRepository().issueInvoice(id);
    await logAction("invoice.issue", { entity: "invoice", entityId: id, meta: { number: inv.number } });
  }
  revalidatePath("/admin/facturas");
  revalidatePath(`/admin/facturas/${id}`);
}

export async function setInvoiceStatusAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("invoices.write");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InvoiceStatus;
  if (id && status) {
    await getRepository().setInvoiceStatus(id, status);
    await logAction(`invoice.${status}`, { entity: "invoice", entityId: id });
  }
  revalidatePath("/admin/facturas");
  revalidatePath(`/admin/facturas/${id}`);
}

export async function deleteInvoiceDraftAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("invoices.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().deleteInvoiceDraft(id);
    await logAction("invoice.draft_delete", { entity: "invoice", entityId: id });
  }
  revalidatePath("/admin/facturas");
  redirect("/admin/facturas");
}

const settingsSchema = z.object({
  propertySlug: z.string().min(1),
  series: z.string().trim().min(1).max(6),
  taxExempt: z.preprocess((v) => v === "true" || v === "on" || v === true, z.boolean()).default(true),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxNote: z.string().trim().max(400).optional(),
});

export async function saveInvoiceSettingsAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Datos no válidos" };
  const { getPropertyBySlug } = await import("@/domains/properties/registry");
  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };
  await getRepository().setInvoiceSettings(property.id, {
    series: parsed.data.series.toUpperCase(),
    taxExempt: parsed.data.taxExempt,
    taxRate: parsed.data.taxRate,
    taxNote: parsed.data.taxNote || DEFAULT_TAX_NOTE,
  });
  revalidatePath("/admin/facturas");
  revalidatePath("/admin/facturas/ajustes");
  return { ok: true };
}
