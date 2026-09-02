import type { Metadata } from "next";
import Link from "next/link";
import { guideHubsWithEn } from "@/content/guides/hubs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Destination guides",
    description: "Practical guides to the destinations of Praetoria Vacacional: the Javalambre mountains and the southern Valencia coast.",
    path: "/en/guias",
  }),
  robots: { index: false, follow: true },
};

export default function EnGuidesIndex() {
  const hubs = guideHubsWithEn();
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="display-2">Destination guides</h1>
      <p className="lede mt-3">
        Draft English translations — pending review. The full set of guides is available{" "}
        <Link href="/guias" className="underline">
          in Spanish
        </Link>
        .
      </p>
      <ul className="mt-8 space-y-3">
        {hubs.map((h) => (
          <li key={h.slug}>
            <Link
              href={`/en/guias/${h.slug}`}
              className="pv-card pv-card--interactive block !p-4"
            >
              <span className="font-medium">{h.en!.h1}</span>
              <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                {h.en!.metaDescription}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
