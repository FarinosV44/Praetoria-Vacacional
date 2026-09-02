"use server";

import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { buildReservationParte } from "./submit";
import type { Parte } from "./parte";

export async function getReservationParteAction(
  reservationId: string,
): Promise<{ ok: true; parte: Parte } | { ok: false; error: string }> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "No autorizado" };
  await assertCapability("reservations.write");
  const bundle = await buildReservationParte(reservationId);
  if (!bundle) return { ok: false, error: "Reserva no encontrada" };
  return { ok: true, parte: bundle.parte };
}
