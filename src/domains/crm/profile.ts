import type { Reservation } from "@/domains/booking/types";
import type { Customer, CustomerProfile } from "./types";
import { displayName } from "./types";

/**
 * Derive a customer's history stats from their reservations (issue #56 §4).
 * Pure — the repository supplies the customer and the reservation list.
 * Only confirmed reservations count toward spend and "properties visited";
 * pending/cancelled still count toward reservationCount for context.
 */
export function buildCustomerProfile(
  customer: Customer,
  reservations: Reservation[],
): CustomerProfile {
  const mine = reservations
    .filter((r) => r.customerId === customer.id)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const confirmed = mine.filter((r) => r.status === "confirmed");

  const totalSpentCents = confirmed.reduce((sum, r) => sum + r.totalCents, 0);
  const propertiesVisited = [...new Set(confirmed.map((r) => r.propertyId))];
  const channels = [...new Set(mine.map((r) => r.source))];
  const couponsUsed = [
    ...new Set(mine.map((r) => r.couponCode).filter((c): c is string => !!c)),
  ];
  const stays = confirmed.map((r) => r.checkIn).sort();

  return {
    ...customer,
    fullName: displayName(customer),
    reservationCount: mine.length,
    confirmedCount: confirmed.length,
    totalSpentCents,
    propertiesVisited,
    lastPropertyId: confirmed.at(-1)?.propertyId ?? null,
    lastStay: stays.at(-1) ?? null,
    firstStay: stays[0] ?? null,
    couponsUsed,
    channels,
  };
}
