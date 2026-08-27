import "server-only";
import { addDays, todayIso } from "@/lib/dates";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { generateIcs, parseIcs, type IcsExportEvent } from "./ical";

/**
 * Channel calendar sync (issue #9). Each property is independent: its import
 * feed only ever writes `availability_blocks` for that property_id, and its
 * export feed only ever lists that property's direct reservations + manual
 * blocks.
 */

/** Build the .ics a channel (Booking) subscribes to for one property. */
export async function buildExportFeed(slug: string): Promise<string | null> {
  const property = getPropertyBySlug(slug);
  if (!property) return null;
  const repo = getRepository();
  const from = todayIso();
  const to = addDays(from, 540);

  const [reservations, blocks] = await Promise.all([
    repo.listReservations({ propertyId: property.id, status: ["confirmed", "pending"], from, to }),
    repo.listBlocks(property.id),
  ]);

  const events: IcsExportEvent[] = [
    ...reservations.map((r) => ({
      uid: `res-${r.id}`,
      startDate: r.checkIn,
      endDate: r.checkOut,
      summary: `Praetoria Vacacional ${r.code}`,
      status: (r.status === "confirmed" ? "CONFIRMED" : "TENTATIVE") as "CONFIRMED" | "TENTATIVE",
    })),
    ...blocks
      .filter((b) => b.source === "manual")
      .map((b) => ({
        uid: `block-${b.id}`,
        startDate: b.startDate,
        endDate: b.endDate,
        summary: b.summary ?? "No disponible",
      })),
  ];

  await repo.recordSyncRun(property.id, "praetoria", "export", {
    status: "ok",
    eventsImported: events.length,
  });

  return generateIcs(`${property.name} · Praetoria Vacacional`, events);
}

export interface ImportReport {
  property: string;
  channel: string;
  status: "ok" | "skipped" | "error";
  created: number;
  removed: number;
  kept: number;
  error?: string;
}

async function importOne(slug: string): Promise<ImportReport[]> {
  const property = getPropertyBySlug(slug);
  if (!property) return [];
  const repo = getRepository();
  const reports: ImportReport[] = [];

  for (const feed of property.icalImportUrls) {
    if (!feed.url) {
      reports.push({ property: slug, channel: feed.channel, status: "skipped", created: 0, removed: 0, kept: 0 });
      await repo.recordSyncRun(property.id, feed.channel, "import", {
        status: "skipped: sin URL de feed",
        feedUrl: null,
      });
      continue;
    }
    try {
      const res = await fetch(feed.url, { headers: { accept: "text/calendar" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const events = parseIcs(text);
      const result = await repo.syncExternalBlocks(property.id, feed.channel as never, events);
      reports.push({ property: slug, channel: feed.channel, status: "ok", ...result });
      await repo.recordSyncRun(property.id, feed.channel, "import", {
        status: "ok",
        feedUrl: feed.url,
        eventsImported: result.created + result.kept,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "error desconocido";
      reports.push({
        property: slug,
        channel: feed.channel,
        status: "error",
        created: 0,
        removed: 0,
        kept: 0,
        error: message,
      });
      await repo.recordSyncRun(property.id, feed.channel, "import", {
        status: "error",
        error: message,
        feedUrl: feed.url,
      });
    }
  }
  return reports;
}

export async function importAllFeeds(): Promise<ImportReport[]> {
  const all = await Promise.all(getAllProperties().map((p) => importOne(p.slug)));
  return all.flat();
}

export async function importPropertyFeeds(slug: string): Promise<ImportReport[]> {
  return importOne(slug);
}
