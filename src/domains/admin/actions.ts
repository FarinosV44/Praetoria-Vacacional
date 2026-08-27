"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated, createAdminSession, destroyAdminSession, verifyPassword } from "./auth";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { isIsoDate } from "@/lib/dates";
import { getRateConfig } from "@/content/rates";
import { rateConfigSchema } from "@/domains/pricing/schema";

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

const num = (fd: FormData, key: string) => Number(fd.get(key));

export async function updateRatesAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const slug = String(formData.get("propertySlug") ?? "");
  const property = getPropertyBySlug(slug);
  const current = getRateConfig(slug);
  if (!property || !current) return { ok: false, error: "Alojamiento no encontrado" };

  let seasons = current.seasons;
  let discounts = current.discounts;
  try {
    const rawSeasons = String(formData.get("seasons") ?? "").trim();
    const rawDiscounts = String(formData.get("discounts") ?? "").trim();
    if (rawSeasons) seasons = JSON.parse(rawSeasons);
    if (rawDiscounts) discounts = JSON.parse(rawDiscounts);
  } catch {
    return { ok: false, error: "El JSON de temporadas o descuentos no es válido" };
  }

  const candidate = {
    ...current,
    propertySlug: slug,
    currency: "EUR" as const,
    baseNightlyCents: num(formData, "baseNightlyCents"),
    weekendNightlyCents: num(formData, "weekendNightlyCents") || undefined,
    minNights: num(formData, "minNights"),
    maxNights: num(formData, "maxNights"),
    cleaningFeeCents: num(formData, "cleaningFeeCents"),
    includedGuests: num(formData, "includedGuests"),
    extraGuestNightlyCents: num(formData, "extraGuestNightlyCents"),
    maxGuests: num(formData, "maxGuests"),
    taxPercent: num(formData, "taxPercent"),
    bookingWindowDays: num(formData, "bookingWindowDays"),
    leadTimeDays: num(formData, "leadTimeDays"),
    seasons,
    discounts,
  };

  const parsed = rateConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: "Valores no válidos: " + parsed.error.issues[0]?.message };
  }

  await getRepository().setRateOverride(property.id, parsed.data);
  revalidatePath(`/${slug}`);
  revalidatePath(`/en/${slug}`);
  revalidatePath("/admin/precios");
  return { ok: true };
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Cancelada desde administración");
  if (id) await getRepository().cancelReservation(id, reason);
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
}

const feedSchema = z.object({
  propertySlug: z.string(),
  channel: z.string().min(1).default("booking"),
  url: z.string().trim().url().or(z.literal("")),
});

export async function setImportFeedUrlAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = feedSchema.safeParse({
    propertySlug: formData.get("propertySlug"),
    channel: formData.get("channel") || "booking",
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "URL no válida (debe empezar por https://)" };

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  await getRepository().setImportFeedUrl(
    property.id,
    parsed.data.channel,
    parsed.data.url || null,
  );
  revalidatePath("/admin/sincronizacion");
  return { ok: true };
}
