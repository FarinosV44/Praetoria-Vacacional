/**
 * Issue #79 — privacy lifecycle (GDPR operational).
 *
 * Two halves:
 *   - retention: pure verdicts on what to keep / anonymise / delete over time,
 *     run by a monthly sweep.
 *   - data-subject rights: assemble everything held about an email (access /
 *     portability) and plan an erasure that respects legal holds (an active
 *     booking, an invoice still inside the Spanish fiscal retention window).
 */

export type RecordAction = "keep" | "anonymize" | "delete";

export interface RetentionVerdict {
  action: RecordAction;
  reason: string;
}

export interface RetentionPolicy {
  /** Hard-delete abandoned pending/expired holds this many days after they lapsed. */
  abandonedHoldDays: number;
  /** Anonymise guest contact on a cancelled direct reservation after this long. */
  cancelledReservationDays: number;
  /** Anonymise guest contact on a completed stay this many years after check-out
   *  (kept long for accounting; contact data isn't needed after). */
  completedStayContactYears: number;
  /** Delete finished lifecycle messages (sent/failed/cancelled) after this long. */
  scheduledMessageDays: number;
  /** Trim the admin audit log after this long. */
  auditLogDays: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  abandonedHoldDays: 7,
  cancelledReservationDays: 365,
  completedStayContactYears: 6,
  scheduledMessageDays: 180,
  auditLogDays: 365 * 3,
};

/** Spain: mercantile + tax records must be kept ~6 years (art. 30 CdC; art. 66 LGT ~4y). */
export const FISCAL_RETENTION_YEARS = 6;

export type SubjectRecordType =
  | "customer"
  | "reservation"
  | "invoice"
  | "scheduled_message"
  | "coupon_redemption";

export interface ErasureItem {
  type: SubjectRecordType;
  id: string;
  label: string;
  action: RecordAction;
  reason: string;
}

export interface ErasurePlan {
  email: string;
  items: ErasureItem[];
  /** Human-readable reasons some data cannot be deleted yet. */
  blockedReasons: string[];
  canFullyErase: boolean;
}
