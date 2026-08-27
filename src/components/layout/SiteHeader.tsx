import Link from "next/link";
import { getAllProperties, experienceMeta } from "@/domains/properties/registry";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const properties = getAllProperties();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg tracking-tight text-[var(--color-ink)]"
        >
          <LogoMark className="h-7 w-7 text-[var(--accent-600)]" />
          Praetoria <span className="text-[var(--accent-600)]">Vacacional</span>
        </Link>

        <nav aria-label="Alojamientos" className="hidden items-center gap-1 md:flex">
          {properties.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              data-experience={p.experience}
              className="rounded-full px-3 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
            >
              {p.name.split(" ")[0]}{" "}
              <span className="text-[var(--color-ink-soft)]">· {experienceMeta[p.experience].label}</span>
            </Link>
          ))}
          <Link
            href="/guias"
            className="rounded-full px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--accent-700)]"
          >
            Guías
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ButtonLink href="/#buscador" size="md">
            Ver disponibilidad
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
