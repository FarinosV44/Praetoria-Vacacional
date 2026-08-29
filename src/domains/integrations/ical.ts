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

/** RFC 5545 §3.3.11 TEXT escaping for SUMMARY / DESCRIPTION values. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * RFC 5545 §3.1 content-line folding: no line may exceed 75 octets. A fold is a
 * CRLF followed by a single space; strict parsers (Booking.com's included)
 * reject long unfolded lines. Folds on octet boundaries in UTF-8.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  let first = true;
  while (start < bytes.length) {
    // 75 octets on the first line, 74 on continuations (leading space counts).
    const limit = first ? 75 : 74;
    let end = Math.min(start + limit, bytes.length);
    // don't split a multi-byte UTF-8 sequence
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
    out.push((first ? "" : " ") + bytes.toString("utf8", start, end));
    start = end;
    first = false;
  }
  return out.join("\r\n");
}

const KEEPALIVE_EVENT: IcsExportEvent = {
  uid: "keepalive",
  // A fixed all-day marker in the year 2000 — inert for every channel, but it
  // guarantees the feed is never empty. Booking.com rejects a VCALENDAR with no
  // VEVENT as "not a valid iCal URL".
  startDate: "2000-01-01",
  endDate: "2000-01-02",
  summary: "Praetoria Vacacional — feed activo",
};

export function generateIcs(
  calendarName: string,
  events: IcsExportEvent[],
  domain = "praetoria-vacacional.com",
): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const list = events.length > 0 ? events : [KEEPALIVE_EVENT];

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Praetoria Vacacional//Channel Sync//ES",
    "CALSCALE:GREGORIAN",
    // No METHOD — this is a published availability feed, not an iTIP message.
    // Booking.com's own exports omit it and some importers reject it.
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "X-WR-TIMEZONE:Europe/Madrid",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of list) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@${domain}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(e.startDate)}`,
      `DTEND;VALUE=DATE:${icsDate(e.endDate)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `STATUS:${e.status ?? "CONFIRMED"}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  // RFC 5545: CRLF line endings, every line folded to ≤75 octets, trailing CRLF.
  return lines.map(foldLine).join("\r\n") + "\r\n";
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
