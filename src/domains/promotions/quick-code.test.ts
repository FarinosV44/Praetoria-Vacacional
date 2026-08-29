import { describe, expect, it } from "vitest";
import { prefixFromLabel, quickCode, randomSuffix } from "./quick-code";

describe("quick promo code", () => {
  it("derives an initials prefix, accent-folded, max 3", () => {
    expect(prefixFromLabel("Marta Ruiz")).toBe("MR");
    expect(prefixFromLabel("Clientes Ámbar del Mar")).toBe("CAD");
    expect(prefixFromLabel("")).toBe("PV");
  });

  it("suffix uses an unambiguous alphabet (no I/O/0/1)", () => {
    const s = randomSuffix(200, mulberry32(42));
    expect(s).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("quickCode is deterministic given a seeded RNG", () => {
    expect(quickCode("Marta Ruiz", mulberry32(1))).toBe(quickCode("Marta Ruiz", mulberry32(1)));
    expect(quickCode("Marta Ruiz", mulberry32(1))).toMatch(/^MR[A-Z0-9]{4}$/);
  });
});

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
