import type { Metadata } from "next";
import { publicEnv } from "./env";
import type { PropertyContent } from "@/domains/properties/types";

const SITE = publicEnv.siteName;
const BASE = publicEnv.siteUrl.replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  images?: string[];
  noindex?: boolean;
  locale?: "es" | "en";
}

export function pageMetadata(input: PageSeoInput): Metadata {
  const url = absoluteUrl(input.path);
  const images = (input.images ?? ["/images/og/default.svg"]).map((i) =>
    i.startsWith("http") ? i : absoluteUrl(i),
  );
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "website",
      siteName: SITE,
      title: input.title,
      description: input.description,
      url,
      locale: input.locale === "en" ? "en_GB" : "es_ES",
      images,
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images },
  };
}

/* --------------------------- JSON-LD builders --------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE,
    url: BASE,
    logo: absoluteUrl("/icon.svg"),
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE,
    url: BASE,
    inLanguage: "es-ES",
  };
}

/**
 * VacationRental (Google's lodging type) for a property page. Only emits fields
 * that are backed by real, owner-confirmed content — placeholder blocks are
 * omitted so structured data never contradicts the visible page (issue #26).
 */
export function propertyJsonLd(p: PropertyContent, opts: { ratingValue?: number; reviewCount?: number }) {
  const geoReady = p.location.status === "authored";
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: p.name,
    url: absoluteUrl(`/${p.slug}`),
    description: p.seo.metaDescription,
    image: p.gallery.map((g) => (g.src.startsWith("http") ? g.src : absoluteUrl(g.src))),
    numberOfRooms: p.capacity.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: p.capacity.guests },
    address: {
      "@type": "PostalAddress",
      addressLocality: p.location.city,
      addressRegion: p.location.region,
      addressCountry: p.location.country,
      ...(p.location.addressLine ? { streetAddress: p.location.addressLine } : {}),
      ...(p.location.postalCode ? { postalCode: p.location.postalCode } : {}),
    },
    ...(geoReady
      ? { geo: { "@type": "GeoCoordinates", latitude: p.location.geo.lat, longitude: p.location.geo.lng } }
      : {}),
    ...(opts.ratingValue && opts.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
            bestRating: 10,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}
