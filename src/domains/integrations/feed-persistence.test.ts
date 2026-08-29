import { describe, expect, it } from "vitest";
import { memoryRepository as repo } from "@/lib/repository/memory";
import { getAllProperties } from "@/domains/properties/registry";

/**
 * Regression: the Booking/Airbnb iCal import URL must be stored as configuration
 * and must NEVER be clobbered by a sync run (recordSyncRun). The old code kept
 * the URL in calendar_syncs.feed_url — the same row recordSyncRun upserts — so
 * every "not configured" sync wiped it and the admin fields went blank on
 * refresh.
 */

const [javalambre, valencia] = getAllProperties();

describe("import feed URL persistence (bugfix)", () => {
  it("stores and reads back the URL per property + channel, independently", async () => {
    const jav = "https://ical.booking.com/v1/export?t=JAV-TOKEN";
    const vlc = "https://ical.booking.com/v1/export?t=VLC-TOKEN";

    await repo.setImportFeedUrl(javalambre!.id, "booking", jav);
    await repo.setImportFeedUrl(valencia!.id, "booking", vlc);

    expect(await repo.getImportFeedUrl(javalambre!.id, "booking")).toBe(jav);
    expect(await repo.getImportFeedUrl(valencia!.id, "booking")).toBe(vlc);
    // Airbnb of the same property is untouched.
    expect(await repo.getImportFeedUrl(javalambre!.id, "airbnb")).toBeNull();
  });

  it("recordSyncRun does NOT change the stored feed URL", async () => {
    const url = "https://ical.booking.com/v1/export?t=KEEP-ME";
    await repo.setImportFeedUrl(javalambre!.id, "booking", url);

    // A run that reports "not configured" — the exact case that used to wipe it.
    await repo.recordSyncRun(javalambre!.id, "booking", "import", {
      status: "Aún no configurado",
    });
    // An error run.
    await repo.recordSyncRun(javalambre!.id, "booking", "import", {
      status: "error",
      error: "HTTP 403",
    });
    // A successful run.
    await repo.recordSyncRun(javalambre!.id, "booking", "import", {
      status: "ok",
      eventsImported: 5,
    });

    expect(await repo.getImportFeedUrl(javalambre!.id, "booking")).toBe(url);

    const rows = await repo.getSyncRows(javalambre!.id);
    const importRow = rows.find((r) => r.channel === "booking" && r.direction === "import");
    expect(importRow?.lastStatus).toBe("ok");
    expect(importRow?.eventsImported).toBe(5);
  });

  it("clearing the URL removes it and does not affect other channels", async () => {
    await repo.setImportFeedUrl(valencia!.id, "booking", "https://ical.booking.com/v1/export?t=X");
    await repo.setImportFeedUrl(valencia!.id, "airbnb", "https://www.airbnb.com/calendar/ical/y.ics");

    await repo.setImportFeedUrl(valencia!.id, "booking", null);

    expect(await repo.getImportFeedUrl(valencia!.id, "booking")).toBeNull();
    expect(await repo.getImportFeedUrl(valencia!.id, "airbnb")).toBe(
      "https://www.airbnb.com/calendar/ical/y.ics",
    );
  });

  it("listImportFeeds returns only channels with a stored URL for that property", async () => {
    await repo.setImportFeedUrl(javalambre!.id, "booking", "https://ical.booking.com/v1/export?t=L");
    await repo.setImportFeedUrl(javalambre!.id, "airbnb", null);
    const feeds = await repo.listImportFeeds(javalambre!.id);
    expect(feeds).toContainEqual({ channel: "booking", url: "https://ical.booking.com/v1/export?t=L" });
    expect(feeds.some((f) => f.channel === "airbnb")).toBe(false);
  });
});
