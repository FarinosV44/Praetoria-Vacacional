"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/mi-cuenta/tramites", label: "Resumen" },
  { href: "/mi-cuenta/tramites/viviendas", label: "Viviendas" },
  { href: "/mi-cuenta/tramites/reservas", label: "Reservas" },
  { href: "/mi-cuenta/tramites/documentos", label: "Documentos" },
  { href: "/mi-cuenta/tramites/pagos", label: "Pagos" },
  { href: "/mi-cuenta/tramites/mensajes", label: "Mensajes" },
  { href: "/mi-cuenta/tramites/datos", label: "Mis datos" },
];

export function OwnerNav({ unread }: { unread: number }) {
  const current = usePathname();
  return (
    <nav aria-label="Mi carpeta" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-[var(--color-line)] text-sm">
        {NAV.map((n) => {
          const active =
            n.href === "/mi-cuenta/tramites" ? current === n.href : current.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 ${active ? "border-[var(--color-ink)] font-semibold text-[var(--color-ink)]" : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}
              >
                {n.label}
                {n.label === "Mensajes" && unread > 0 && (
                  <span
                    className="rounded-full bg-[var(--color-ink)] px-1.5 text-[0.6875rem] font-semibold text-white"
                    aria-label={`${unread} sin leer`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
