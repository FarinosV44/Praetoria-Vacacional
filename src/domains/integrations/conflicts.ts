import { rangesOverlap, type IsoDate } from "@/lib/dates";
import type { AvailabilityBlock, Reservation } from "@/domains/booking/types";

/**
 * Issue #84 — cross-channel conflict detection.
 *
 * When a channel feed imports a block that overlaps a night we have ALREADY
 * sold directly (a `pending`/`confirmed` reservation that is not itself the
 * mirror of that block), the same night is sold twice. `syncExternalBlocks`
 * writes the block regardless — correct, the night IS taken — but the operator
 * must know so they can cancel one side. Pure; the caller reports it.
 */

export interface SyncConflict {
  externalUid: string | null;
  channelRange: { start: IsoDate; end: IsoDate };
  reservationId: string;
  reservationCode: string;
  reservationRange: { start: IsoDate; end: IsoDate };
  reservationStatus: Reservation["status"];
}

type ConflictBlock = Pick<AvailabilityBlock, "startDate" | "endDate" | "externalUid">;
type ConflictReservation = Pick<
  Reservation,
  "id" | "code" | "status" | "externalUid" | "checkIn" | "checkOut"
>;

const DIRECT_STATUSES: ReadonlySet<Reservation["status"]> = new Set(["pending", "confirmed"]);

export function detectChannelConflicts(
  feedBlocks: ConflictBlock[],
  reservations: ConflictReservation[],
): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  for (const block of feedBlocks) {
    for (const r of reservations) {
      if (!DIRECT_STATUSES.has(r.status)) continue;
      // The block's own mirror reservation is not a conflict.
      if (block.externalUid && r.externalUid && block.externalUid === r.externalUid) continue;
      if (!rangesOverlap(block.startDate, block.endDate, r.checkIn, r.checkOut)) continue;

      conflicts.push({
        externalUid: block.externalUid ?? null,
        channelRange: { start: block.startDate, end: block.endDate },
        reservationId: r.id,
        reservationCode: r.code,
        reservationRange: { start: r.checkIn, end: r.checkOut },
        reservationStatus: r.status,
      });
    }
  }

  return conflicts;
}
