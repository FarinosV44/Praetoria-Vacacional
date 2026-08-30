import type { QuoteFee, RateConfig, StayFee } from "./types";

/**
 * Resolve the per-stay charges that actually apply (issue #58).
 *
 * Rules:
 *  - a charge counts only when `enabled` AND `amountCents > 0` — a disabled or
 *    zero charge is invisible everywhere (no line, no "0 €", nothing billed);
 *  - if `config.fees` is absent, fall back to the legacy single
 *    `cleaningFeeCents` (treated as one enabled "cleaning" charge when > 0);
 *  - if `config.fees` is present it is authoritative and `cleaningFeeCents` is
 *    ignored.
 *
 * Pure — no I/O.
 */
export function resolveStayFees(config: Pick<RateConfig, "fees" | "cleaningFeeCents">): StayFee[] {
  const source: StayFee[] =
    config.fees ??
    (config.cleaningFeeCents > 0
      ? [
          {
            key: "cleaning",
            label: "Limpieza",
            enabled: true,
            amountCents: config.cleaningFeeCents,
          },
        ]
      : []);

  return source.filter((f) => f.enabled && f.amountCents > 0);
}

/** The applied charges as they appear on a quote. */
export function quoteFees(config: Pick<RateConfig, "fees" | "cleaningFeeCents">): QuoteFee[] {
  return resolveStayFees(config).map((f) => ({
    key: f.key,
    label: f.label,
    amountCents: f.amountCents,
    ...(f.description ? { description: f.description } : {}),
  }));
}

/** Total of every applied charge. */
export function feesTotalCents(config: Pick<RateConfig, "fees" | "cleaningFeeCents">): number {
  return resolveStayFees(config).reduce((sum, f) => sum + f.amountCents, 0);
}

/**
 * English names for the built-in charge keys, so the EN checkout shows
 * "Cleaning" rather than the Spanish `label`. Unknown keys fall back to `label`.
 */
const FEE_LABEL_EN: Record<string, string> = {
  cleaning: "Cleaning",
  linen: "Linen",
  pets: "Pets",
  "tourist-tax": "Tourist tax",
};

export function feeLabel(fee: { key: string; label: string }, locale: "es" | "en"): string {
  return locale === "en" ? (FEE_LABEL_EN[fee.key] ?? fee.label) : fee.label;
}

/** Total of the applied charges that `taxPercent` should be applied to. */
export function taxableFeesCents(config: Pick<RateConfig, "fees" | "cleaningFeeCents">): number {
  return resolveStayFees(config)
    .filter((f) => f.taxable)
    .reduce((sum, f) => sum + f.amountCents, 0);
}
