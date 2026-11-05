import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/domains/properties/registry";

/** Rejects unknown slugs above `loading.tsx`, so they get a real 404 status. */
export default async function ReservarLayout({
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
