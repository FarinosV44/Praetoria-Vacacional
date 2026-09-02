"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { COMM_KINDS } from "./types";
import { dispatchDueMessages, syncReservationComms } from "./dispatch";

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

export async function resendMessageAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("reservations.write");
  const id = String(formData.get("id") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  if (id) {
    await getRepository().resetScheduledMessage(id);
    await dispatchDueMessages(5).catch(() => undefined);
    await logAction("comms.resend", { entity: "scheduled_message", entityId: id });
  }
  revalidatePath("/admin/comunicaciones");
  if (reservationId) revalidatePath(`/admin/reservas/${reservationId}`);
}

export async function replanReservationCommsAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("reservations.write");
  const reservationId = String(formData.get("reservationId") ?? "");
  if (reservationId) {
    await syncReservationComms(reservationId);
    await logAction("comms.replan", { entity: "reservation", entityId: reservationId });
  }
  revalidatePath(`/admin/reservas/${reservationId}`);
}

const settingsSchema = z.object({
  propertySlug: z.string().min(1),
  checkinEs: z.string().trim().max(2000).optional(),
  checkinEn: z.string().trim().max(2000).optional(),
  checkoutEs: z.string().trim().max(2000).optional(),
  checkoutEn: z.string().trim().max(2000).optional(),
});

export async function saveCommsSettingsAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("settings.write");
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return;

  const rules: Record<string, { enabled: boolean; offsetDays: number; hour: number }> = {};
  for (const kind of COMM_KINDS) {
    rules[kind] = {
      enabled: formData.get(`rule.${kind}.enabled`) === "on",
      offsetDays: Number(formData.get(`rule.${kind}.offsetDays`) ?? 0),
      hour: Math.min(Math.max(Number(formData.get(`rule.${kind}.hour`) ?? 9), 0), 23),
    };
  }

  await getRepository().setContentOverride(`comms:settings:${property.id}`, {
    rules,
    checkinEs: parsed.data.checkinEs || null,
    checkinEn: parsed.data.checkinEn || null,
    checkoutEs: parsed.data.checkoutEs || null,
    checkoutEn: parsed.data.checkoutEn || null,
  });
  await logAction("comms.settings", { entity: "property", entityId: property.slug });
  revalidatePath("/admin/comunicaciones/ajustes");
}
