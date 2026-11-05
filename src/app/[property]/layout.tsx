import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/domains/properties/registry";

/**
 * Rejects unknown slugs here, above `loading.tsx`. That file wraps the page in a
 * Suspense boundary, so by the time the page calls `notFound()` the response has
 * already started streaming with status 200 (a soft 404).
 */
export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ property: string }>;
}) {
  const { property } = await params;
  if (!getPropertyBySlug(property)) notFound();
  return children;
}
