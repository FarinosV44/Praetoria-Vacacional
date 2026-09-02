"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Small inline icon set — 1rem, currentColor, no dependency. */
const I = {
  home: "M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5",
  calendar: "M4 7h16M4 7v13h16V7M4 7l1-3h14l1 3M9 3v4M15 3v4",
  bookings: "M5 4h14v16l-7-3-7 3V4Z",
  price: "M4 12h16M7 7h10M7 17h10",
  home2: "M6 20V10l6-5 6 5v10M9 20v-5h6v5",
  users: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a4 4 0 0 1 8 0M15 12a3 3 0 1 0 0-6M14 20a4 4 0 0 1 7-2.5",
  invoice: "M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3ZM9 8h6M9 12h6",
  tag: "M4 4h7l9 9-7 7-9-9V4Zm3.5 3.5h.01",
  megaphone: "M4 10v4l10 5V5L4 10Zm10-2 6-3v14l-6-3",
  plug: "M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0V9ZM12 18v3",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4 12h2M18 12h2M12 4v2M12 18v2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
} as const;

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

interface Item {
  href: string;
  label: string;
  icon: keyof typeof I;
  /** Extra path prefixes that should also light this item up. */
  match?: string[];
}

const PRIMARY: Item[] = [
  { href: "/admin", label: "Resumen", icon: "home" },
  { href: "/admin/calendario", label: "Calendario", icon: "calendar" },
  { href: "/admin/reservas", label: "Reservas", icon: "bookings" },
  { href: "/admin/precios", label: "Precios y reglas", icon: "price" },
  { href: "/admin/alojamientos", label: "Alojamientos", icon: "home2", match: ["/admin/contenido"] },
  { href: "/admin/clientes", label: "Clientes", icon: "users" },
  { href: "/admin/facturas", label: "Facturas", icon: "invoice" },
  { href: "/admin/promociones", label: "Promociones", icon: "tag" },
  { href: "/admin/marketing", label: "Marketing", icon: "megaphone" },
  { href: "/admin/sincronizacion", label: "Integraciones", icon: "plug" },
  { href: "/admin/configuracion", label: "Configuración", icon: "gear" },
];

const SECONDARY: Item[] = [
  { href: "/admin/analitica", label: "Analítica", icon: "price" },
  { href: "/admin/pagos", label: "Pagos y correos", icon: "invoice" },
  { href: "/admin/blog", label: "Blog", icon: "megaphone" },
  { href: "/admin/seo", label: "SEO", icon: "tag" },
  { href: "/admin/comunicaciones", label: "Comunicaciones", icon: "megaphone" },
  { href: "/admin/procesos", label: "Procesos", icon: "plug" },
  { href: "/admin/actividad", label: "Actividad", icon: "dots" },
];

function isActive(pathname: string, item: Item): boolean {
  const all = [item.href, ...(item.match ?? [])];
  return all.some((p) => (p === "/admin" ? pathname === "/admin" : pathname === p || pathname.startsWith(p + "/")));
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [pathname]);

  const list = (items: Item[]) =>
    items.map((it) => (
      <Link key={it.href} href={it.href} className="admin-navlink" aria-current={isActive(pathname, it) ? "page" : undefined}>
        <Icon d={I[it.icon]} />
        {it.label}
      </Link>
    ));

  return (
    <>
      <button
        type="button"
        className="admin-menu-btn admin-btn"
        data-variant="ghost"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menú
      </button>

      {open && <div className="admin-scrim" onClick={() => setOpen(false)} aria-hidden />}

      <aside className="admin-sidebar" data-open={open} aria-label="Navegación de administración">
        <Link href="/admin" className="mb-3 flex items-center gap-2 px-1.5 py-1">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--a-accent)] text-[13px] font-bold text-white">
            P
          </span>
          <span className="text-sm font-semibold">Praetoria</span>
        </Link>

        <nav className="admin-navgroup">{list(PRIMARY)}</nav>

        <div className="admin-navgroup">
          <p className="admin-navgroup-label">Más</p>
          {list(SECONDARY)}
        </div>
      </aside>
    </>
  );
}
