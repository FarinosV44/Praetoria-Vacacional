import Link from "next/link";

const TABS = [
  { key: "bandeja", href: "/admin/tramites", label: "Bandeja" },
  { key: "solicitudes", href: "/admin/tramites/solicitudes", label: "Prealtas" },
  { key: "tarifas", href: "/admin/tramites/tarifas", label: "Tarifas" },
  { key: "actividad", href: "/admin/tramites/actividad", label: "Auditoría" },
] as const;

export function TramitesTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Secciones de trámites" className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className="admin-btn"
          data-variant={t.key === current ? "primary" : "outline"}
          aria-current={t.key === current ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
