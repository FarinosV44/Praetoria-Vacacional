import Link from "next/link";
import { Picture } from "@/components/media/Picture";
import { heroPhoto } from "@/content/properties/photos";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { formatMoney } from "@/lib/format";
import { getRateConfig } from "@/content/rates";

/**
 * Shared chrome for a guide / hub page (issue #46): hero, table of contents,
 * quick facts, body, related cards, and a contextual (non-aggressive) CTA to the
 * property.
 */
export function GuideHero({
  propertySlug,
  eyebrow,
  title,
  lead,
  updated,
}: {
  propertySlug: string;
  eyebrow: string;
  title: string;
  lead: string;
  updated?: string;
}) {
  const photo = heroPhoto(propertySlug);
  return (
    <header className="relative isolate overflow-hidden bg-[var(--color-ink)] text-white">
      <div className="absolute inset-0">
        {photo && <Picture photo={photo} priority sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
      </div>
      <div className="container-page relative py-16 sm:py-24">
        <p className="eyebrow !text-white/75">{eyebrow}</p>
        <h1 className="mt-3 max-w-2xl display-2 text-white">{title}</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">{lead}</p>
        {updated && (
          <p className="mt-3 text-xs text-white/70">Actualizado: {updated}</p>
        )}
      </div>
    </header>
  );
}

export function QuickFacts({ facts }: { facts: { label: string; value: string }[] }) {
  if (facts.length === 0) return null;
  return (
    <section className="border-b border-[var(--color-line)] bg-white">
      <dl className="container-page grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="text-sm">
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">{f.label}</dt>
            <dd className="mt-0.5 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  if (items.length < 3) return null;
  return (
    <nav
      aria-label="Índice"
      className="pv-card !p-4 text-sm lg:sticky lg:top-24"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        En esta guía
      </p>
      <ol className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-[var(--color-ink-soft)] hover:text-[var(--accent-700)]">
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PropertyCta({
  propertySlug,
  heading,
}: {
  propertySlug: string;
  heading: string;
}) {
  const prop = getPropertyBySlug(propertySlug);
  if (!prop) return null;
  const rate = getRateConfig(propertySlug);
  const from = rate
    ? Math.min(rate.baseNightlyCents, ...rate.seasons.map((s) => s.nightlyCents))
    : null;
  return (
    <aside
      data-experience={prop.experience}
      className="pv-card pv-card--accent mt-10 overflow-hidden !p-0"
    >
      <div className="grid sm:grid-cols-[200px_1fr]">
        <div className="relative hidden aspect-[4/3] sm:block">
          {heroPhoto(propertySlug) && (
            <Picture photo={heroPhoto(propertySlug)!} sizes="200px" />
          )}
        </div>
        <div className="p-6">
          <p className="eyebrow">{heading}</p>
          <p className="mt-1 font-display text-lg">{prop.name}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{prop.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/${prop.slug}`} className="pv-btn pv-btn--primary pv-btn--sm">
              Ver alojamiento y fechas
            </Link>
            {from && (
              <span className="text-sm text-[var(--color-ink-soft)]">
                desde {formatMoney(from)} / noche
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function slugifyHeading(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
