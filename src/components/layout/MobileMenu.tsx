"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  label: string;
  /** Small tracked label above the item ("Mar", "Montaña"). */
  kicker?: string;
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
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center text-[var(--color-ink)]"
      >
        <span aria-hidden className="relative block h-3 w-6">
          <span
            className={`absolute inset-x-0 h-[1.5px] bg-current transition-transform motion-reduce:transition-none ${open ? "top-1/2 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute inset-x-0 h-[1.5px] bg-current transition-transform motion-reduce:transition-none ${open ? "top-1/2 -rotate-45" : "bottom-0"}`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-40 bg-black/30"
          />
          <div
            id="mobile-menu-panel"
            className="fixed inset-x-0 top-16 z-50 border-b border-[var(--color-line)] bg-[var(--color-paper)] px-5 pb-6 pt-2"
          >
            <nav aria-label="Menú móvil" className="flex flex-col">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex flex-col border-b border-[var(--color-line)] py-4 text-lg font-semibold tracking-[-0.01em] text-[var(--color-ink)]"
                >
                  {it.kicker && (
                    <span className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      {it.kicker}
                    </span>
                  )}
                  {it.label}
                </Link>
              ))}
            </nav>
            <Link href="/#buscador" className="pv-btn pv-btn--ink pv-btn--block mt-5">
              Consultar fechas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
