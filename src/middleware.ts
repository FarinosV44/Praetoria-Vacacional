import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware:
 *  - hard `noindex` header on private/technical paths (issues #14, #32)
 *  - cheap first-line gate for /admin (full auth check is server-side in the
 *    (panel) layout).
 *
 * The Content-Security-Policy is set in `next.config.ts` headers() so that the
 * marketing pages stay statically generated (Core Web Vitals priority). It uses
 * `'unsafe-inline'` for scripts — required by the inline JSON-LD and Next's
 * hydration bootstrap — but keeps every other directive locked down
 * (object-src none, frame-ancestors none, base-uri self, allow-listed hosts).
 */
const NOINDEX_PREFIXES = ["/admin", "/reservar", "/reserva", "/api", "/mi-reserva"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession =
      req.cookies.has("pv_admin") ||
      req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  if (NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/reservar/:path*", "/reserva/:path*", "/api/:path*", "/mi-reserva/:path*"],
};
