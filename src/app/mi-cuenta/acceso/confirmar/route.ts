import { NextResponse } from "next/server";
import { exchangeOwnerCode, verifyDemoToken } from "@/domains/tramites/auth";

export const dynamic = "force-dynamic";

/** Solo destinos internos de la carpeta (evita redirecciones abiertas). */
function safeNext(raw: string | null): string {
  return raw && /^\/mi-cuenta\/(tramites|acceso\/nueva-clave)(\/[\w\-/]*)?$/.test(raw) ? raw : "/mi-cuenta/tramites";
}

/**
 * Enlace de los correos de verificación y recuperación (#176).
 *  - Supabase: `?code=` (PKCE) → sesión en cookies.
 *  - Demo: `?token=` del almacén en memoria.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token");
  const ok = code ? await exchangeOwnerCode(code) : token ? await verifyDemoToken(token) : false;
  const target = ok ? next : "/mi-cuenta/acceso?error=enlace";
  // Redirección relativa: detrás del proxy o en el servidor standalone,
  // `req.url` puede traer el host interno (0.0.0.0) y la cookie se perdería.
  return new NextResponse(null, { status: 303, headers: { Location: target, "Cache-Control": "no-store" } });
}
