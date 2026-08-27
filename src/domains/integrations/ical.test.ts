import { describe, expect, it } from "vitest";
import { generateIcs, parseIcs, nightsToExportEvent } from "./ical";

const sample = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking.com//Calendar//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260310
DTEND;VALUE=DATE:20260314
UID:booking-abc123
SUMMARY:CLOSED - Not available
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260401
DTEND;VALUE=DATE:20260405
UID:booking-def456
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

describe("parseIcs", () => {
  it("extracts all-day VEVENTs as half-open ranges", () => {
    const events = parseIcs(sample);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      uid: "booking-abc123",
      startDate: "2026-03-10",
      endDate: "2026-03-14",
    });
  });

  it("handles folded lines", () => {
    const folded =
      "BEGIN:VEVENT\r\nUID:x1\r\nSUMMARY:A very long summary that has been\r\n  folded across lines\r\nDTSTART;VALUE=DATE:20260501\r\nDTEND;VALUE=DATE:20260503\r\nEND:VEVENT";
    const events = parseIcs(folded);
    expect(events[0]?.summary).toBe("A very long summary that has been folded across lines");
  });

  it("drops events with DTEND <= DTSTART", () => {
    const bad = "BEGIN:VEVENT\nUID:bad\nDTSTART;VALUE=DATE:20260510\nDTEND;VALUE=DATE:20260510\nEND:VEVENT";
    expect(parseIcs(bad)).toHaveLength(0);
  });

  it("is idempotent — re-parsing the same feed yields the same uids", () => {
    const a = parseIcs(sample).map((e) => e.uid);
    const b = parseIcs(sample).map((e) => e.uid);
    expect(a).toEqual(b);
  });
});

describe("generateIcs", () => {
  it("round-trips through parseIcs", () => {
    const ics = generateIcs("Javalambre", [
      { uid: "res-1", startDate: "2026-06-01", endDate: "2026-06-05", summary: "Reserva directa PV-ABC123" },
    ]);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601");
    const parsed = parseIcs(ics);
    expect(parsed[0]).toMatchObject({ startDate: "2026-06-01", endDate: "2026-06-05" });
  });

  it("uses CRLF line endings", () => {
    expect(generateIcs("x", [])).toContain("\r\n");
  });
});

describe("nightsToExportEvent", () => {
  it("keeps checkout exclusive", () => {
    expect(nightsToExportEvent("u", "2026-07-10", "2026-07-13", "s")).toMatchObject({
      startDate: "2026-07-10",
      endDate: "2026-07-13",
    });
  });
});
