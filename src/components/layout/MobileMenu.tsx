"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  label: string;
  icon?: string;
}

/** Compact mobile navigation (issue #52): a single clean panel, big touch targets. */
export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] text-[var(--color-ink)]"
      >
        <span aria-hidden className="text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-40 bg-black/20"
          />
          <div
            id="mobile-menu-panel"
            className="fixed inset-x-0 top-14 z-50 border-b border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-lg"
          >
            <nav aria-label="Menú móvil" className="flex flex-col">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-[var(--color-ink)] hover:bg-[var(--accent-50)]"
                >
                  {it.icon && <span aria-hidden>{it.icon}</span>}
                  {it.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/#buscador"
              className="mt-3 flex h-12 items-center justify-center rounded-full bg-[var(--accent-600)] font-medium text-[var(--accent-contrast,#fff)]"
            >
              Ver disponibilidad
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
