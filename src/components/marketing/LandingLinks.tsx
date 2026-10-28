import Link from "next/link";
import { landingLinksFor } from "@/domains/marketing/navigation";

/**
 * "Alojamiento en la zona" — contextual links from blog posts and guides to the
 * transactional landing pages of one property (SEO: DinoRANK's internal
 * PageRank showed those landings as the weakest URLs on the site, below even
 * the legal pages, while they target the money keywords).
 */
export function LandingLinks({
  propertySlug,
  heading = "Alojamiento en la zona",
  className = "",
}: {
  propertySlug: string;
  heading?: string;
  className?: string;
}) {
  const links = landingLinksFor(propertySlug);
  if (links.length === 0) return null;
  return (
    <nav aria-label={heading} className={className}>
      <h2 className="font-display text-xl">{heading}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.path}>
            <Link
              href={l.path}
              className="inline-block rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--accent-600)] hover:text-[var(--accent-700)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
