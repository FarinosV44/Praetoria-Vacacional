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

  it("uses CRLF line endings, starts with BEGIN:VCALENDAR, ends with END:VCALENDAR", () => {
    const ics = generateIcs("x", []);
    expect(ics).toContain("\r\n");
    expect(ics).not.toContain("\n\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/^﻿/); // no BOM
  });

  it("carries VERSION:2.0, a PRODID and every mandatory VEVENT property", () => {
    const ics = generateIcs("Javalambre", [
      { uid: "res-1", startDate: "2026-06-01", endDate: "2026-06-05", summary: "x" },
    ]);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toMatch(/PRODID:-\/\/.+\/\/.+/);
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toMatch(/UID:res-1@[\w.-]+/);
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601");
    expect(ics).toContain("DTEND;VALUE=DATE:20260605");
  });

  it("is NEVER empty — an events-free feed still has one VEVENT (Booking rejects empty)", () => {
    const ics = generateIcs("Valencia", []);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
    expect(ics).toContain("keepalive@");
  });

  it("folds every line to <= 75 octets (RFC 5545 §3.1)", () => {
    const longName = "Javalambre Mountain SuperSki — apartamento con vistas a la estación de esquí";
    const ics = generateIcs(longName, [
      {
        uid: "res-1",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        summary:
          "Reserva directa Praetoria Vacacional con un localizador razonablemente largo PV-ABCDEF12345",
      },
    ]);
    for (const line of ics.split("\r\n")) {
      // continuation lines start with a space; the folded segment itself is ≤ 75
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    // and it still parses back
    expect(parseIcs(ics)).toHaveLength(1);
  });

  it("escapes TEXT values (comma / semicolon / backslash / newline)", () => {
    const ics = generateIcs("Cal", [
      {
        uid: "b1",
        startDate: "2026-07-01",
        endDate: "2026-07-03",
        summary: "Bloqueo: obras, pintura; ala norte\\anexo\nsegunda línea",
      },
    ]);
    expect(ics).toContain("SUMMARY:Bloqueo: obras\\, pintura\\; ala norte\\\\anexo\\nsegunda línea");
    // round-trips (parseIcs unfolds; escaped text stays literal for our purposes)
    expect(parseIcs(ics)).toHaveLength(1);
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
