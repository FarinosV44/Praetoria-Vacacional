import { describe, expect, it } from "vitest";
import { computeInvoiceTotals, lineAmountCents } from "./totals";
import { defaultSeriesFor } from "./types";

describe("lineAmountCents", () => {
  it("rounds fractional quantities", () => {
    expect(lineAmountCents(3, 12000)).toBe(36000);
    expect(lineAmountCents(3.5, 10000)).toBe(35000);
    expect(lineAmountCents(1, 12345)).toBe(12345);
  });
});

describe("computeInvoiceTotals", () => {
  const items = [
    { quantity: 4, unitCents: 12000 }, // 480,00
    { quantity: 1, unitCents: 5000 }, // 50,00 (limpieza)
  ];

  it("is tax-free when exempt (the current LIVA 20.Uno.23º case)", () => {
    expect(computeInvoiceTotals(items, { taxExempt: true, taxRate: 21 })).toEqual({
      subtotalCents: 53000,
      taxCents: 0,
      totalCents: 53000,
    });
  });

  it("applies a configurable rate when not exempt", () => {
    expect(computeInvoiceTotals(items, { taxExempt: false, taxRate: 10 })).toEqual({
      subtotalCents: 53000,
      taxCents: 5300,
      totalCents: 58300,
    });
  });

  it("handles an empty invoice", () => {
    expect(computeInvoiceTotals([], { taxExempt: false, taxRate: 21 })).toEqual({
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });
});

describe("defaultSeriesFor", () => {
  it("maps the two known properties to JAV / PALM", () => {
    expect(defaultSeriesFor("javalambre")).toBe("JAV");
    expect(defaultSeriesFor("valencia")).toBe("PALM");
  });
  it("derives a prefix for any other slug", () => {
    expect(defaultSeriesFor("otro-alojamiento")).toBe("OTRO");
  });
});
