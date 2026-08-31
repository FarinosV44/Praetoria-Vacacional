import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export function SiteHeader() {
  const properties = getAllProperties();
  const menuItems = [
    ...properties.map((p) => ({
      href: `/${p.slug}`,
      label: p.name,
      icon: p.experience === "ski" ? "❄" : "☀",
    })),
    { href: "/guias", label: "Guías", icon: "🧭" },
    { href: "/blog", label: "Blog", icon: "📰" },
    { href: "/contacto", label: "Contacto", icon: "✉" },
  ];

  const navLink =
    "rounded-full px-3 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-display text-base tracking-tight text-[var(--color-ink)]"
        >
          <LogoMark className="h-6 w-6 shrink-0 text-[var(--accent-600)]" />
          <span className="truncate">
            Praetoria&nbsp;<span className="text-[var(--accent-600)]">Vacacional</span>
          </span>
        </Link>

        <nav aria-label="Alojamientos" className="hidden items-center gap-0.5 md:flex">
          {properties.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              data-experience={p.experience}
              className={`inline-flex items-center gap-1.5 ${navLink}`}
            >
              <span aria-hidden>{p.experience === "ski" ? "❄" : "☀"}</span>
              {p.name.split(" ")[0]}
            </Link>
          ))}
          <Link href="/guias" className={navLink}>
            Guías
          </Link>
          <Link href="/blog" className={navLink}>
            Blog
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ButtonLink href="/#buscador" size="sm" className="hidden md:inline-flex">
            Ver disponibilidad
          </ButtonLink>
          <MobileMenu items={menuItems} />
        </div>
      </div>
    </header>
  );
}
