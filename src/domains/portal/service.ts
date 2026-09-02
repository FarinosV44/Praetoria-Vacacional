import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import type { Reservation } from "@/domains/booking/types";
import type { Invoice } from "@/domains/invoicing/types";
import { verifyPortalToken } from "./token";

export interface PortalData {
  reservation: Reservation;
  propertyName: string;
  propertySlug: string | null;
  invoices: Invoice[];
  paidCents: number;
  outstandingCents: number;
}

export async function portalDataForToken(token: string): Promise<PortalData | null> {
  const reservationId = verifyPortalToken(token);
  if (!reservationId) return null;

  const repo = getRepository();
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) return null;

  const [invoices, payments] = await Promise.all([
    repo.invoicesForReservation(reservationId).catch(() => []),
    repo.listPayments(500).catch(() => []),
  ]);

  const paidCents = payments
    .filter((p) => p.reservationId === reservationId && p.status === "succeeded")
    .reduce((s, p) => s + p.amountCents, 0);

  const property = getPropertyById(reservation.propertyId);

  return {
    reservation,
    propertyName: property?.name ?? "tu alojamiento",
    propertySlug: property?.slug ?? null,
    invoices: invoices.filter((i) => i.status !== "draft"),
    paidCents,
    outstandingCents: Math.max(0, reservation.totalCents - paidCents),
  };
}

/** Find the reservation a guest is asking about, only if code + email match. */
export async function findReservationForPortal(
  code: string,
  email: string,
): Promise<Reservation | null> {
  const reservation = await getRepository()
    .getReservationByCode(code.trim().toUpperCase())
    .catch(() => null);
  if (!reservation) return null;
  if ((reservation.guestEmail ?? "").trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }
  if (reservation.status === "cancelled" || reservation.status === "expired") return null;
  return reservation;
}
