"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated, createAdminSession, destroyAdminSession, verifyPassword } from "./auth";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { isIsoDate } from "@/lib/dates";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) return { ok: false, error: "Contraseña incorrecta" };
  await createAdminSession();
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const blockSchema = z.object({
  propertySlug: z.string(),
  startDate: z.string().refine(isIsoDate),
  endDate: z.string().refine(isIsoDate),
  summary: z.string().max(200).optional(),
});

export async function createBlockAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = blockSchema.safeParse({
    propertySlug: formData.get("propertySlug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    summary: formData.get("summary") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Datos del bloqueo no válidos" };
  if (parsed.data.startDate >= parsed.data.endDate)
    return { ok: false, error: "La fecha de fin debe ser posterior al inicio" };

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  try {
    await getRepository().createBlock({
      propertyId: property.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      source: "manual",
      summary: parsed.data.summary ?? "Bloqueo manual",
    });
  } catch (err) {
    if (err instanceof PropertyUnavailableError)
      return { ok: false, error: "Esas fechas se solapan con una reserva o bloqueo existente" };
    return { ok: false, error: "No se pudo crear el bloqueo" };
  }
  revalidatePath("/admin/calendario");
  revalidatePath(`/${property.slug}`);
  return { ok: true };
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().deleteBlock(id);
  revalidatePath("/admin/calendario");
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Cancelada desde administración");
  if (id) await getRepository().cancelReservation(id, reason);
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
}
