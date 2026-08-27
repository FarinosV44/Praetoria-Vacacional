import type { IsoDate } from "@/lib/dates";

/** The two experiences the brand contrasts. Drives theming site-wide. */
export type Experience = "ski" | "sea";

export type ContentStatus = "placeholder" | "authored";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PropertyImage {
  /** Path relative to the public bucket, or a /public path in DEMO mode. */
  src: string;
  /** Descriptive, natural ALT text — required. Never keyword-stuffed. */
  alt: string;
  width: number;
  height: number;
  /** Ordering hint; lower comes first. */
  order: number;
  /** Marks the LCP hero image — exactly one per property should be true. */
  hero?: boolean;
}

export interface Distance {
  label: string;
  km?: number;
  minutes?: number;
  mode?: "walk" | "car" | "transit";
}

export interface Amenity {
  /** Stable key for i18n / filtering. */
  key: string;
  label: string;
  icon?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Review {
  author: string;
  /** 0–10 to match Booking's scale; render normalised. */
  rating: number;
  text: string;
  date: IsoDate;
  /** Where the review legitimately comes from. Always shown to the guest. */
  source: "booking" | "airbnb" | "direct" | "google";
  locale?: string;
}

export interface CancellationTier {
  /** Days before check-in this tier starts applying. */
  daysBefore: number;
  /** Percentage of the total that is refunded (0–100). */
  refundPercent: number;
}

export interface CancellationPolicy {
  /** Short human summary shown near the CTA (issue #30). */
  summary: string;
  tiers: CancellationTier[];
  /** Configurable per property (issue #20). */
  status: ContentStatus;
}

export interface ContentSection {
  heading: string;
  /** Plain paragraphs; rendered as <p>. Markdown-lite links allowed by renderer. */
  body: string[];
}

export interface PropertySeo {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** og:image path, property-specific (issue #27). */
  ogImage: string;
}

export interface PropertyContent {
  /** Stable slug — used in URLs and as the DB `properties.slug`. */
  slug: string;
  /** Deterministic UUID so DEMO mode and seeded DB agree. */
  id: string;
  name: string;
  experience: Experience;
  /** Short tagline for cards. */
  tagline: string;
  /** One-liner of what kind of escape this is (issue #31 — concrete language). */
  shortIntro: string;

  location: {
    city: string;
    region: string;
    /** Neighbourhood / resort area. */
    area: string;
    /** Nullable until the owner confirms the exact address (issue #20/#26). */
    addressLine: string | null;
    postalCode: string | null;
    country: string;
    geo: GeoPoint;
    /** Whether geo/address are real or approximate placeholders. */
    status: ContentStatus;
  };

  capacity: {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
  };

  amenities: Amenity[];
  amenitiesStatus: ContentStatus;

  distances: Distance[];
  distancesStatus: ContentStatus;

  gallery: PropertyImage[];
  galleryStatus: ContentStatus;

  sections: ContentSection[];
  faq: FaqItem[];
  reviews: Review[];

  cancellationPolicy: CancellationPolicy;

  seo: PropertySeo;

  /** Booking.com (and other channels) iCal feed URLs to import. Placeholder-safe. */
  icalImportUrls: { channel: string; url: string }[];

  /** Currency is EUR across the platform; kept explicit for clarity. */
  currency: "EUR";

  /**
   * English overrides for the priority commercial fields (issue #29). Only the
   * fields provided are translated; anything absent falls back to Spanish and is
   * flagged so it is never presented as reviewed English copy. Deep sections and
   * FAQ are intentionally NOT machine-translated.
   */
  en?: {
    tagline: string;
    shortIntro: string;
    seo: PropertySeo;
    sections?: ContentSection[];
    faq?: FaqItem[];
    cancellationSummary?: string;
  };
}
