import { getAllProperties } from "@/domains/properties/registry";
import { publishedLandings } from "@/content/landings";

/**
 * The single source of truth for indexable URLs (issues #14, #28, #32).
 * Sitemap, breadcrumbs and internal-link blocks all read this. Nothing that is
 * not listed here should be indexable; nothing listed here should be orphaned.
 */

export interface SiteRoute {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
  section: "home" | "destino" | "propiedad" | "landing" | "guia" | "info" | "legal";
}

const staticInfoRoutes: SiteRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1, section: "home" },
  { path: "/ventajas-reserva-directa", changefreq: "monthly", priority: 0.6, section: "info" },
  { path: "/guias", changefreq: "weekly", priority: 0.5, section: "guia" },
  { path: "/contacto", changefreq: "monthly", priority: 0.4, section: "info" },
];

const legalRoutes: SiteRoute[] = [
  "/legal/aviso-legal",
  "/legal/privacidad",
  "/legal/cookies",
  "/legal/condiciones-reserva",
].map((path) => ({ path, changefreq: "monthly" as const, priority: 0.3, section: "legal" as const }));

export function getIndexableRoutes(): SiteRoute[] {
  const routes: SiteRoute[] = [...staticInfoRoutes];

  for (const property of getAllProperties()) {
    routes.push({
      path: `/${property.slug}`,
      changefreq: "weekly",
      priority: 0.9,
      section: "propiedad",
    });
  }

  for (const landing of publishedLandings()) {
    routes.push({
      path: `/${landing.propertySlug}/${landing.slug}`,
      changefreq: "monthly",
      priority: 0.75,
      section: "landing",
    });
  }

  routes.push(...legalRoutes);
  return routes;
}

/** Routes that must never be indexed (issues #14, #32). */
export const noindexPrefixes = ["/admin", "/api", "/reservar", "/reserva", "/checkout"];

/** Landings for a property, for internal-link blocks on the property page. */
export function landingLinksFor(propertySlug: string): { path: string; label: string }[] {
  return publishedLandings()
    .filter((l) => l.propertySlug === propertySlug)
    .map((l) => ({ path: `/${l.propertySlug}/${l.slug}`, label: l.h1 }));
}
