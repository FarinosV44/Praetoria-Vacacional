import "server-only";
import { log } from "./logger";
import { buildEnvelope, parseDsn, type SentryEventInput } from "./sentry";

/**
 * Issue #66 — the one place errors and notable events are reported.
 *
 * Always logs (structured). Additionally forwards to Sentry when `SENTRY_DSN`
 * is set. Reporting must never throw and never block the request path — the
 * network call is fire-and-forget with a short timeout.
 */

const DSN = process.env.SENTRY_DSN;
const RELEASE = process.env.OBSERVABILITY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || undefined;
const ENVIRONMENT = process.env.OBSERVABILITY_ENV || process.env.NODE_ENV || "development";

export interface ReportContext {
  /** e.g. "api/checkout", "cron/comms", "webhook/stripe" */
  scope?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function observabilityConfigured(): boolean {
  return !!parseDsn(DSN);
}

async function sendToSentry(input: SentryEventInput): Promise<void> {
  const target = parseDsn(DSN);
  if (!target) return;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    await fetch(target.url, {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope" },
      body: buildEnvelope(input),
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
  } catch {
    // A monitoring outage must not surface to the user or the caller.
  }
}

export function reportError(error: unknown, context: ReportContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));
  log.error(err.message, {
    scope: context.scope,
    errorName: err.name,
    ...context.extra,
  });
  void sendToSentry({
    level: "error",
    message: err.message,
    errorName: err.name,
    stack: err.stack,
    environment: ENVIRONMENT,
    release: RELEASE,
    tags: { ...(context.scope ? { scope: context.scope } : {}), ...context.tags },
    extra: context.extra,
  });
}

export function reportMessage(
  message: string,
  level: "warning" | "info" = "info",
  context: ReportContext = {},
): void {
  (level === "warning" ? log.warn : log.info)(message, { scope: context.scope, ...context.extra });
  void sendToSentry({
    level,
    message,
    environment: ENVIRONMENT,
    release: RELEASE,
    tags: { ...(context.scope ? { scope: context.scope } : {}), ...context.tags },
    extra: context.extra,
  });
}
