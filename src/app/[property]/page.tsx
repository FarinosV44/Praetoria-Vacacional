import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { pageMetadata } from "@/lib/seo";
import { PropertyPageView } from "@/components/property/PropertyPageView";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ property: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ property: string }>;
}): Promise<Metadata> {
  const { property } = await params;
  const p = getPropertyBySlug(property);
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
