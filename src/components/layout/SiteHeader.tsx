import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { Wordmark } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

/** Destination label shown instead of the old ☀/❄ emoji (#99). */
const WORLD = { sea: "Mar", ski: "Montaña" } as const;

export function SiteHeader() {
  // Sea first, mountain second — the same reading order as the home diptych.
  const properties = [...getAllProperties()].sort((a, b) =>
    a.experience === b.experience ? 0 : a.experience === "sea" ? -1 : 1,
  );
  const menuItems = [
    ...properties.map((p) => ({
      href: `/${p.slug}`,
      label: p.name,
      kicker: WORLD[p.experience],
    })),
    { href: "/guias", label: "Guías de destino" },
    { href: "/blog", label: "Blog" },
    { href: "/propietarios", label: "¿Tienes un apartamento?", kicker: "Propietarios" },
    { href: "/contacto", label: "Contacto" },
  ];

  const navLink =
    "relative py-2 text-[0.8125rem] font-medium tracking-[0.04em] text-[var(--color-ink)] after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100 motion-reduce:after:transition-none";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Praetoria Vacacional, inicio" className="min-w-0 text-[var(--color-ink)]">
          <Wordmark />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {properties.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              aria-label={`${WORLD[p.experience]}: ${p.name}`}
              className={navLink}
            >
              {WORLD[p.experience]}
            </Link>
          ))}
          <Link href="/guias" className={navLink}>
            Guías
          </Link>
          <Link href="/blog" className={navLink}>
            Blog
          </Link>
          <Link href="/propietarios" className={navLink}>
            Propietarios
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />
          <Link href="/#buscador" className="pv-btn pv-btn--ink pv-btn--sm hidden md:inline-flex">
            Consultar fechas
          </Link>
          <MobileMenu items={menuItems} />
        </div>
      </div>
    </header>
  );
}
