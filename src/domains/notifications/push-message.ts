import { formatMoney, formatRange, guestsLabel, nightsLabel } from "@/lib/format";
import type { Reservation } from "@/domains/booking/types";
import type { PushMessage } from "./push";

/** Short, scannable lock-screen text for a confirmed booking. Pure. */
export function reservationPushMessage(
  r: Pick<Reservation, "id" | "code" | "checkIn" | "checkOut" | "nights" | "guests" | "totalCents" | "guestName">,
  propertyName: string,
): PushMessage {
  const who = r.guestName?.trim() ? ` · ${r.guestName.trim()}` : "";
  return {
    title: `Nueva reserva · ${propertyName}`,
    body: `${formatRange(r.checkIn, r.checkOut)} · ${nightsLabel(r.nights)} · ${guestsLabel(r.guests)} · ${formatMoney(r.totalCents)}${who}`,
    url: `/admin/reservas/${r.id}`,
    tag: `reserva-${r.code || r.id}`,
  };
}
