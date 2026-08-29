import type { InvoiceItemInput } from "./types";

/** Line amount in cents. Quantity may be fractional (e.g. 3.5 noches). */
export function lineAmountCents(quantity: number, unitCents: number): number {
  return Math.round(quantity * unitCents);
}

export interface InvoiceTotals {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

/**
 * Compute an invoice's money. Tax is configurable per property (issue #56 §3):
 * when `taxExempt` the tax is 0 whatever the rate; otherwise it is
 * `round(subtotal * rate / 100)`. All amounts are integer cents.
 */
export function computeInvoiceTotals(
  items: Pick<InvoiceItemInput, "quantity" | "unitCents">[],
  opts: { taxExempt: boolean; taxRate: number },
): InvoiceTotals {
  const subtotalCents = items.reduce(
    (sum, it) => sum + lineAmountCents(it.quantity, it.unitCents),
    0,
  );
  const taxCents = opts.taxExempt ? 0 : Math.round((subtotalCents * opts.taxRate) / 100);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
