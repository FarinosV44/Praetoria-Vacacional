import "server-only";
import { addDays, todayIso } from "@/lib/dates";
import { getRepository, type Repository } from "@/lib/repository";
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

/** The persisted import URL for a channel (channel_feeds), or the content-file
 *  default. Throws are surfaced by the caller as an error report. */
async function resolveImportUrl(
  repo: Repository,
  propertyId: string,
  channel: string,
  contentUrl: string,
): Promise<string> {
  const persisted = await repo.getImportFeedUrl(propertyId, channel);
  return (persisted || contentUrl || "").trim();
}

export interface ImportReport {
  property: string;
  channel: string;
  status: "ok" | "skipped" | "error";
  created: number;
  removed: number;
  kept: number;
  /** internal `external` reservation records created/cancelled from the feed */
  linkedCreated?: number;
  linkedCancelled?: number;
  error?: string;
}

async function importOne(slug: string): Promise<ImportReport[]> {
  const property = getPropertyBySlug(slug);
  if (!property) return [];
  const repo = getRepository();
  const reports: ImportReport[] = [];

  // Candidate channels: the two we support + whatever the content file / DB
  // mention. Channel discovery never depends on a DB read succeeding.
  const adminFeeds = await repo.listImportFeeds(property.id).catch(() => []);
  const channels = new Map<string, string>([
    ["booking", ""],
    ["airbnb", ""],
  ]);
  for (const f of property.icalImportUrls) channels.set(f.channel, f.url);
  for (const f of adminFeeds) channels.set(f.channel, f.url);

  for (const [channel, contentUrl] of channels) {
    const feed = { channel };

    // Admin-persisted URL (channel_feeds) wins over the content-file default.
    let url: string;
    try {
      url = await resolveImportUrl(repo, property.id, feed.channel, contentUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "error desconocido";
      reports.push({
        property: slug,
        channel: feed.channel,
        status: "error",
        created: 0,
        removed: 0,
        kept: 0,
        error: `No se pudo leer la URL guardada: ${message}`,
      });
      await repo
        .recordSyncRun(property.id, feed.channel, "import", {
          status: "error",
          error: `No se pudo leer la URL guardada: ${message}`,
        })
        .catch(() => undefined);
      continue;
    }

    if (!url) {
      // Nothing to sync for this channel and nothing to record — the "not
      // configured" state is derived from channel_feeds, not from a sync run.
      reports.push({ property: slug, channel: feed.channel, status: "skipped", created: 0, removed: 0, kept: 0 });
      continue;
    }
    try {
      const res = await fetch(url, { headers: { accept: "text/calendar" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const events = parseIcs(text);
      const result = await repo.syncExternalBlocks(property.id, feed.channel as never, events);
      // Mirror the imported blocks as internal `external` reservation records
      // so Booking/Airbnb bookings appear in Reservas and the calendar (§8).
      const linked = await repo
        .reconcileExternalReservations(property.id, feed.channel as never)
        .catch(() => ({ created: 0, updated: 0, cancelled: 0 }));
      reports.push({
        property: slug,
        channel: feed.channel,
        status: "ok",
        ...result,
        linkedCreated: linked.created,
        linkedCancelled: linked.cancelled,
      });
      await repo.recordSyncRun(property.id, feed.channel, "import", {
        status: "ok",
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
