"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { applyDynamicPricing, saveDynamicSettings } from "./dynamic-apply";

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function guard() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("settings.write");
}

const settingsSchema = z.object({
  propertySlug: z.string().min(1),
  enabled: z.union([z.literal("on"), z.undefined()]).optional(),
  floorEuros: z.coerce.number().min(0).max(100000),
  bandPct: z.coerce.number().int().min(0).max(60),
  horizonDays: z.coerce.number().int().min(7).max(180),
});

export async function saveDynamicPricingSettingsAction(
  _prev: unknown,
  formData: FormData,
): Promise<Result> {
  await guard();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Valores no válidos" };

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  await saveDynamicSettings(property.id, {
    enabled: parsed.data.enabled === "on",
    floorCents: Math.round(parsed.data.floorEuros * 100),
    bandPct: parsed.data.bandPct,
    horizonDays: parsed.data.horizonDays,
  });
  await logAction("pricing.dynamic_settings", {
    entity: "property",
    entityId: property.id,
    meta: { enabled: parsed.data.enabled === "on" },
  });
  revalidatePath("/admin/precios-dinamicos");
  return { ok: true, message: "Guardado." };
}

export async function applyDynamicPricingNowAction(formData: FormData): Promise<void> {
  await guard();
  const slug = String(formData.get("propertySlug") ?? "");
  if (slug) await applyDynamicPricing(slug, { force: true });
  revalidatePath("/admin/precios-dinamicos");
  revalidatePath("/admin/calendario");
  revalidatePath(`/${slug}`);
}
