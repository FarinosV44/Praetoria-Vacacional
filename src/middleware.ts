import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware:
 *  - hard `noindex` header on private/technical paths (issues #14, #32)
 *  - gate for /admin (full auth check runs server-side in the layout; this is a
 *    cheap first line so unauthenticated users never see the shell)
 */
const NOINDEX_PREFIXES = ["/admin", "/reservar", "/reserva", "/api"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  if (NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

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

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/reservar/:path*", "/reserva/:path*", "/api/:path*"],
};
