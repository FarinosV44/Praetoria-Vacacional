"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/repository";
import { portalDataForToken } from "@/domains/portal/service";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { validateTraveller } from "./parte";
import type { DocType, Gender } from "./types";

type Result = { ok: true } | { ok: false; error: string };

const travellerSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().trim().min(3).max(160),
  firstSurname: z.string().trim().max(80).optional(),
  secondSurname: z.string().trim().max(80).optional(),
  docType: z.enum(["DNI", "NIE", "PAS", "OTRO"]),
  docNumber: z.string().trim().min(3).max(40),
  docSupport: z.string().trim().max(40).optional(),
  nationality: z.string().trim().min(2).max(40).default("ESP"),
  birthDate: z.string().trim().optional(),
  gender: z.enum(["H", "M", "O"]).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(200).optional(),
  addressCountry: z.string().trim().max(40).default("ESP"),
  addressLine: z.string().trim().max(200).optional(),
  municipality: z.string().trim().max(120).optional(),
  province: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(10).optional(),
  kinship: z.string().trim().max(40).optional(),
  paymentMethod: z.string().trim().max(30),
});

export async function addTravellerAction(_prev: unknown, formData: FormData): Promise<Result> {
  const parsed = travellerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const data = await portalDataForToken(parsed.data.token);
  if (!data) return { ok: false, error: "El enlace no es válido o ha caducado." };

  const draft = {
    fullName: parsed.data.fullName,
    docType: parsed.data.docType as DocType,
    docNumber: parsed.data.docNumber,
    nationality: parsed.data.nationality,
    birthDate: parsed.data.birthDate || null,
    paymentMethod: parsed.data.paymentMethod,
    addressCountry: parsed.data.addressCountry,
    municipality: parsed.data.municipality || null,
    province: parsed.data.province || null,
  };
  const issues = validateTraveller(draft);
  if (issues.length) return { ok: false, error: issues[0]!.message };

  const existing = await getRepository().listTravellers(data.reservation.id);

  await getRepository().addTraveller({
    reservationId: data.reservation.id,
    fullName: parsed.data.fullName,
    firstSurname: parsed.data.firstSurname || null,
    secondSurname: parsed.data.secondSurname || null,
    docType: parsed.data.docType as DocType,
    docNumber: parsed.data.docNumber,
    docSupport: parsed.data.docSupport || null,
    nationality: parsed.data.nationality,
    birthDate: parsed.data.birthDate || null,
    gender: (parsed.data.gender as Gender) || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    addressCountry: parsed.data.addressCountry,
    addressLine: parsed.data.addressLine || null,
    municipality: parsed.data.municipality || null,
    province: parsed.data.province || null,
    postalCode: parsed.data.postalCode || null,
    kinship: parsed.data.kinship || null,
    isLead: existing.length === 0,
    paymentMethod: parsed.data.paymentMethod,
  });

  revalidatePath(`/mi-reserva/${parsed.data.token}/checkin`);
  return { ok: true };
}

export async function deleteTravellerFromPortalAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const data = await portalDataForToken(token);
  if (!data || !id) return;
  const own = (await getRepository().listTravellers(data.reservation.id)).some((t) => t.id === id);
  if (own) await getRepository().deleteTraveller(id);
  revalidatePath(`/mi-reserva/${token}/checkin`);
}

// --- admin ---------------------------------------------------------

async function adminGuard() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("reservations.write");
}

export async function markParteSentAction(formData: FormData): Promise<void> {
  await adminGuard();
  const reservationId = String(formData.get("reservationId") ?? "");
  const ref = String(formData.get("ref") ?? "manual").slice(0, 80);
  if (reservationId) {
    await getRepository().markTravellersSent(reservationId, ref);
    await logAction("registry.mark_sent", { entity: "reservation", entityId: reservationId, meta: { ref } });
  }
  revalidatePath(`/admin/reservas/${reservationId}`);
  revalidatePath("/admin/registro-viajeros");
}

export async function submitParteAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; ref?: string }> {
  await adminGuard();
  const reservationId = String(formData.get("reservationId") ?? "");
  if (!reservationId) return { ok: false, error: "Falta la reserva" };
  const { submitParte } = await import("./submit");
  const res = await submitParte(reservationId);
  if (res.ok && res.ref) {
    await getRepository().markTravellersSent(reservationId, res.ref);
    await logAction("registry.submit", { entity: "reservation", entityId: reservationId, meta: { ref: res.ref } });
  }
  revalidatePath(`/admin/reservas/${reservationId}`);
  return res;
}
