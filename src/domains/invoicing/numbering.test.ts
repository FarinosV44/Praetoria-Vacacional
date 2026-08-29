import { describe, expect, it } from "vitest";
import {
  detectGaps,
  formatInvoiceNumber,
  isDuplicateNumber,
  numberingInsight,
  parseInvoiceNumber,
  suggestNextNumber,
  yearCodeOf,
} from "./numbering";

describe("parse / format", () => {
  it("parses the owner's example numbers", () => {
    expect(parseInvoiceNumber("JAV-260503")).toEqual({ series: "JAV", yearCode: "26", seq: 503 });
    expect(parseInvoiceNumber("PALM-260401")).toEqual({ series: "PALM", yearCode: "26", seq: 401 });
  });
  it("is case-insensitive and trims", () => {
    expect(parseInvoiceNumber("  jav-260001 ")?.seq).toBe(1);
  });
  it("rejects junk", () => {
    expect(parseInvoiceNumber("factura 5")).toBeNull();
    expect(parseInvoiceNumber("JAV260001")).toBeNull();
  });
  it("formats with 4-digit zero padding", () => {
    expect(formatInvoiceNumber("JAV", "26", 3)).toBe("JAV-260003");
    expect(formatInvoiceNumber("palm", "26", 1234)).toBe("PALM-261234");
  });
  it("yearCodeOf takes the last two digits", () => {
    expect(yearCodeOf("2026-04-01")).toBe("26");
    expect(yearCodeOf(new Date("2030-01-01T00:00:00Z"))).toBe("30");
  });
});

describe("suggestNextNumber", () => {
  it("is 1 when the series+year has no invoices", () => {
    expect(suggestNextNumber("JAV", "26", [])).toBe("JAV-260001");
    expect(suggestNextNumber("JAV", "26", ["PALM-260009", "JAV-250100"])).toBe("JAV-260001");
  });
  it("is highest + 1 within the same series and year", () => {
    expect(suggestNextNumber("JAV", "26", ["JAV-260001", "JAV-260003", "PALM-269999"])).toBe(
      "JAV-260004",
    );
  });
});

describe("isDuplicateNumber", () => {
  it("matches case-insensitively", () => {
    expect(isDuplicateNumber("jav-260001", ["JAV-260001"])).toBe(true);
    expect(isDuplicateNumber("JAV-260002", ["JAV-260001"])).toBe(false);
  });
});

describe("detectGaps", () => {
  it("reports missing sequences between the min and max present", () => {
    expect(detectGaps("JAV", "26", ["JAV-260001", "JAV-260002", "JAV-260005"])).toEqual([3, 4]);
  });
  it("is empty for a contiguous run or a single invoice", () => {
    expect(detectGaps("JAV", "26", ["JAV-260001", "JAV-260002"])).toEqual([]);
    expect(detectGaps("JAV", "26", ["JAV-260007"])).toEqual([]);
  });
});

describe("numberingInsight", () => {
  it("bundles suggestion + formatted gaps + count", () => {
    const insight = numberingInsight("PALM", "26", ["PALM-260401", "PALM-260403"]);
    expect(insight.suggestedNext).toBe("PALM-260404");
    expect(insight.gaps).toEqual(["PALM-260402"]);
    expect(insight.count).toBe(2);
  });
});
