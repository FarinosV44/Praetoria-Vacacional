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
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-[var(--accent-50)]"
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
            className="fixed inset-0 top-16 z-40 bg-black/25 backdrop-blur-[2px]"
          />
          <div
            id="mobile-menu-panel"
            className="fixed inset-x-0 top-16 z-50 border-b border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-lg)]"
          >
            <nav aria-label="Menú móvil" className="flex flex-col">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-[var(--color-ink)] transition-colors hover:bg-[var(--accent-50)]"
                >
                  {it.icon && (
                    <span aria-hidden className="text-[var(--color-ink-faint)]">
                      {it.icon}
                    </span>
                  )}
                  {it.label}
                </Link>
              ))}
            </nav>
            <Link href="/#buscador" className="pv-btn pv-btn--primary pv-btn--block mt-3">
              Ver disponibilidad
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
