import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/domains/admin/auth";
import { logoutAction } from "@/domains/admin/actions";
import { DEMO_MODE } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/pagos", label: "Pagos y emails" },
  { href: "/admin/calendario", label: "Calendario y bloqueos" },
  { href: "/admin/precios", label: "Precios y reglas" },
  { href: "/admin/sincronizacion", label: "Sincronización" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="container-page flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display">Praetoria · Admin</span>
            {DEMO_MODE && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                modo demo (sin base de datos)
              </span>
            )}
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--accent-700)]">
              Cerrar sesión
            </button>
          </form>
        </div>
        <nav className="container-page flex gap-1 overflow-x-auto pb-2 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
