import "server-only";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import type { CalendarSyncRow } from "@/domains/booking/types";
import { envImportUrl } from "./feed-config";

export type FeedState = "configured" | "not_configured" | "error";

export interface ChannelFeedStatus {
  channel: "booking" | "airbnb";
  label: string;
  url: string | null;
  /** True when a value exists but only in the legacy content file, not the DB. */
  fromContentFileOnly: boolean;
  /** True when the effective URL comes from an env var (survives redeploys). */
  fromEnv: boolean;
  state: FeedState;
  readError: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  eventsImported: number;
}

export interface PropertyFeedStatus {
  slug: string;
  name: string;
  id: string;
  channels: ChannelFeedStatus[];
}

const CHANNELS: { channel: "booking" | "airbnb"; label: string }[] = [
  { channel: "booking", label: "Booking.com" },
  { channel: "airbnb", label: "Airbnb" },
];

/**
 * The per-property, per-channel iCal import status for `/admin/sincronizacion`.
 * The feed URL comes from the DB (`channel_feeds`); the run telemetry comes from
 * `calendar_syncs`. A failed DB read is reported as `error`, never hidden.
 */
export async function getImportFeedStatus(): Promise<PropertyFeedStatus[]> {
  const repo = getRepository();
  const properties = getAllProperties();

  let syncRows: CalendarSyncRow[] = [];
  try {
    syncRows = await repo.getSyncRows();
  } catch {
    syncRows = [];
  }

  return Promise.all(
    properties.map(async (p) => {
      const contentUrls = new Map(p.icalImportUrls.map((f) => [f.channel, (f.url ?? "").trim()]));

      const channels = await Promise.all(
        CHANNELS.map(async ({ channel, label }): Promise<ChannelFeedStatus> => {
          let url: string | null = null;
          let readError: string | null = null;
          try {
            url = await repo.getImportFeedUrl(p.id, channel);
          } catch (err) {
            readError = err instanceof Error ? err.message : "error de lectura";
          }

          const contentUrl = contentUrls.get(channel) || "";
          const envUrl = envImportUrl(p.slug, channel);
          const effective = url ?? envUrl ?? (contentUrl || null);
          const fromEnv = !url && !readError && !!envUrl;
          const fromContentFileOnly = !url && !readError && !envUrl && !!contentUrl;

          const run =
            syncRows.find(
              (r) => r.propertyId === p.id && r.channel === channel && r.direction === "import",
            ) ?? null;

          let state: FeedState;
          if (readError) state = "error";
          else if (effective) state = run?.lastError ? "error" : "configured";
          else state = "not_configured";

          return {
            channel,
            label,
            url: effective,
            fromContentFileOnly,
            fromEnv,
            state,
            readError,
            lastRunAt: run?.lastRunAt ?? null,
            lastStatus: run?.lastStatus ?? null,
            lastError: run?.lastError ?? null,
            eventsImported: run?.eventsImported ?? 0,
          };
        }),
      );

      return { slug: p.slug, name: p.name, id: p.id, channels };
    }),
  );
}
