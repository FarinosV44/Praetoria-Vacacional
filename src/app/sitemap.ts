import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getIndexableRoutes } from "@/domains/marketing/navigation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return (await getIndexableRoutes()).map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changefreq,
    priority: route.priority,
  }));
}
