import type { IsoDate } from "@/lib/dates";
import type { ReservationSource } from "@/domains/booking/types";
import type { CustomerProfile } from "@/domains/crm/types";

/**
 * Saved-segment criteria (issue #56 §6). Every field is optional and AND-ed.
 * Evaluated purely against a CustomerProfile — tested in isolation.
 */
export interface SegmentCriteria {
  /** property ids visited (confirmed stays) — any match. */
  properties?: string[];
  /** origin channel(s) — any match. */
  channels?: ReservationSource[];
  /** ISO-639 language codes — any match. */
  languages?: string[];
  /** "national" = country ES/España/empty; "foreign" = anything else. */
  origin?: "national" | "foreign";
  /** >= 2 confirmed reservations. */
  repeatersOnly?: boolean;
  minTotalSpentCents?: number;
  /** win-back: last confirmed stay strictly before this date. */
  lastStayBefore?: IsoDate;
  /** last confirmed stay on/after this date. */
  lastStayAfter?: IsoDate;
  /** only customers with a valid marketing consent. */
  consentOnly?: boolean;
  /** has used at least one coupon. */
  couponUsed?: boolean;
}

const NATIONAL = new Set(["", "es", "españa", "espana", "spain"]);

function isNational(country: string | null): boolean {
  return NATIONAL.has((country ?? "").trim().toLowerCase());
}

export function matchSegment(criteria: SegmentCriteria, p: CustomerProfile): boolean {
  if (p.mergedInto) return false;

  if (criteria.consentOnly && !p.marketingConsent) return false;

  if (criteria.properties?.length) {
    if (!criteria.properties.some((id) => p.propertiesVisited.includes(id))) return false;
  }
  if (criteria.channels?.length) {
    const chans = new Set<ReservationSource>([...p.channels, ...(p.channelOrigin ? [p.channelOrigin] : [])]);
    if (!criteria.channels.some((c) => chans.has(c))) return false;
  }
  if (criteria.languages?.length) {
    if (!criteria.languages.map((l) => l.toLowerCase()).includes((p.language ?? "").toLowerCase()))
      return false;
  }
  if (criteria.origin === "national" && !isNational(p.country)) return false;
  if (criteria.origin === "foreign" && isNational(p.country)) return false;

  if (criteria.repeatersOnly && p.confirmedCount < 2) return false;
  if (criteria.minTotalSpentCents != null && p.totalSpentCents < criteria.minTotalSpentCents)
    return false;

  if (criteria.lastStayBefore) {
    if (!p.lastStay || p.lastStay >= criteria.lastStayBefore) return false;
  }
  if (criteria.lastStayAfter) {
    if (!p.lastStay || p.lastStay < criteria.lastStayAfter) return false;
  }
  if (criteria.couponUsed && p.couponsUsed.length === 0) return false;

  return true;
}

export function evaluateSegment(
  criteria: SegmentCriteria,
  profiles: CustomerProfile[],
): CustomerProfile[] {
  return profiles.filter((p) => matchSegment(criteria, p));
}

export function describeCriteria(c: SegmentCriteria): string[] {
  const parts: string[] = [];
  if (c.properties?.length) parts.push(`alojamiento(s): ${c.properties.length}`);
  if (c.channels?.length) parts.push(`canal: ${c.channels.join(", ")}`);
  if (c.languages?.length) parts.push(`idioma: ${c.languages.join(", ")}`);
  if (c.origin) parts.push(c.origin === "national" ? "nacionales" : "extranjeros");
  if (c.repeatersOnly) parts.push("repetidores");
  if (c.minTotalSpentCents != null)
    parts.push(`gasto ≥ ${(c.minTotalSpentCents / 100).toFixed(0)} €`);
  if (c.lastStayBefore) parts.push(`última estancia antes de ${c.lastStayBefore}`);
  if (c.lastStayAfter) parts.push(`última estancia desde ${c.lastStayAfter}`);
  if (c.couponUsed) parts.push("han usado cupón");
  if (c.consentOnly) parts.push("con consentimiento");
  return parts.length ? parts : ["todos los clientes"];
}
