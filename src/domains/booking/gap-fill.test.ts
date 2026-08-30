import { describe, expect, it } from "vitest";
import { fillsGapExactly } from "./gap-fill";
import type { BusyRange } from "./types";

const r = (start: string, end: string): BusyRange => ({ start, end, kind: "reservation" });

// Guest A: 15→18, Guest B: 20→23  →  the 18→20 gap is exactly 2 nights.
const ranges = [r("2026-05-15", "2026-05-18"), r("2026-05-20", "2026-05-23")];

describe("fillsGapExactly (issue #60 §5)", () => {
  it("accepts a stay that exactly fills the 2-night gap", () => {
    expect(fillsGapExactly(ranges, "2026-05-18", "2026-05-20")).toBe(true);
  });

  it("rejects a stay that leaves a free night before it", () => {
    expect(fillsGapExactly(ranges, "2026-05-19", "2026-05-20")).toBe(false);
  });

  it("rejects a stay that leaves a free night after it", () => {
    expect(fillsGapExactly(ranges, "2026-05-18", "2026-05-19")).toBe(false);
  });

  it("rejects a stay that overlaps an occupied night", () => {
    expect(fillsGapExactly(ranges, "2026-05-17", "2026-05-20")).toBe(false);
  });

  it("rejects when there is no occupancy on either side", () => {
    expect(fillsGapExactly([], "2026-05-18", "2026-05-20")).toBe(false);
  });

  it("works when the surrounding occupancy comes from manual blocks", () => {
    const blocks: BusyRange[] = [
      { start: "2026-05-15", end: "2026-05-18", kind: "block" },
      { start: "2026-05-20", end: "2026-05-23", kind: "block" },
    ];
    expect(fillsGapExactly(blocks, "2026-05-18", "2026-05-20")).toBe(true);
  });

  it("rejects an inverted range", () => {
    expect(fillsGapExactly(ranges, "2026-05-20", "2026-05-18")).toBe(false);
  });
});
