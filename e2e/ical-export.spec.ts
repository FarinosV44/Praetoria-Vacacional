import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * The public iCal export feeds must be importable by Booking.com / Airbnb, not
 * just downloadable in a browser. This asserts the HTTP + RFC-5545 contract
 * their validators check: 200 with no redirect, text/calendar, no
 * Content-Disposition, a non-empty VCALENDAR with CRLF and every mandatory
 * property. Requires ICAL_EXPORT_TOKEN (see .env.local / playwright.config.ts).
 */

const TOKEN = process.env.ICAL_EXPORT_TOKEN ?? "";

async function fetchFeed(request: APIRequestContext, path: string) {
  return request.get(path, { maxRedirects: 0 });
}

test.describe("iCal export feed — Booking.com compatibility", () => {
  test.skip(!TOKEN, "needs ICAL_EXPORT_TOKEN (.env.local)");

  for (const slug of ["javalambre", "valencia"] as const) {
    test(`clean tokenized path serves a valid feed: /api/ical/${slug}/<token>.ics`, async ({
      request,
    }) => {
      const res = await fetchFeed(request, `/api/ical/${slug}/${TOKEN}.ics`);

      // 200, directly, no redirect
      expect(res.status(), "HTTP 200 with no redirect").toBe(200);

      const headers = res.headers();
      expect(headers["content-type"]).toMatch(/^text\/calendar\s*;\s*charset=utf-8/i);
      // an "attachment" makes validators treat it as a file download
      expect(headers["content-disposition"]).toBeUndefined();

      const body = await res.text();

      expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
      expect(body.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
      expect(body).not.toMatch(/^﻿/); // no BOM
      expect(body).toContain("\r\n"); // CRLF

      // mandatory calendar + event properties
      expect(body).toContain("VERSION:2.0");
      expect(body).toMatch(/PRODID:-\/\/.+\/\/.+/);
      expect(body).toContain("BEGIN:VEVENT");
      expect(body).toMatch(/UID:.+@[\w.-]+/);
      expect(body).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
      expect(body).toMatch(/DTSTART;VALUE=DATE:\d{8}/);
      expect(body).toMatch(/DTEND;VALUE=DATE:\d{8}/);
      expect(body).toContain("END:VEVENT");

      // never empty — at least one VEVENT even with no bookings yet
      expect((body.match(/BEGIN:VEVENT/g) ?? []).length).toBeGreaterThanOrEqual(1);

      // no unfolded line over 75 octets
      for (const line of body.split("\r\n")) {
        expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
      }
    });
  }

  test("legacy query-string path still works", async ({ request }) => {
    const res = await fetchFeed(request, `/api/ical/javalambre.ics?token=${TOKEN}`);
    expect(res.status()).toBe(200);
    expect((await res.text()).startsWith("BEGIN:VCALENDAR")).toBe(true);
  });

  test("a wrong token is 403, an unknown property is 404", async ({ request }) => {
    expect((await fetchFeed(request, `/api/ical/javalambre/wrong-token.ics`)).status()).toBe(403);
    expect((await fetchFeed(request, `/api/ical/nope/${TOKEN}.ics`)).status()).toBe(404);
  });
});
