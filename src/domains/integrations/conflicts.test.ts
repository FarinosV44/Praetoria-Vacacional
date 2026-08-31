import { describe, expect, it } from "vitest";
import { detectChannelConflicts } from "./conflicts";

const block = (start: string, end: string, externalUid: string | null = null) => ({
  startDate: start,
  endDate: end,
  externalUid,
});
const res = (
  id: string,
  checkIn: string,
  checkOut: string,
  status: "pending" | "confirmed" | "external" | "cancelled",
  externalUid: string | null = null,
) => ({ id, code: `PV-${id}`, status, externalUid, checkIn, checkOut });

describe("detectChannelConflicts (issue #84)", () => {
  it("flags a feed block overlapping a direct confirmed reservation", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14", "booking-1")],
      [res("1", "2026-09-12", "2026-09-16", "confirmed")],
    );
    expect(c).toHaveLength(1);
    expect(c[0]?.reservationCode).toBe("PV-1");
  });

  it("flags a pending direct reservation too", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14")],
      [res("1", "2026-09-13", "2026-09-15", "pending")],
    );
    expect(c).toHaveLength(1);
  });

  it("does NOT flag the block's own mirror reservation", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14", "booking-1")],
      [res("1", "2026-09-10", "2026-09-14", "external", "booking-1")],
    );
    expect(c).toEqual([]);
  });

  it("does NOT flag an adjacent (half-open) reservation", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14")],
      [res("1", "2026-09-14", "2026-09-18", "confirmed")],
    );
    expect(c).toEqual([]);
  });

  it("ignores cancelled reservations", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14")],
      [res("1", "2026-09-11", "2026-09-13", "cancelled")],
    );
    expect(c).toEqual([]);
  });

  it("ignores other external reservations (only direct sales conflict)", () => {
    const c = detectChannelConflicts(
      [block("2026-09-10", "2026-09-14", "booking-1")],
      [res("1", "2026-09-11", "2026-09-13", "external", "airbnb-9")],
    );
    expect(c).toEqual([]);
  });
});
