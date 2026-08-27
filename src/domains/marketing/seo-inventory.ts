import { getAllProperties } from "@/domains/properties/registry";
import { publishedLandings, landings as allLandings } from "@/content/landings";
import { guides as allGuides, publishedGuides, hubForPropertySlug } from "@/content/guides";
import { guideHubs } from "@/content/guides/hubs";
import { legalDocs } from "@/content/legal";
import { seasonalPages } from "@/content/seasonal";
import { getIndexableRoutes } from "./navigation";

/**
 * A build-time snapshot of the indexable surface (issues #32, #33). Powers the
 * admin SEO view so titles / metas / intents can be reviewed and iterated
 * without touching booking logic.
 */
export interface SeoRow {
  path: string;
  section: string;
  title: string;
  description: string;
  intent: string;
  h1: string;
  hasStructuredData: boolean;
  hasHreflang: boolean;
}

export function buildSeoInventory(): SeoRow[] {
  const rows: SeoRow[] = [];

  for (const p of getAllProperties()) {
    rows.push({
      path: `/${p.slug}`,
      section: "propiedad",
      title: p.seo.metaTitle,
      description: p.seo.metaDescription,
      intent: "Transaccional — ficha de propiedad",
      h1: p.seo.h1,
      hasStructuredData: true,
      hasHreflang: true,
    });
    if (p.en) {
      rows.push({
        path: `/en/${p.slug}`,
        section: "propiedad (EN)",
        title: p.en.seo.metaTitle,
        description: p.en.seo.metaDescription,
        intent: "Transactional — property page",
        h1: p.en.seo.h1,
        hasStructuredData: true,
        hasHreflang: true,
      });
    }
  }

  for (const l of allLandings) {
    rows.push({
      path: `/${l.propertySlug}/${l.slug}`,
      section: l.published ? "landing" : "landing (borrador)",
      title: l.title,
      description: l.description,
      intent: `${l.intent} · kw: ${l.keyword}`,
      h1: l.h1,
      hasStructuredData: Boolean(l.faq && l.faq.length > 0),
      hasHreflang: false,
    });
  }

  for (const hub of guideHubs) {
    rows.push({
      path: `/guias/${hub.slug}`,
      section: "guía hub",
      title: hub.metaTitle,
      description: hub.metaDescription,
      intent: "Informacional amplio — hub de destino",
      h1: hub.h1,
      hasStructuredData: true,
      hasHreflang: false,
    });
  }

  for (const g of allGuides) {
    if (g.pillar) continue; // pillar intent lives on the hub page
    rows.push({
      path: `/guias/${hubForPropertySlug(g.propertySlug)}/${g.slug}`,
      section: g.published ? "guía" : "guía (borrador)",
      title: g.title,
      description: g.description,
      intent: `${g.intent} · kw: ${g.keyword}`,
      h1: g.h1,
      hasStructuredData: Boolean(g.faq && g.faq.length > 0),
      hasHreflang: false,
    });
  }

  for (const s of seasonalPages) {
    rows.push({
      path: `/ofertas/${s.slug}`,
      section: s.status === "published" ? "estacional" : "estacional (borrador)",
      title: s.title,
      description: s.description,
      intent: `SEO estacional · kw: ${s.keyword}`,
      h1: s.h1,
      hasStructuredData: Boolean(s.faq && s.faq.length > 0),
      hasHreflang: false,
    });
  }

  for (const d of Object.values(legalDocs)) {
    rows.push({
      path: `/legal/${d.slug}`,
      section: "legal",
      title: d.title,
      description: d.intro,
      intent: "Informacional legal",
      h1: d.title,
      hasStructuredData: false,
      hasHreflang: false,
    });
  }

  rows.push({
    path: "/",
    section: "home",
    title: "Praetoria Vacacional · Alojamientos de playa y montaña con reserva directa",
    description:
      "Reserva directa en dos alojamientos: Javalambre para la nieve y Valencia para la playa.",
    intent: "Marca + selección Playa/Nieve",
    h1: "La nieve de Javalambre y el mar de Valencia, en reserva directa.",
    hasStructuredData: true,
    hasHreflang: true,
  });

  return rows.sort((a, b) => a.section.localeCompare(b.section) || a.path.localeCompare(b.path));
}

export function seoStats() {
  const rows = buildSeoInventory();
  const routes = getIndexableRoutes();
  return {
    indexableRoutes: routes.length,
    publishedLandings: publishedLandings().length,
    publishedGuides: publishedGuides().length,
    draftContent: rows.filter((r) => r.section.includes("borrador")).length,
    missingMeta: rows.filter((r) => !r.title || !r.description).length,
    duplicateTitles: (() => {
      const seen = new Map<string, number>();
      for (const r of rows) seen.set(r.title, (seen.get(r.title) ?? 0) + 1);
      return [...seen.values()].filter((n) => n > 1).length;
    })(),
  };
}
