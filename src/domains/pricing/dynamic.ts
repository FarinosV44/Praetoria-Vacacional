/**
 * Issue #74 — explainable dynamic pricing with hard guardrails.
 *
 * Pure. `suggestNightlyRate` takes the "natural" price the rate engine would
 * charge for a date and nudges it by a set of named factors (lead time, demand,
 * orphan nights). The result is always clamped to ±`bandPct` of the natural
 * price and never below `floorCents` — the guardrails the owner configured.
 */

import type { IsoDate } from "@/lib/dates";

export interface DynamicContext {
  date: IsoDate;
  /** What the rate engine charges for this date today, before any dynamic nudge. */
  baseNightlyCents: number;
  floorCents: number;
  /** Max move up or down, percent of base. */
  bandPct: number;
  /** Whole days from "now" to `date` (≥ 0). */
  leadDays: number;
  /** 0–1 occupancy of this property in a window around `date`. */
  windowOccupancy: number;
  /** A free night sandwiched between two occupied nights. */
  isOrphanNight: boolean;
}

export interface PricingFactor {
  label: string;
  /** Signed percentage applied to the base. */
  deltaPct: number;
  reason: string;
}

export interface PricingSuggestion {
  date: IsoDate;
  baseCents: number;
  recommendedCents: number;
  factors: PricingFactor[];
  /** Set when a guardrail changed the raw recommendation. */
  clamped: "band" | "floor" | null;
  changePct: number;
}

function leadFactor(leadDays: number): PricingFactor | null {
  if (leadDays <= 3) return { label: "Última hora", deltaPct: -12, reason: "quedan pocos días para vender esta fecha" };
  if (leadDays <= 7) return { label: "Última semana", deltaPct: -6, reason: "menos de una semana de margen" };
  if (leadDays >= 120) return { label: "Reserva anticipada", deltaPct: 4, reason: "demanda temprana, margen para subir" };
  return null;
}

function demandFactor(occ: number, leadDays: number): PricingFactor | null {
  if (occ >= 0.85) return { label: "Demanda muy alta", deltaPct: 18, reason: `ocupación ${Math.round(occ * 100)}% en la ventana` };
  if (occ >= 0.65) return { label: "Demanda alta", deltaPct: 10, reason: `ocupación ${Math.round(occ * 100)}% en la ventana` };
  if (occ <= 0.2 && leadDays < 30) return { label: "Demanda baja", deltaPct: -8, reason: `ocupación ${Math.round(occ * 100)}% y fecha próxima` };
  return null;
}

export function suggestNightlyRate(ctx: DynamicContext): PricingSuggestion {
  const factors: PricingFactor[] = [];
  const lead = leadFactor(ctx.leadDays);
  if (lead) factors.push(lead);
  const demand = demandFactor(ctx.windowOccupancy, ctx.leadDays);
  if (demand) factors.push(demand);
  if (ctx.isOrphanNight) {
    factors.push({ label: "Noche suelta", deltaPct: -15, reason: "hueco de una noche entre reservas" });
  }

  const totalPct = factors.reduce((s, f) => s + f.deltaPct, 0);
  const raw = Math.round(ctx.baseNightlyCents * (1 + totalPct / 100));

  const band = ctx.bandPct / 100;
  const bandLow = Math.round(ctx.baseNightlyCents * (1 - band));
  const bandHigh = Math.round(ctx.baseNightlyCents * (1 + band));

  let recommended = raw;
  let clamped: "band" | "floor" | null = null;
  if (recommended > bandHigh) {
    recommended = bandHigh;
    clamped = "band";
  } else if (recommended < bandLow) {
    recommended = bandLow;
    clamped = "band";
  }
  if (recommended < ctx.floorCents) {
    recommended = ctx.floorCents;
    clamped = "floor";
  }

  return {
    date: ctx.date,
    baseCents: ctx.baseNightlyCents,
    recommendedCents: recommended,
    factors,
    clamped,
    changePct: ctx.baseNightlyCents
      ? Math.round(((recommended - ctx.baseNightlyCents) / ctx.baseNightlyCents) * 100)
      : 0,
  };
}

export interface DynamicPricingSettings {
  enabled: boolean;
  floorCents: number;
  bandPct: number;
  horizonDays: number;
}

export function defaultDynamicSettings(baseNightlyCents: number): DynamicPricingSettings {
  return {
    enabled: false,
    floorCents: Math.round(baseNightlyCents * 0.6),
    bandPct: 25,
    horizonDays: 60,
  };
}
