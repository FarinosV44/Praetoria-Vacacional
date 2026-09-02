/**
 * Issue #66 — vendor integration without an SDK.
 *
 * Sentry is the chosen error sink but `@sentry/nextjs` pulls a large build-time
 * footprint. A DSN is all we need: this module parses it and builds the minimal
 * "envelope" payload the ingest endpoint accepts. Pure — the actual `fetch` is
 * in `report.ts`. If the DSN is absent everything here no-ops.
 *
 * Kept free of `node:*` imports so it bundles for the edge runtime too (the
 * Next `onRequestError` hook can run there).
 */

/** 32 hex chars. Event ids need to be unique, not cryptographically strong. */
function randomHex32(): string {
  let s = "";
  for (let i = 0; i < 32; i += 1) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

export interface SentryTarget {
  /** Full URL to POST the envelope to. */
  url: string;
  publicKey: string;
  projectId: string;
}

/** Parse `https://<key>@<host>/<path?>/<projectId>` → ingest target, or null. */
export function parseDsn(dsn: string | undefined | null): SentryTarget | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn.trim());
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean).pop() ?? "";
    if (!publicKey || !projectId) return null;
    const path = u.pathname.replace(/\/+$/, "");
    const base = path.slice(0, path.length - projectId.length).replace(/\/+$/, "");
    return {
      url: `${u.protocol}//${u.host}${base}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`,
      publicKey,
      projectId,
    };
  } catch {
    return null;
  }
}

export interface SentryEventInput {
  level: "fatal" | "error" | "warning" | "info";
  message: string;
  errorName?: string;
  stack?: string;
  environment: string;
  release?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  eventId?: string;
  now?: Date;
}

/** Build the 3-line envelope body (header / item-header / payload). */
export function buildEnvelope(input: SentryEventInput): string {
  const eventId = (input.eventId ?? randomHex32()).replace(/-/g, "");
  const sentAt = (input.now ?? new Date()).toISOString();

  const event: Record<string, unknown> = {
    event_id: eventId,
    timestamp: sentAt,
    platform: "node",
    level: input.level,
    environment: input.environment,
    logger: "praetoria-web",
    message: { formatted: input.message },
    tags: input.tags ?? {},
    extra: input.extra ?? {},
  };
  if (input.release) event.release = input.release;
  if (input.errorName || input.stack) {
    event.exception = {
      values: [
        {
          type: input.errorName || "Error",
          value: input.message,
          stacktrace: input.stack ? { frames: parseStack(input.stack) } : undefined,
        },
      ],
    };
  }

  const header = JSON.stringify({ event_id: eventId, sent_at: sentAt });
  const itemHeader = JSON.stringify({ type: "event" });
  return `${header}\n${itemHeader}\n${JSON.stringify(event)}\n`;
}

/** Very small stack parser — enough for Sentry to group and display. */
function parseStack(stack: string): { filename: string; function: string; lineno?: number }[] {
  return stack
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("at "))
    .slice(0, 30)
    .reverse()
    .map((l) => {
      const m = l.match(/^at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/) || l.match(/^at\s+(.+?):(\d+):(\d+)$/);
      if (!m) return { filename: "?", function: l.slice(3) };
      if (m.length === 5) return { filename: m[2]!, function: m[1]!, lineno: Number(m[3]) };
      return { filename: m[1]!, function: "?", lineno: Number(m[2]) };
    });
}
