"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { rateConfigSchema } from "@/domains/pricing/schema";
import { applyQuickRateChanges, type QuickRateChange } from "@/domains/pricing/quick";
import {
  parseSubscription,
  removeSubscription,
  saveSubscription,
  sendPushToAdmins,
} from "@/domains/notifications/push";
import { isAdminAuthenticated } from "./auth";
import { assertCapability } from "./roles";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

/**
 * Admin mobile app (installable PWA): push subscriptions and one-tap price
 * changes. Every action re-checks the admin session server-side.
 */

export async function savePushSubscriptionAction(input: unknown, label: string): Promise<ActionResult> {
  await assertAdmin();
  const sub = parseSubscription(input);
  if (!sub) return { ok: false, error: "Suscripción no válida" };
  await saveSubscription(sub, String(label ?? ""));
  return { ok: true };
}

export async function removePushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  await assertAdmin();
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false, error: "Dispositivo no válido" };
  }
  await removeSubscription(endpoint);
  return { ok: true };
}

export async function sendTestPushAction(): Promise<ActionResult> {
  await assertAdmin();
  const report = await sendPushToAdmins({
    title: "Praetoria · notificaciones activas",
    body: "Así te avisaremos de cada reserva nueva.",
    url: "/admin/movil",
    tag: "praetoria-test",
  });
  if (report.sent === 0) {
    return { ok: false, error: report.failed ? "No se pudo enviar. Vuelve a activar las notificaciones." : "No hay ningún teléfono activado." };
  }
  return { ok: true };
}

/**
 * Applies nightly-price edits from the phone on top of the property's effective
 * rate config and saves it as the admin override — the same store and
 * validation the full "Precios y reglas" page uses. Owner-level only.
 */
export async function quickRatesAction(slug: string, changes: QuickRateChange[]): Promise<ActionResult> {
  await assertAdmin();
  await assertCapability("settings.write");
  const property = getPropertyBySlug(slug);
  const effective = property ? await resolveRateConfig(slug) : undefined;
  if (!property || !effective) return { ok: false, error: "Alojamiento no encontrado" };
  if (!Array.isArray(changes) || changes.length === 0 || changes.length > 40) {
    return { ok: false, error: "No hay cambios que guardar" };
  }

  const applied = applyQuickRateChanges(effective, changes);
  if (!applied.ok) return applied;
  const next = applied.config;

  const parsed = rateConfigSchema.safeParse(next);
  if (!parsed.success) return { ok: false, error: "Valores no válidos: " + parsed.error.issues[0]?.message };

  await getRepository().setRateOverride(property.id, parsed.data);
  revalidatePath(`/${slug}`);
  revalidatePath(`/en/${slug}`);
  revalidatePath("/admin/precios");
  revalidatePath("/admin/movil/precios");
  return { ok: true };
}
