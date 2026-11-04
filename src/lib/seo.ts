import type { Metadata } from "next";
import { publicEnv } from "./env";
import type { PropertyContent } from "@/domains/properties/types";
import { defaultLocale, locales, localizedPath, type Locale } from "@/i18n/config";
import { propertyPhotos } from "@/content/properties/photos";
import { company } from "@/content/company";
import { getAllProperties } from "@/domains/properties/registry";
import { instagramUrl } from "./social";

const SITE = publicEnv.siteName;
const BASE = publicEnv.siteUrl.replace(/\/$/, "");

/**
 * Tab and search-result icons. Bump the `v` query when the artwork changes:
 * browsers cache favicons apart from everything else and ignore normal
 * revalidation, so a new URL is what makes them load the new one.
 */
const ICON_VERSION = "v=2";
export const faviconLinks = [
  { url: `/favicon.ico?${ICON_VERSION}`, sizes: "16x16 32x32 48x48" },
  { url: `/favicon.svg?${ICON_VERSION}`, type: "image/svg+xml" },
  { url: `/icon-192.png?${ICON_VERSION}`, sizes: "192x192", type: "image/png" },
];
export const appleTouchIcon = `/apple-touch-icon.png?${ICON_VERSION}`;
export const siteManifest = `/site.webmanifest?${ICON_VERSION}`;

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
  const images = (input.images ?? ["/images/og/default.jpg"]).map((i) =>
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
    logo: absoluteUrl("/logo.png"),
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
    sameAs: getAllProperties()
      .map((p) => p.instagram)
      .filter((h): h is string => Boolean(h))
      .map(instagramUrl),
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
/** "De 15:00 a 20:00" → "15:00" (first clock time in a free-text range). */
function firstTime(text: string): string | undefined {
  return text.match(/\b\d{1,2}:\d{2}\b/)?.[0]?.padStart(5, "0");
}
/** "De 8:00 a 11:00" → "11:00" (last clock time; the check-out deadline). */
function lastTime(text: string): string | undefined {
  const all = text.match(/\b\d{1,2}:\d{2}\b/g);
  return all?.[all.length - 1]?.padStart(5, "0");
}

export function propertyJsonLd(p: PropertyContent, opts: { ratingValue?: number; reviewCount?: number }) {
  const geoReady = p.location.status === "authored";
  const rating = opts.ratingValue ?? p.rating?.value;
  const reviewCount = opts.reviewCount ?? p.rating?.count;
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: p.name,
    url: absoluteUrl(`/${p.slug}`),
    ...(p.instagram ? { sameAs: [instagramUrl(p.instagram)] } : {}),
    description: p.seo.metaDescription,
    image: propertyPhotos(p.slug).map((g) => absoluteUrl(g.src)),
    // Google's vacation-rental rich result requires `identifier` and `containsPlace`.
    identifier: `praetoria-vacacional-${p.slug}`,
    additionalType: "Apartment",
    brand: { "@type": "Brand", name: SITE },
    knowsLanguage: ["es", "en"],
    ...(firstTime(p.stayInfo.checkIn) ? { checkinTime: firstTime(p.stayInfo.checkIn) } : {}),
    ...(lastTime(p.stayInfo.checkOut) ? { checkoutTime: lastTime(p.stayInfo.checkOut) } : {}),
    containsPlace: {
      "@type": "Accommodation",
      additionalType: "EntirePlace",
      numberOfBedrooms: p.capacity.bedrooms,
      numberOfBathroomsTotal: p.capacity.bathrooms,
      occupancy: { "@type": "QuantitativeValue", value: p.capacity.guests },
      ...(p.capacity.sizeSqm
        ? { floorSize: { "@type": "QuantitativeValue", value: p.capacity.sizeSqm, unitCode: "MTK" } }
        : {}),
    },
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

export function articleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  author?: string;
}) {
  const image = input.image
    ? [input.image.startsWith("http") ? input.image : absoluteUrl(input.image)]
    : [absoluteUrl("/images/og/default.jpg")];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@type": "Organization", name: input.author || SITE },
    publisher: {
      "@type": "Organization",
      name: SITE,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
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
