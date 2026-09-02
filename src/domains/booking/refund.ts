/**
 * Issue #67 — pure refund computation from a property's cancellation policy.
 *
 * Policy (user decision 2026-09-02, "tiered by lead time"): the tiers are
 * `{ daysBefore, refundPercent }` sorted high→low; the first tier whose
 * `daysBefore` is ≤ the actual lead time applies. No tier matched (cancelling
 * after check-in) → 0 %.
 */

import type { CancellationPolicy, CancellationTier } from "@/domains/properties/types";

export interface RefundComputation {
  /** Whole days between the cancellation moment and check-in (floored, ≥ 0). */
  daysBefore: number;
  refundPercent: number;
  refundCents: number;
  appliedTier: CancellationTier | null;
}

export function daysUntilCheckIn(checkIn: string, cancelledAt: Date): number {
  const ci = Date.parse(`${checkIn}T00:00:00Z`);
  const diff = ci - cancelledAt.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function computeRefund(
  policy: Pick<CancellationPolicy, "tiers">,
  checkIn: string,
  totalCents: number,
  cancelledAt: Date = new Date(),
): RefundComputation {
  const daysBefore = daysUntilCheckIn(checkIn, cancelledAt);
  const tiers = [...policy.tiers].sort((a, b) => b.daysBefore - a.daysBefore);
  const appliedTier = tiers.find((t) => daysBefore >= t.daysBefore) ?? null;
  const refundPercent = appliedTier?.refundPercent ?? 0;
  const refundCents = Math.round((totalCents * refundPercent) / 100);
  return { daysBefore, refundPercent, refundCents, appliedTier };
}
