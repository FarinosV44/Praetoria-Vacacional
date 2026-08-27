import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getIndexableRoutes } from "@/domains/marketing/navigation";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return getIndexableRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changefreq,
    priority: route.priority,
  }));
}
