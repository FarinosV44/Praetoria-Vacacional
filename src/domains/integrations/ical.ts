import { addDays, isIsoDate, type IsoDate } from "@/lib/dates";
import type { ExternalEvent } from "@/lib/repository/types";

/**
 * Minimal iCalendar (RFC 5545) support for channel sync (issue #9).
 * We only need VEVENTs with DTSTART/DTEND as all-day dates (Booking exports this
 * way for blocked stays). Times, RRULEs and timezones are out of scope for V1.
 */

function unfold(text: string): string[] {
  // RFC 5545 line folding: a CRLF followed by space/tab continues the previous line.
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseDate(value: string): IsoDate | null {
  // "20260315" or "2026-03-15" or "20260315T120000Z"
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return isIsoDate(iso) ? iso : null;
}

export function parseIcs(text: string): ExternalEvent[] {
  const lines = unfold(text);
  const events: ExternalEvent[] = [];
  let cur: Partial<ExternalEvent> & { _dtend?: IsoDate; _dateOnly?: boolean } = {};
  let inEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur.uid && cur.startDate && cur._dtend) {
        // DTEND for an all-day VEVENT is already exclusive (half-open) per RFC.
        events.push({
          uid: cur.uid,
          startDate: cur.startDate,
          endDate: cur._dtend,
          summary: cur.summary ?? null,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = rawKey.split(";")[0]!.toUpperCase();

    if (key === "UID") cur.uid = value;
    else if (key === "SUMMARY") cur.summary = value || null;
    else if (key === "DTSTART") {
      const d = parseDate(value);
      if (d) cur.startDate = d;
    } else if (key === "DTEND") {
      const d = parseDate(value);
      if (d) cur._dtend = d;
    }
  }

  // Guard against a feed that gives DTEND <= DTSTART.
  return events
    .filter((e) => e.endDate > e.startDate)
    .map((e) => ({ ...e, summary: e.summary ?? "Reserva externa" }));
}

export interface IcsExportEvent {
  uid: string;
  startDate: IsoDate;
  /** Exclusive checkout day. */
  endDate: IsoDate;
  summary: string;
  status?: "CONFIRMED" | "TENTATIVE";
}

function icsDate(iso: IsoDate): string {
  return iso.replace(/-/g, "");
}

export function generateIcs(calendarName: string, events: IcsExportEvent[], domain = "praetoriavacacional"): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Praetoria Vacacional//${calendarName}//ES`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@${domain}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(e.startDate)}`,
      `DTEND;VALUE=DATE:${icsDate(e.endDate)}`,
      `SUMMARY:${e.summary}`,
      `STATUS:${e.status ?? "CONFIRMED"}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  // RFC 5545 wants CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}

/** Pad a single blocked NIGHT range to a valid VEVENT (checkout exclusive). */
export function nightsToExportEvent(
  uid: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  summary: string,
): IcsExportEvent {
  return {
    uid,
    startDate: checkIn,
    endDate: checkOut > checkIn ? checkOut : addDays(checkIn, 1),
    summary,
  };
}
