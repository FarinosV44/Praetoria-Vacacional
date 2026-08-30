import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { resolveProperty } from "@/domains/properties/content";
import { pageMetadata } from "@/lib/seo";
import { PropertyPageView } from "@/components/property/PropertyPageView";

// `dynamicParams = true` (issue #57): every known property is still prerendered
// via generateStaticParams, but a valid slug that a build somehow failed to
// include renders on demand instead of being baked as a permanent 404. Unknown
// slugs are still rejected by the getPropertyBySlug guard below.
export const dynamicParams = true;
// ISR: keep the page static but refresh availability-derived content hourly (#49).
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ property: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ property: string }>;
}): Promise<Metadata> {
  const { property } = await params;
  const p = await resolveProperty(property, "es");
  if (!p) return {};
  return pageMetadata({
    title: p.seo.metaTitle,
    description: p.seo.metaDescription,
    path: `/${p.slug}`,
    hreflangFor: `/${p.slug}`,
    images: [p.seo.ogImage],
  });
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ property: string }>;
}) {
  const { property } = await params;
  if (!getPropertyBySlug(property)) notFound();
  return <PropertyPageView slug={property} locale="es" />;
}
