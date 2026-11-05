import { company } from "@/content/company";
import { guideHubs } from "@/content/guides/hubs";
import { publishedLandings } from "@/content/landings";
import { getAllProperties } from "@/domains/properties/registry";
import { absoluteUrl } from "@/lib/seo";
import { noindexPrefixes } from "./navigation";

/**
 * Plain-text views of the site for crawlers and AI agents. Everything comes from
 * the same content files as the pages, so these views cannot drift from them or
 * claim anything the site does not.
 */

/**
 * How the content may be used (contentsignals.org). Appear in search and let
 * assistants cite the site when answering, but do not train models on it.
 */
export const contentSignal = "search=yes, ai-input=yes, ai-train=no";

const SUMMARY =
  "Dos apartamentos con reserva directa: frente al mar en la playa de la Llastra, al sur de Valencia, y junto a las pistas de Javalambre, en Camarena de la Sierra (Teruel).";

const link = (label: string, path: string, note?: string) =>
  `- [${label}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

export function robotsTxt(): string {
  return [
    "User-Agent: *",
    `Content-Signal: ${contentSignal}`,
    "Allow: /",
    ...noindexPrefixes.map((p) => `Disallow: ${p}/`),
    "",
    `Host: ${absoluteUrl("/")}`,
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}

export function llmsTxt(): string {
  const properties = getAllProperties();
  return [
    `# ${company.tradeName}`,
    "",
    `> ${SUMMARY}`,
    "",
    `Sitio en español, con las páginas principales también en inglés. Lo gestiona ${company.legalName} Los precios y la disponibilidad cambian: consúltalos siempre en la web.`,
    "",
    "## Alojamientos",
    "",
    ...properties.map((p) => link(p.name, `/${p.slug}`, p.tagline)),
    "",
    "## Dónde alojarse",
    "",
    ...publishedLandings().map((l) => link(l.h1, `/${l.propertySlug}/${l.slug}`, l.description)),
    "",
    "## Guías de destino",
    "",
    ...guideHubs.map((h) => link(h.title, `/guias/${h.slug}`, h.metaDescription)),
    "",
    "## Información",
    "",
    link("Sobre nosotros", "/sobre-nosotros", "quién gestiona los alojamientos y cómo trabajamos"),
    link("Ventajas de reservar directo", "/ventajas-reserva-directa"),
    link("Contacto", "/contacto"),
    link("Aviso legal", "/legal/aviso-legal"),
    link("Condiciones de reserva", "/legal/condiciones-reserva"),
    link("Política de privacidad", "/legal/privacidad"),
    "",
    "## Optional",
    "",
    link("Blog", "/blog"),
    link("English version", "/en"),
    ...properties.map((p) => link(`${p.name} (English)`, `/en/${p.slug}`)),
    "",
  ].join("\n");
}

export function homeMarkdown(): string {
  return [
    `# ${company.tradeName}`,
    "",
    SUMMARY,
    "",
    ...getAllProperties().flatMap((p) => [
      `## [${p.name}](${absoluteUrl(`/${p.slug}`)})`,
      "",
      p.shortIntro,
      "",
      `- Hasta ${p.capacity.guests} personas, ${p.capacity.bedrooms} dormitorios y ${p.capacity.bathrooms} ${p.capacity.bathrooms === 1 ? "baño" : "baños"}.`,
      `- ${p.headlineDistance.label}: ${p.headlineDistance.value}.`,
      "",
    ]),
    "## Reservar",
    "",
    "La reserva se hace directamente en la web, en la página de cada alojamiento, donde se consultan las fechas libres y el precio total.",
    "",
    "## Más información",
    "",
    link("Sobre nosotros", "/sobre-nosotros"),
    link("Ventajas de reservar directo", "/ventajas-reserva-directa"),
    link("Guías de destino", "/guias"),
    link("Contacto", "/contacto", `${company.email}, ${company.phone}`),
    link("Aviso legal", "/legal/aviso-legal"),
    "",
  ].join("\n");
}
