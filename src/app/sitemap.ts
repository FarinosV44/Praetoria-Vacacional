import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getIndexableRoutes } from "@/domains/marketing/navigation";
import { TRAMITES_PUBLIC_PREFIX, tramitesIndexable } from "@/domains/tramites/launch";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = (await getIndexableRoutes()).filter(
    (r) =>
      tramitesIndexable() ||
      (r.path !== TRAMITES_PUBLIC_PREFIX && !r.path.startsWith(`${TRAMITES_PUBLIC_PREFIX}/`)),
  );
  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changefreq,
    priority: route.priority,
  }));
}
