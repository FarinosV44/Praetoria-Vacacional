import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { clientIp, denyClient, isDenied, rateLimit, recordBreach } from "./rate-limit";
import { timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { reportMessage } from "./observability/report";

/** Consistent JSON error shape. Never leaks internals (issue #21). */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * The single service-to-service auth policy (issue #64) for cron / internal
 * endpoints. The caller must present `Authorization: Bearer <CRON_SECRET>`.
 *
 * Vercel Cron sends exactly this header automatically when `CRON_SECRET` is set
 * on the project, so the same check covers scheduled and manual invocations.
 * The `x-vercel-cron` header alone is NEVER trusted (it can be forged on a
 * direct request). In DEMO/dev with no `CRON_SECRET` set, calls from Vercel
 * Cron are allowed through so local testing works; a real deployment must set
 * the secret (enforced by the fail-closed check, issue #63).
 *
 * Returns an error response to send back, or `null` when the request is authorised.
 */
export function requireServiceAuth(req: Request): NextResponse | null {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (env.CRON_SECRET) {
    return bearer && safeEqual(bearer, env.CRON_SECRET) ? null : apiError("No autorizado", 401);
  }

  // No secret configured — only allow the platform scheduler, and only when not
  // in strict production.
  if (env.NODE_ENV !== "production" && req.headers.get("x-vercel-cron") === "1") return null;
  return apiError(
    "Endpoint no configurado: define CRON_SECRET para las tareas programadas.",
    503,
  );
}

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: apiError("Cuerpo JSON no válido") };
  }
  try {
    return { ok: true, data: schema.parse(body) };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        ok: false,
        response: apiError("Datos no válidos", 422, { fields: err.flatten().fieldErrors }),
      };
    }
    return { ok: false, response: apiError("Datos no válidos", 422) };
  }
}

/** Repeat rate-limit breaches inside this window escalate to a temp denylist. */
const ABUSE_BREACHES = 25;
const ABUSE_WINDOW_MS = 5 * 60_000;
const DENY_TTL_MS = 15 * 60_000;

/**
 * Per-IP fixed-window rate limit (issue #21, #62). Distributed when Redis is
 * configured, in-memory otherwise. A client that keeps hammering past the limit
 * is denylisted for {@link DENY_TTL_MS}. Returns a 429 response to send back, or
 * `null` when the request may proceed.
 */
export async function enforceRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = clientIp(req);

  if (ip !== "unknown" && (await isDenied(ip))) {
    return tooMany("Acceso temporalmente bloqueado por actividad anómala.", DENY_TTL_MS / 1000);
  }

  const res = await rateLimit(`${name}:${ip}`, limit, windowMs);
  if (res.ok) return null;

  if (ip !== "unknown" && (await recordBreach(ip, ABUSE_BREACHES, ABUSE_WINDOW_MS))) {
    await denyClient(ip, DENY_TTL_MS);
    reportMessage("client denylisted for repeated rate-limit breaches", "warning", {
      scope: "rate-limit",
      extra: { route: name },
    });
    return tooMany("Acceso temporalmente bloqueado por actividad anómala.", DENY_TTL_MS / 1000);
  }

  return tooMany(
    "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.",
    Math.max(1, Math.ceil((res.resetAt - Date.now()) / 1000)),
  );
}

function tooMany(message: string, retryAfterSeconds: number): NextResponse {
  const res = apiError(message, 429);
  res.headers.set("Retry-After", String(Math.ceil(retryAfterSeconds)));
  return res;
}
