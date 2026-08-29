import type { IsoDate } from "@/lib/dates";
import type { AvailabilityBlock, Reservation } from "@/domains/booking/types";

/**
 * Plan the internal `external` reservation records for a channel's imported
 * availability blocks (issue #56 §8). Pure — the repository applies the plan.
 *
 * - a block with an externalUid and no matching reservation → create one
 * - a matching `external` reservation whose dates drifted → update
 * - an `external` reservation whose block vanished from the feed → cancel
 * A `confirmed`/`pending` reservation is NEVER touched (a direct booking that
 * happens to share an externalUid stays authoritative).
 */
export interface ExternalReservationPlan {
  toCreate: { startDate: IsoDate; endDate: IsoDate; externalUid: string; summary: string | null }[];
  toUpdate: { id: string; startDate: IsoDate; endDate: IsoDate }[];
  toCancel: { id: string; externalUid: string }[];
}

export function planExternalReservations(
  blocks: Pick<AvailabilityBlock, "startDate" | "endDate" | "externalUid" | "summary">[],
  reservations: Pick<Reservation, "id" | "status" | "externalUid" | "checkIn" | "checkOut">[],
): ExternalReservationPlan {
  const plan: ExternalReservationPlan = { toCreate: [], toUpdate: [], toCancel: [] };

  const resByUid = new Map(
    reservations.filter((r) => r.externalUid).map((r) => [r.externalUid as string, r]),
  );
  const feedUids = new Set<string>();

  for (const b of blocks) {
    if (!b.externalUid) continue;
    feedUids.add(b.externalUid);
    const r = resByUid.get(b.externalUid);
    if (!r) {
      plan.toCreate.push({
        startDate: b.startDate,
        endDate: b.endDate,
        externalUid: b.externalUid,
        summary: b.summary,
      });
    } else if (r.status === "external" && (r.checkIn !== b.startDate || r.checkOut !== b.endDate)) {
      plan.toUpdate.push({ id: r.id, startDate: b.startDate, endDate: b.endDate });
    }
  }

  for (const r of reservations) {
    if (r.status === "external" && r.externalUid && !feedUids.has(r.externalUid)) {
      plan.toCancel.push({ id: r.id, externalUid: r.externalUid });
    }
  }

  return plan;
}
