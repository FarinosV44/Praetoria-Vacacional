"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TITLES: [string, string][] = [
  ["/admin/calendario", "Calendario"],
  ["/admin/reservas/nuevo", "Nueva reserva"],
  ["/admin/reservas", "Reservas"],
  ["/admin/precios", "Precios y reglas"],
  ["/admin/alojamientos", "Alojamientos"],
  ["/admin/clientes", "Clientes"],
  ["/admin/facturas/ajustes", "Ajustes de facturación"],
  ["/admin/facturas", "Facturas"],
  ["/admin/promociones", "Promociones"],
  ["/admin/marketing", "Marketing"],
  ["/admin/sincronizacion", "Integraciones"],
  ["/admin/configuracion", "Configuración"],
  ["/admin/pagos", "Pagos y correos"],
  ["/admin/blog", "Blog"],
  ["/admin/contenido", "Contenido"],
  ["/admin/seo", "SEO"],
  ["/admin/actividad", "Actividad"],
  ["/admin", "Resumen"],
];

const QUICK: [string, string][] = [
  ["/admin/reservas/nuevo", "Nueva reserva"],
  ["/admin/calendario", "Bloquear o abrir fechas"],
  ["/admin/precios", "Cambiar precios"],
  ["/admin/promociones", "Crear promoción"],
  ["/admin/sincronizacion", "Sincronizar calendarios"],
];

export function AdminTopbar({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLES.find(([p]) => (p === "/admin" ? pathname === "/admin" : pathname.startsWith(p)))?.[1] ?? "Administración";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex flex-1 items-center gap-3">
      <p className="admin-h1 mr-auto hidden truncate sm:block" aria-hidden>
        {title}
      </p>
      <span className="mr-auto sm:hidden" />
      <Link href="/" target="_blank" className="admin-btn sm:hidden" data-variant="ghost" aria-label="Ver la web">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" />
        </svg>
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="admin-btn"
          data-variant="outline"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Acciones
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="admin-card absolute right-0 z-30 mt-1 w-60 overflow-hidden p-1"
          >
            {QUICK.map(([href, label]) => (
              <Link
                key={label}
                href={href}
                role="menuitem"
                className="block rounded-[var(--a-radius-sm)] px-3 py-2 text-sm hover:bg-[var(--a-surface-2)]"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/" target="_blank" className="admin-btn hidden sm:inline-flex" data-variant="ghost">
        Ver web
      </Link>

      {right}
    </div>
  );
}
