import { afterEach, describe, expect, it } from "vitest";
import { envImportUrl } from "./feed-config";

const KEYS = [
  "ICAL_IMPORT_VALENCIA_BOOKING",
  "ICAL_IMPORT_JAVALAMBRE_AIRBNB",
  "ICAL_IMPORT_VALENCIA_FRENTE_AL_MAR_BOOKING",
];
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

describe("envImportUrl", () => {
  it("reads ICAL_IMPORT_<SLUG>_<CHANNEL>", () => {
    process.env.ICAL_IMPORT_VALENCIA_BOOKING = "https://ical.booking.com/v1/export?t=abc";
    expect(envImportUrl("valencia", "booking")).toBe("https://ical.booking.com/v1/export?t=abc");
  });

  it("is case-insensitive on the channel and slug", () => {
    process.env.ICAL_IMPORT_JAVALAMBRE_AIRBNB = "https://airbnb.com/calendar/ical/x.ics";
    expect(envImportUrl("javalambre", "AIRBNB")).toBe("https://airbnb.com/calendar/ical/x.ics");
  });

  it("folds non-alphanumerics in the slug to underscores", () => {
    process.env.ICAL_IMPORT_VALENCIA_FRENTE_AL_MAR_BOOKING = "https://example.com/f.ics";
    expect(envImportUrl("valencia-frente-al-mar", "booking")).toBe("https://example.com/f.ics");
  });

  it("returns null when unset or not an http(s) URL", () => {
    expect(envImportUrl("valencia", "booking")).toBeNull();
    process.env.ICAL_IMPORT_VALENCIA_BOOKING = "not-a-url";
    expect(envImportUrl("valencia", "booking")).toBeNull();
  });
});
