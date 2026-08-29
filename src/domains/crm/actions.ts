"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import type { CustomerInput } from "./types";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const customerSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().trim().max(120).default(""),
  lastName: z.string().trim().max(120).default(""),
  email: z.string().trim().email().max(200).or(z.literal("")).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  docType: z.enum(["dni", "nie", "passport", "cif", "other"]).or(z.literal("")).optional(),
  docNumber: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(120).optional(),
  province: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  language: z.string().trim().max(10).optional(),
  channelOrigin: z
    .enum(["direct", "booking", "airbnb", "manual", "other"])
    .or(z.literal(""))
    .optional(),
  marketingConsent: z.coerce.boolean().default(false),
  notes: z.string().trim().max(4000).optional(),
});

export async function saveCustomerAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const d = parsed.data;
  if (!d.firstName && !d.lastName && !d.email && !d.phone) {
    return { ok: false, error: "Indica al menos nombre, email o teléfono" };
  }
  const input: CustomerInput = {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email || null,
    phone: d.phone || null,
    whatsapp: d.whatsapp || null,
    docType: d.docType || null,
    docNumber: d.docNumber || null,
    address: d.address || null,
    postalCode: d.postalCode || null,
    city: d.city || null,
    province: d.province || null,
    country: d.country || null,
    language: d.language || null,
    channelOrigin: d.channelOrigin || null,
    marketingConsent: d.marketingConsent,
    marketingConsentSource: d.marketingConsent ? "admin" : null,
    notes: d.notes || null,
  };

  const repo = getRepository();
  let id = d.id;
  if (id) {
    await repo.updateCustomer(id, input);
  } else {
    const created = await repo.createCustomer(input);
    id = created.id;
  }
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  return { ok: true, id };
}

export async function createCustomerAndRedirect(_prev: unknown, formData: FormData) {
  const res = await saveCustomerAction(_prev, formData);
  if (res.ok && res.id) redirect(`/admin/clientes/${res.id}`);
  return res;
}

export async function mergeCustomersAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const primaryId = String(formData.get("primaryId") ?? "");
  const duplicateId = String(formData.get("duplicateId") ?? "");
  if (primaryId && duplicateId && primaryId !== duplicateId) {
    await getRepository().mergeCustomers(primaryId, duplicateId);
  }
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${primaryId}`);
}
