import { parseDay, type IsoDate } from "./dates";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eurCents = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/** Cents → "1.234 €" (no decimals when whole). */
export function formatMoney(cents: number): string {
  return cents % 100 === 0 ? eur.format(cents / 100) : eurCents.format(cents / 100);
}

const longDate = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDateLong(iso: IsoDate): string {
  return longDate.format(parseDay(iso));
}
export function formatDateShort(iso: IsoDate): string {
  return shortDate.format(parseDay(iso));
}
export function formatRange(checkIn: IsoDate, checkOut: IsoDate): string {
  return `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`;
}

export function nightsLabel(n: number): string {
  return n === 1 ? "1 noche" : `${n} noches`;
}
export function guestsLabel(n: number): string {
  return n === 1 ? "1 huésped" : `${n} huéspedes`;
}
