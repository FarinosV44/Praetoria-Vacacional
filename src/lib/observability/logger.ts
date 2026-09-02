/**
 * Issue #66 — structured logging.
 *
 * One JSON object per line in production (so Hostinger / any log drain can parse
 * it), pretty single-line text in development. No PII helpers here — callers are
 * responsible for not passing guest emails/names into `fields`; see
 * `scrubFields` for the defensive pass we still apply.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw in LEVEL_WEIGHT) return LEVEL_WEIGHT[raw as LogLevel];
  return process.env.NODE_ENV === "production" ? LEVEL_WEIGHT.info : LEVEL_WEIGHT.debug;
}

/** Keys whose value is redacted wholesale — a last line of defence, not the plan. */
const SENSITIVE_KEY = /(email|phone|password|token|secret|authorization|cookie|card|iban|dni|nif|passport)/i;

export function scrubFields(fields: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = "[redacted]";
    } else if (v instanceof Error) {
      out[k] = { name: v.name, message: v.message };
    } else {
      out[k] = v;
    }
  }
  return out;
}

export interface LogRecord {
  level: LogLevel;
  msg: string;
  time: string;
  service: string;
  env: string;
  fields: Record<string, unknown>;
}

export function buildRecord(
  level: LogLevel,
  msg: string,
  fields?: Record<string, unknown>,
  now: Date = new Date(),
): LogRecord {
  return {
    level,
    msg,
    time: now.toISOString(),
    service: "praetoria-web",
    env: process.env.OBSERVABILITY_ENV || process.env.NODE_ENV || "development",
    fields: scrubFields(fields),
  };
}

export function formatRecord(rec: LogRecord): string {
  if (process.env.NODE_ENV === "production") return JSON.stringify(rec);
  const tail = Object.keys(rec.fields).length ? ` ${JSON.stringify(rec.fields)}` : "";
  return `${rec.time} ${rec.level.toUpperCase()} ${rec.msg}${tail}`;
}

function emit(level: LogLevel, msg: string, fields?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < threshold()) return;
  const line = formatRecord(buildRecord(level, msg, fields));
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const log = {
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};
