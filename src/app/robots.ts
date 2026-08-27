import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { noindexPrefixes } from "@/domains/marketing/navigation";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: noindexPrefixes.map((p) => `${p}/`),
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
