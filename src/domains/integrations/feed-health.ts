/**
 * Issue #84 — stale-feed detection.
 *
 * A channel import feed can quietly rot: the URL still 200s but the last real
 * sync was days ago (cron wedged, token rotated at the channel, our job
 * throwing). `/admin/sincronizacion` shows `lastRunAt`, but nothing turned that
 * into a health verdict. Pure so it is unit-tested and identical on both repos.
 */

export type FeedHealth = "healthy" | "stale" | "failing" | "never";

export interface FeedRunFacts {
  /** ISO timestamp of the last sync attempt, or null if it never ran. */
  lastRunAt: string | null;
  /** "ok" | "error" | … as recorded on the sync run. */
  lastStatus: string | null;
  lastError: string | null;
}

export interface FeedHealthOptions {
  /** Hours after which a feed with no fresh successful run is "stale". */
  staleAfterHours?: number;
  now?: Date;
}

const DEFAULT_STALE_HOURS = 26; // a daily cron + margin

export function assessFeedHealth(
  facts: FeedRunFacts,
  options: FeedHealthOptions = {},
): { health: FeedHealth; ageHours: number | null; reason: string } {
  const staleAfter = options.staleAfterHours ?? DEFAULT_STALE_HOURS;
  const now = options.now ?? new Date();

  if (!facts.lastRunAt) {
    return { health: "never", ageHours: null, reason: "El feed nunca se ha sincronizado." };
  }

  const ranAt = Date.parse(facts.lastRunAt);
  const ageHours = Number.isNaN(ranAt) ? null : (now.getTime() - ranAt) / 3_600_000;

  if (facts.lastStatus === "error" || facts.lastError) {
    return {
      health: "failing",
      ageHours,
      reason: facts.lastError
        ? `Último intento con error: ${facts.lastError}`
        : "El último intento de sincronización falló.",
    };
  }

  if (ageHours !== null && ageHours > staleAfter) {
    return {
      health: "stale",
      ageHours,
      reason: `Sin sincronizar correctamente desde hace ${Math.round(ageHours)} h (límite ${staleAfter} h).`,
    };
  }

  return { health: "healthy", ageHours, reason: "Sincronización reciente y sin errores." };
}

/** True when the operator should be alerted (anything but healthy/never). */
export function feedNeedsAttention(health: FeedHealth): boolean {
  return health === "stale" || health === "failing";
}
