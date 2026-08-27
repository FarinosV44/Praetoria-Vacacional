import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { clientIp, rateLimit } from "./rate-limit";

/** Consistent JSON error shape. Never leaks internals (issue #21). */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
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

export function enforceRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const res = rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
  if (!res.ok) {
    return apiError("Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.", 429);
  }
  return null;
}
