import "server-only";
import { getRepository } from "@/lib/repository";
import { reportMessage } from "@/lib/observability/report";
import { reservationRetention } from "./retention";
import { DEFAULT_RETENTION, type RetentionPolicy } from "./types";

/**
 * Issue #79 — the monthly retention sweep. Idempotent: re-running finds nothing
 * left to do. Invoked by `/api/cron/privacy` and the admin "ejecutar ahora".
 */
export interface SweepResult {
  reservationsDeleted: number;
  reservationsAnonymized: number;
  messagesDeleted: number;
  auditRowsDeleted: number;
}

export async function runRetentionSweep(
  policy: RetentionPolicy = DEFAULT_RETENTION,
  now: Date = new Date(),
): Promise<SweepResult> {
  const repo = getRepository();
  const result: SweepResult = {
    reservationsDeleted: 0,
    reservationsAnonymized: 0,
    messagesDeleted: 0,
    auditRowsDeleted: 0,
  };

  const reservations = await repo
    .listReservations({ status: ["pending", "expired", "cancelled", "confirmed", "external"] })
    .catch(() => []);

  for (const r of reservations) {
    // Skip anything already anonymised.
    if (r.guestEmail === null && r.guestName === "[borrado a petición]") continue;
    const verdict = reservationRetention(r, now, policy);
    if (verdict.action === "delete") {
      await repo.deleteReservationHard(r.id).catch(() => undefined);
      result.reservationsDeleted += 1;
    } else if (verdict.action === "anonymize") {
      await repo.anonymizeReservationContact(r.id).catch(() => undefined);
      result.reservationsAnonymized += 1;
    }
  }

  const msgCutoff = new Date(now.getTime() - policy.scheduledMessageDays * 86_400_000).toISOString();
  result.messagesDeleted = await repo.deleteScheduledMessagesBefore(msgCutoff).catch(() => 0);

  const auditCutoff = new Date(now.getTime() - policy.auditLogDays * 86_400_000).toISOString();
  result.auditRowsDeleted = await repo.deleteAuditLogBefore(auditCutoff).catch(() => 0);

  if (result.reservationsDeleted || result.reservationsAnonymized) {
    reportMessage("retention sweep applied", "info", { scope: "privacy/sweep", extra: { ...result } });
  }
  return result;
}
