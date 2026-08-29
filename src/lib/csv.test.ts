import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes cells with commas, quotes or newlines and doubles inner quotes", () => {
    expect(csvCell("simple")).toBe("simple");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("builds a BOM-prefixed CRLF document", () => {
    const out = toCsv(["a", "b"], [
      [1, "x"],
      ["y,z", null],
    ]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toContain("a,b\r\n");
    expect(out).toContain('1,x\r\n');
    expect(out).toContain('"y,z",\r\n');
  });
});
