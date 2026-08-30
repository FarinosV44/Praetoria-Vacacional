"use client";

import { usePathname } from "next/navigation";
import { BookingBar } from "@/components/booking/BookingBar";

/**
 * Renders the public site header / footer around the page — except under
 * `/admin`, which is a self-contained tool with its own shell (issue #60).
 * The server-rendered header/footer are passed in as props so this stays a
 * thin client gate and the children keep streaming from the server.
 */
export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const bare = pathname.startsWith("/admin");
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";

  if (bare) return <>{children}</>;

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Saltar al contenido
      </a>
      {header}
      <main id="contenido">{children}</main>
      {footer}
      <BookingBar locale={locale} />
    </>
  );
}
