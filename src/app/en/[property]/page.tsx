import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { resolveProperty } from "@/domains/properties/content";
import { pageMetadata } from "@/lib/seo";
import { PropertyPageView } from "@/components/property/PropertyPageView";

export const dynamicParams = false;
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
  const p = await resolveProperty(property, "en");
  if (!p) return {};
  return pageMetadata({
    title: p.seo.metaTitle,
    description: p.seo.metaDescription,
    path: `/en/${p.slug}`,
    locale: "en",
    hreflangFor: `/${p.slug}`,
    images: [p.seo.ogImage],
  });
}

export default async function EnPropertyPage({
  params,
}: {
  params: Promise<{ property: string }>;
}) {
  const { property } = await params;
  if (!getPropertyBySlug(property)) notFound();
  return <PropertyPageView slug={property} locale="en" />;
}
