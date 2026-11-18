/**
 * Indexación de la landing de trámites y sus guías (#178): solo cuando haya
 * visto bueno legal y comercial. Hasta entonces las páginas existen y se
 * pueden revisar, pero llevan noindex y no salen en el sitemap.
 *
 *   TRAMITES_INDEXAR=on → indexables
 */
export const TRAMITES_PUBLIC_PREFIX = "/gestion-tramites-alquiler-turistico";

export function tramitesIndexable(): boolean {
  return process.env.TRAMITES_INDEXAR?.trim().toLowerCase() === "on";
}
