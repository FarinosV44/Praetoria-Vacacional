import { buildSeoInventory, seoStats } from "@/domains/marketing/seo-inventory";
import { publicEnv } from "@/lib/env";

export const metadata = { title: "SEO" };

export default function AdminSeoPage() {
  const rows = buildSeoInventory();
  const stats = seoStats();
  const base = publicEnv.siteUrl.replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">SEO — inventario y control</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Vista de todas las URLs indexables con su title, meta e intención. Los textos viven en
        archivos de contenido (<code>src/content</code>) y se pueden iterar sin tocar la lógica de
        reservas. La evolución (impresiones, CTR, posición) se seguirá en Google Search Console una
        vez verificado el dominio (<code>NEXT_PUBLIC_GSC_VERIFICATION</code>).
      </p>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="URLs indexables" value={stats.indexableRoutes} />
        <Stat label="Landings publicadas" value={stats.publishedLandings} />
        <Stat label="Guías publicadas" value={stats.publishedGuides} />
        <Stat label="Borradores" value={stats.draftContent} />
        <Stat label="Sin meta" value={stats.missingMeta} warn={stats.missingMeta > 0} />
        <Stat label="Titles duplicados" value={stats.duplicateTitles} warn={stats.duplicateTitles > 0} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a className="text-[var(--accent-700)] underline" href={`${base}/sitemap.xml`} target="_blank">
          sitemap.xml
        </a>
        <a className="text-[var(--accent-700)] underline" href={`${base}/robots.txt`} target="_blank">
          robots.txt
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Sección</th>
              <th className="p-3">URL</th>
              <th className="p-3">Title</th>
              <th className="p-3">Meta description</th>
              <th className="p-3">Intención</th>
              <th className="p-3">Schema</th>
              <th className="p-3">hreflang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {rows.map((r) => (
              <tr key={r.path} className={r.section.includes("borrador") ? "opacity-60" : ""}>
                <td className="p-3 whitespace-nowrap">{r.section}</td>
                <td className="p-3 font-mono text-xs">{r.path}</td>
                <td className="p-3">
                  {r.title}
                  <span
                    className={`ml-1 text-xs ${r.title.length > 60 ? "text-amber-600" : "text-[var(--color-ink-soft)]"}`}
                  >
                    ({r.title.length})
                  </span>
                </td>
                <td className="p-3 text-[var(--color-ink-soft)]">
                  {r.description}
                  <span
                    className={`ml-1 text-xs ${r.description.length > 160 ? "text-amber-600" : ""}`}
                  >
                    ({r.description.length})
                  </span>
                </td>
                <td className="p-3 text-xs text-[var(--color-ink-soft)]">{r.intent}</td>
                <td className="p-3">{r.hasStructuredData ? "✓" : "—"}</td>
                <td className="p-3">{r.hasHreflang ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${warn ? "border-amber-300 bg-amber-50" : "border-[var(--color-line)] bg-white"}`}
    >
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
