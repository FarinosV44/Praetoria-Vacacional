import "server-only";
import { addDays, nightsBetween, todayIso, type IsoDate } from "@/lib/dates";
import { getRepository } from "@/lib/repository";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { buildQuote } from "@/domains/pricing/engine";
import type { Quote } from "@/domains/pricing/types";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { buildCalendar, isRangeAvailable } from "./availability";
import type { CalendarDay } from "./types";

/**
 * Server-side orchestration used by route handlers and server components.
 * Combines the repository (real availability) with the pricing engine.
 */

export interface AvailabilityResult {
  propertySlug: string;
  propertyName: string;
  experience: "ski" | "sea";
  available: boolean;
  quote: Quote | null;
  reason: string | null;
}

/** Search a single property for a date range + guests. */
export async function checkProperty(
  slug: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
): Promise<AvailabilityResult> {
  const property = getPropertyBySlug(slug);
  const rate = await resolveRateConfig(slug);
  if (!property || !rate) {
    return {
      propertySlug: slug,
      propertyName: slug,
      experience: "sea",
      available: false,
      quote: null,
      reason: "Alojamiento no encontrado",
    };
  }

  const repo = getRepository();
  const free = await repo.isStayAvailable(property.id, checkIn, checkOut);
  const quote = buildQuote(rate, { propertySlug: slug, checkIn, checkOut, guests });

  let reason: string | null = null;
  if (!free) reason = "No disponible para estas fechas";
  else if (!quote.valid) reason = "Las fechas no cumplen las condiciones de reserva";

  return {
    propertySlug: slug,
    propertyName: property.name,
    experience: property.experience,
    available: free && quote.valid,
    quote,
    reason,
  };
}

/** Global search across every registered property (issue #3, #7). */
export async function searchAllProperties(
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
): Promise<AvailabilityResult[]> {
  return Promise.all(getAllProperties().map((p) => checkProperty(p.slug, checkIn, checkOut, guests)));
}

/** Authoritative quote for checkout. Re-checks availability. */
export async function quoteForCheckout(
  slug: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
): Promise<{ ok: true; quote: Quote; propertyId: string } | { ok: false; error: string }> {
  const property = getPropertyBySlug(slug);
  const rate = await resolveRateConfig(slug);
  if (!property || !rate) return { ok: false, error: "Alojamiento no encontrado" };

  const quote = buildQuote(rate, { propertySlug: slug, checkIn, checkOut, guests });
  if (!quote.valid) return { ok: false, error: "Las fechas no cumplen las condiciones de reserva" };

  const repo = getRepository();
  const free = await repo.isStayAvailable(property.id, checkIn, checkOut);
  if (!free) return { ok: false, error: "Las fechas ya no están disponibles" };

  return { ok: true, quote, propertyId: property.id };
}

/** Calendar day-states for a property over a window (default: 12 months). */
export async function getPropertyCalendar(
  slug: string,
  months = 12,
): Promise<{ from: IsoDate; to: IsoDate; days: CalendarDay[] } | null> {
  const property = getPropertyBySlug(slug);
  if (!property) return null;
  const from = todayIso();
  const to = addDays(from, months * 31);
  const repo = getRepository();
  const ranges = await repo.getBusyRanges(property.id, from, to);
  return { from, to, days: buildCalendar(ranges, from, to, from) };
}

export { isRangeAvailable, nightsBetween };
