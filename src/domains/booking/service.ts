import "server-only";
import { addDays, nightsBetween, todayIso, type IsoDate } from "@/lib/dates";
import { getRepository } from "@/lib/repository";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { buildQuote } from "@/domains/pricing/engine";
import type { Quote } from "@/domains/pricing/types";
import { checkCoupon, describeRejection, normalizeCode } from "@/domains/pricing/coupons";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { buildCalendar, isRangeAvailable, occupancy } from "./availability";
import { fillsGapExactly } from "./gap-fill";
import { rescueAlternatives, type AlternativeStay } from "./alternatives";
import type { CalendarDay } from "./types";

/**
 * Server-side orchestration used by route handlers and server components.
 * Combines the repository (real availability) with the pricing engine and the
 * coupon rules (issue #45). The client never supplies a price or a discount.
 */

export interface CouponResult {
  code: string;
  applied: boolean;
  discountCents: number;
  label: string;
  message: string | null;
}

/** A priced quote with the coupon layered on top (`totalCents` is FINAL). */
export interface PricedQuote extends Quote {
  subtotalBeforeCouponCents: number;
  coupon: CouponResult | null;
}

/** A nearby free window for an unavailable request, already priced (issue #92). */
export interface PricedAlternative extends AlternativeStay {
  totalCents: number;
  nightlyFromCents: number;
}

export interface AvailabilityResult {
  propertySlug: string;
  propertyName: string;
  experience: "ski" | "sea";
  available: boolean;
  quote: PricedQuote | null;
  reason: string | null;
  /** Real nearby availability when `available` is false — never invented. */
  alternatives: PricedAlternative[];
  /** Real source-attributed rating for social proof in results (issue #90). */
  rating: { value: number; count: number; source: "booking" } | null;
}

/**
 * True when this stay exactly fills a gap between two occupied spans and the
 * property allows selling such gaps below the minimum stay (issue #60 §5).
 */
async function allowGapFill(
  repo: ReturnType<typeof getRepository>,
  propertyId: string,
  rate: { sellExactGaps?: boolean },
  checkIn: IsoDate,
  checkOut: IsoDate,
): Promise<boolean> {
  if (rate.sellExactGaps === false) return false;
  try {
    const ranges = await repo.getBusyRanges(propertyId, addDays(checkIn, -2), addDays(checkOut, 2));
    return fillsGapExactly(ranges, checkIn, checkOut);
  } catch {
    return false;
  }
}

async function applyCoupon(
  quote: Quote,
  slug: string,
  couponCode: string | undefined,
  now: IsoDate,
  locale: "es" | "en" = "es",
): Promise<PricedQuote> {
  const base: PricedQuote = {
    ...quote,
    subtotalBeforeCouponCents: quote.totalCents,
    coupon: null,
  };
  if (!couponCode || !quote.valid) return base;

  const code = normalizeCode(couponCode);
  const coupon = await getRepository()
    .getCouponByCode(code)
    .catch(() => null);

  const check = checkCoupon(coupon, {
    propertySlug: slug,
    nights: quote.nights,
    baseTotalCents: quote.totalCents,
    now,
  });

  if (!check.ok) {
    return {
      ...base,
      coupon: {
        code,
        applied: false,
        discountCents: 0,
        label: "",
        message: describeRejection(check.rejection ?? "not_found", locale),
      },
    };
  }

  return {
    ...base,
    totalCents: quote.totalCents - check.discountCents,
    coupon: {
      code,
      applied: true,
      discountCents: check.discountCents,
      label: check.label,
      message: null,
    },
  };
}

/** Search a single property for a date range + guests (+ optional coupon). */
export async function checkProperty(
  slug: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
  couponCode?: string,
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
      alternatives: [],
      rating: null,
    };
  }

  const repo = getRepository();
  const now = todayIso();

  // One busy-range read covers both the gap-fill check and the alternatives
  // search when the request turns out to be unavailable.
  const ranges = await repo
    .getBusyRanges(property.id, addDays(now, -2), addDays(checkOut, 45))
    .catch(() => [] as Awaited<ReturnType<typeof repo.getBusyRanges>>);

  const free = await repo.isStayAvailable(property.id, checkIn, checkOut);
  const skipMinNights = rate.sellExactGaps !== false && fillsGapExactly(ranges, checkIn, checkOut);
  const rawQuote = buildQuote(
    rate,
    { propertySlug: slug, checkIn, checkOut, guests },
    now,
    { skipMinNights },
  );
  const quote = await applyCoupon(rawQuote, slug, couponCode, now);
  const available = free && quote.valid;

  let reason: string | null = null;
  if (!free) reason = "No disponible para estas fechas";
  else if (!quote.valid) reason = "Las fechas no cumplen las condiciones de reserva";

  const alternatives: PricedAlternative[] = available
    ? []
    : rescueAlternatives(ranges, checkIn, checkOut, { now, leadDays: rate.leadTimeDays, limit: 3 })
        .map((alt) => {
          const q = buildQuote(rate, { propertySlug: slug, checkIn: alt.checkIn, checkOut: alt.checkOut, guests }, now);
          return q.valid && q.totalCents > 0
            ? {
                ...alt,
                totalCents: q.totalCents,
                nightlyFromCents: Math.round(q.nightlySubtotalCents / Math.max(1, q.nights)),
              }
            : null;
        })
        .filter((a): a is PricedAlternative => a !== null);

  return {
    propertySlug: slug,
    propertyName: property.name,
    experience: property.experience,
    available,
    quote,
    reason,
    alternatives,
    rating: property.rating ?? null,
  };
}

/** Global search across every registered property (issue #3, #7). */
export async function searchAllProperties(
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
  couponCode?: string,
): Promise<AvailabilityResult[]> {
  return Promise.all(
    getAllProperties().map((p) => checkProperty(p.slug, checkIn, checkOut, guests, couponCode)),
  );
}

/** Authoritative quote for checkout. Re-checks availability. */
export async function quoteForCheckout(
  slug: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  guests: number,
  couponCode?: string,
): Promise<
  { ok: true; quote: PricedQuote; propertyId: string } | { ok: false; error: string }
> {
  const property = getPropertyBySlug(slug);
  const rate = await resolveRateConfig(slug);
  if (!property || !rate) return { ok: false, error: "Alojamiento no encontrado" };

  const now = todayIso();
  const repo = getRepository();
  const skipMinNights = await allowGapFill(repo, property.id, rate, checkIn, checkOut);
  const rawQuote = buildQuote(
    rate,
    { propertySlug: slug, checkIn, checkOut, guests },
    now,
    { skipMinNights },
  );
  if (!rawQuote.valid) return { ok: false, error: "Las fechas no cumplen las condiciones de reserva" };

  const free = await repo.isStayAvailable(property.id, checkIn, checkOut);
  if (!free) return { ok: false, error: "Las fechas ya no están disponibles" };

  const quote = await applyCoupon(rawQuote, slug, couponCode, now);
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

/**
 * Data-backed availability signal for a property over the next `horizonDays`
 * (issue #49). Returns the real occupancy so the UI can show an honest message
 * ("filling up" only when it genuinely is). Never invents scarcity.
 */
export async function getAvailabilityInsight(
  slug: string,
  horizonDays = 45,
): Promise<{ level: "high" | "medium" | "low"; occupancyPct: number; horizonDays: number } | null> {
  const property = getPropertyBySlug(slug);
  if (!property) return null;
  const from = todayIso();
  const to = addDays(from, horizonDays);
  const repo = getRepository();
  const ranges = await repo.getBusyRanges(property.id, from, to);
  const { rate } = occupancy(ranges, from, to);
  const occupancyPct = Math.round(rate * 100);
  const level = rate >= 0.7 ? "high" : rate >= 0.45 ? "medium" : "low";
  return { level, occupancyPct, horizonDays };
}

export { isRangeAvailable, nightsBetween };
