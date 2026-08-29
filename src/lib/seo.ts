import type { Metadata } from "next";
import { publicEnv } from "./env";
import type { PropertyContent } from "@/domains/properties/types";
import { defaultLocale, locales, localizedPath, type Locale } from "@/i18n/config";
import { propertyPhotos } from "@/content/properties/photos";
import { company } from "@/content/company";

const SITE = publicEnv.siteName;
const BASE = publicEnv.siteUrl.replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageSeoInput {
  title: string;
  description: string;
  /** Path in the CURRENT locale, e.g. "/javalambre" or "/en/javalambre". */
  path: string;
  images?: string[];
  noindex?: boolean;
  locale?: Locale;
  /**
   * Locale-neutral path ("/javalambre") for hreflang. When set, the page emits
   * bidirectional <link rel="alternate" hreflang> for every locale + x-default.
   */
  hreflangFor?: string;
}

export function pageMetadata(input: PageSeoInput): Metadata {
  const locale = input.locale ?? defaultLocale;
  const url = absoluteUrl(input.path);
  const images = (input.images ?? ["/images/og/default.svg"]).map((i) =>
    i.startsWith("http") ? i : absoluteUrl(i),
  );

  const languages = input.hreflangFor
    ? {
        ...Object.fromEntries(
          locales.map((l) => [l, absoluteUrl(localizedPath(l, input.hreflangFor!))]),
        ),
        "x-default": absoluteUrl(localizedPath(defaultLocale, input.hreflangFor)),
      }
    : undefined;

  return {
    // Full title — callers pass the complete string, so bypass the layout template.
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url, languages },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "website",
      siteName: SITE,
      title: input.title,
      description: input.description,
      url,
      locale: locale === "en" ? "en_GB" : "es_ES",
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
    legalName: company.legalName,
    url: BASE,
    logo: absoluteUrl("/icon.svg"),
    email: company.email,
    telephone: company.phone,
    taxID: company.taxId,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.registeredOffice.street,
      postalCode: company.registeredOffice.postalCode,
      addressLocality: company.registeredOffice.city,
      addressRegion: company.registeredOffice.province,
      addressCountry: company.registeredOffice.countryCode,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: company.phone,
      email: company.email,
      availableLanguage: ["es", "en"],
    },
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
  const rating = opts.ratingValue ?? p.rating?.value;
  const reviewCount = opts.reviewCount ?? p.rating?.count;
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: p.name,
    url: absoluteUrl(`/${p.slug}`),
    description: p.seo.metaDescription,
    image: propertyPhotos(p.slug).map((g) => absoluteUrl(g.src)),
    numberOfRooms: p.capacity.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: p.capacity.guests },
    floorSize: p.capacity.sizeSqm
      ? { "@type": "QuantitativeValue", value: p.capacity.sizeSqm, unitCode: "MTK" }
      : undefined,
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
    ...(rating && reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount,
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
