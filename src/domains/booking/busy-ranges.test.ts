import { describe, expect, it } from "vitest";
import { consolidateBusyRanges, statusOccupies } from "./busy-ranges";
import { buildCalendar, busyNightSet, isRangeAvailable } from "./availability";
import type { BusyRange } from "./types";

/**
 * Contract for `public.property_busy_ranges` — modelled by `consolidateBusyRanges`
 * (the pure function the DEMO repo also uses) and verified end to end through the
 * calendar/overlap consumers. Every scenario the task calls out:
 *   adjacent bookings · same-day checkout/check-in · direct reservation blocks ·
 *   manual blocks · Booking/iCal blocks · no false extra occupied day.
 */

const res = (status: string, checkIn: string, checkOut: string) => ({ status, checkIn, checkOut });
const block = (startDate: string, endDate: string) => ({ startDate, endDate });

/** Nights occupied by the consolidated ranges (the real availability picture). */
function occupiedNights(ranges: BusyRange[]): string[] {
  return [...busyNightSet(ranges)].sort();
}

describe("statusOccupies", () => {
  it("pending and confirmed occupy; external / cancelled / expired do not", () => {
    expect(statusOccupies("pending")).toBe(true);
    expect(statusOccupies("confirmed")).toBe(true);
    expect(statusOccupies("external")).toBe(false);
    expect(statusOccupies("cancelled")).toBe(false);
    expect(statusOccupies("expired")).toBe(false);
  });
});

describe("consolidateBusyRanges — half-open semantics", () => {
  it("a 21→24 booking occupies the nights of the 21st, 22nd and 23rd only", () => {
    const ranges = consolidateBusyRanges([res("confirmed", "2026-09-21", "2026-09-24")], []);
    expect(ranges).toEqual([{ start: "2026-09-21", end: "2026-09-24", kind: "reservation" }]);
    expect(occupiedNights(ranges)).toEqual(["2026-09-21", "2026-09-22", "2026-09-23"]);
  });

  it("no false extra occupied day after checkout — the 24th stays free", () => {
    const ranges = consolidateBusyRanges([res("confirmed", "2026-09-21", "2026-09-24")], []);
    expect(occupiedNights(ranges)).not.toContain("2026-09-24");
    // another guest can check in on the 24th
    expect(isRangeAvailable(ranges, "2026-09-24", "2026-09-27")).toBe(true);
  });
});

describe("consolidateBusyRanges — every busy source", () => {
  it("consolidates a direct reservation, a manual block and a Booking/iCal block", () => {
    const ranges = consolidateBusyRanges(
      [res("confirmed", "2026-09-05", "2026-09-08")], // direct
      [
        block("2026-09-10", "2026-09-12"), // manual closure
        block("2026-09-20", "2026-09-23"), // imported from Booking (an availability_blocks row)
      ],
    );
    expect(ranges).toEqual([
      { start: "2026-09-05", end: "2026-09-08", kind: "reservation" },
      { start: "2026-09-10", end: "2026-09-12", kind: "block" },
      { start: "2026-09-20", end: "2026-09-23", kind: "block" },
    ]);
    expect(occupiedNights(ranges)).toEqual([
      "2026-09-05", "2026-09-06", "2026-09-07",
      "2026-09-10", "2026-09-11",
      "2026-09-20", "2026-09-21", "2026-09-22",
    ]);
  });

  it("drops an external reservation (its iCal block already holds the dates)", () => {
    const ranges = consolidateBusyRanges(
      [res("external", "2026-09-01", "2026-09-04")],
      [block("2026-09-01", "2026-09-04")], // the imported block for that same Booking stay
    );
    // counted once, from the block — not twice
    expect(ranges).toEqual([{ start: "2026-09-01", end: "2026-09-04", kind: "block" }]);
    expect(occupiedNights(ranges)).toEqual(["2026-09-01", "2026-09-02", "2026-09-03"]);
  });

  it("ignores cancelled / expired reservations", () => {
    const ranges = consolidateBusyRanges(
      [
        res("cancelled", "2026-09-01", "2026-09-05"),
        res("expired", "2026-09-10", "2026-09-14"),
        res("pending", "2026-09-20", "2026-09-22"),
      ],
      [],
    );
    expect(ranges).toEqual([{ start: "2026-09-20", end: "2026-09-22", kind: "reservation" }]);
  });

  it("skips a zero/negative range defensively", () => {
    expect(consolidateBusyRanges([res("confirmed", "2026-09-10", "2026-09-10")], [])).toEqual([]);
    expect(consolidateBusyRanges([], [block("2026-09-12", "2026-09-10")])).toEqual([]);
  });
});

describe("adjacent bookings and same-day turnover (task cases)", () => {
  const existing = consolidateBusyRanges([res("confirmed", "2026-09-24", "2026-09-27")], []);

  it("21→24 is allowed even though a guest arrives on the 24th", () => {
    expect(isRangeAvailable(existing, "2026-09-21", "2026-09-24")).toBe(true);
  });
  it("21→25 is rejected — it would take the booked night of the 24th", () => {
    expect(isRangeAvailable(existing, "2026-09-21", "2026-09-25")).toBe(false);
  });

  const before = consolidateBusyRanges([res("confirmed", "2026-09-21", "2026-09-24")], []);
  it("24→27 after an existing 21→24 is allowed (shared turnover day)", () => {
    expect(isRangeAvailable(before, "2026-09-24", "2026-09-27")).toBe(true);
  });
  it("23→26 after an existing 21→24 is rejected — the night of the 23rd is taken", () => {
    expect(isRangeAvailable(before, "2026-09-23", "2026-09-26")).toBe(false);
  });

  it("two back-to-back stays fully occupy the span with no gap and no overlap", () => {
    const ranges = consolidateBusyRanges(
      [
        res("confirmed", "2026-09-21", "2026-09-24"),
        res("confirmed", "2026-09-24", "2026-09-27"),
      ],
      [],
    );
    expect(occupiedNights(ranges)).toEqual([
      "2026-09-21", "2026-09-22", "2026-09-23",
      "2026-09-24", "2026-09-25", "2026-09-26",
    ]);
  });
});

describe("buildCalendar over consolidated ranges", () => {
  it("marks the turnover day free and the mid-stay nights busy", () => {
    const ranges = consolidateBusyRanges(
      [res("confirmed", "2026-09-21", "2026-09-24")],
      [block("2026-09-24", "2026-09-25")], // a manual close on the 24th night
    );
    const byDate = Object.fromEntries(
      buildCalendar(ranges, "2026-09-20", "2026-09-27", "2026-09-01").map((d) => [d.date, d.state]),
    );
    expect(byDate["2026-09-21"]).toBe("busy");
    expect(byDate["2026-09-23"]).toBe("busy");
    // night of the 24th is closed by the manual block; the day is still the
    // checkout day of the prior stay → "checkout-only", never a phantom "busy"
    // caused by the reservation itself.
    expect(byDate["2026-09-24"]).toBe("busy"); // busy because of the block, not the reservation
    expect(byDate["2026-09-25"]).toBe("checkout-only");
    expect(byDate["2026-09-26"]).toBe("free");
  });

  it("without the block, the checkout day is checkout-only (not busy)", () => {
    const ranges = consolidateBusyRanges([res("confirmed", "2026-09-21", "2026-09-24")], []);
    const byDate = Object.fromEntries(
      buildCalendar(ranges, "2026-09-20", "2026-09-27", "2026-09-01").map((d) => [d.date, d.state]),
    );
    expect(byDate["2026-09-24"]).toBe("checkout-only");
  });
});
