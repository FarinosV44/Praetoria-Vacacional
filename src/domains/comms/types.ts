/**
 * Issue #69 — guest communications lifecycle.
 *
 * Transactional messages tied to a reservation's timeline (NOT marketing — those
 * live in `src/domains/marketing` and are consent-gated). The confirmation and
 * payment-failed emails are sent immediately from the checkout flow (issue #12);
 * the messages here are *scheduled* relative to the stay.
 */

export type CommKind =
  | "pre_arrival" // a few days before check-in
  | "checkin_info" // check-in day, morning
  | "checkout_reminder" // the evening before check-out
  | "review_request"; // a day after check-out

export const COMM_KINDS: CommKind[] = [
  "pre_arrival",
  "checkin_info",
  "checkout_reminder",
  "review_request",
];

export const COMM_KIND_LABEL: Record<CommKind, string> = {
  pre_arrival: "Recordatorio pre-llegada",
  checkin_info: "Instrucciones de entrada",
  checkout_reminder: "Recordatorio de salida",
  review_request: "Agradecimiento y reseña",
};

export type ScheduledMessageStatus =
  | "planned" // waiting for its send_at
  | "queued" // due, handed to the sender
  | "sent"
  | "failed" // retries exhausted
  | "cancelled" // reservation cancelled / rule disabled / no longer applicable
  | "skipped"; // e.g. no guest email

export interface ScheduledMessage {
  id: string;
  reservationId: string;
  kind: CommKind;
  /** ISO — when the message becomes due. */
  sendAt: string;
  status: ScheduledMessageStatus;
  attempts: number;
  sentAt: string | null;
  lastError: string | null;
  /** Resend/telemetry: the provider id of the last send. */
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the pure planner produces; the repo upserts these by (reservationId, kind). */
export interface DesiredMessage {
  kind: CommKind;
  sendAt: string;
}

/** Per-property, per-kind rule. Offsets are in days relative to an anchor. */
export interface CommRule {
  kind: CommKind;
  enabled: boolean;
  /** which date the offset is measured from */
  anchor: "check_in" | "check_out";
  /** signed day offset from the anchor (e.g. -3 = three days before check-in) */
  offsetDays: number;
  /** local hour of day to send (0–23), Europe/Madrid */
  hour: number;
}

export const DEFAULT_COMM_RULES: CommRule[] = [
  { kind: "pre_arrival", enabled: true, anchor: "check_in", offsetDays: -3, hour: 10 },
  { kind: "checkin_info", enabled: true, anchor: "check_in", offsetDays: 0, hour: 9 },
  { kind: "checkout_reminder", enabled: true, anchor: "check_out", offsetDays: -1, hour: 18 },
  { kind: "review_request", enabled: true, anchor: "check_out", offsetDays: 1, hour: 11 },
];

export interface CommsFilter {
  status?: ScheduledMessageStatus[];
  kind?: CommKind;
  limit?: number;
}
