import Link from "next/link";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { getRateConfig } from "@/content/rates";
import { QuickRates } from "@/components/admin/mobile/QuickRates";

export const metadata = { title: "Precios rápidos" };
export const dynamic = "force-dynamic";

export default async function QuickPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ alojamiento?: string }>;
}) {
  const sp = await searchParams;
  const properties = getAllProperties();
  const property = getPropertyBySlug(sp.alojamiento ?? "") ?? properties[0]!;
  const effective = (await resolveRateConfig(property.slug)) ?? getRateConfig(property.slug)!;
  // The quick editor never touches per-date overrides; don't ship them to the client.
  const config = { ...effective };
  delete config.dayRates;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1>Precios rápidos</h1>
        <Link href="/admin/movil" className="text-sm underline">
          Volver
        </Link>
      </div>

      <nav aria-label="Alojamiento" className="grid grid-cols-2 gap-1 rounded-[var(--a-radius)] bg-[var(--a-surface-2)] p-1">
        {properties.map((p) => {
          const active = p.slug === property.slug;
          return (
            <Link
              key={p.slug}
              href={`/admin/movil/precios?alojamiento=${p.slug}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-[var(--a-radius-sm)] px-2 py-2.5 text-center text-sm font-semibold ${
                active ? "bg-[var(--a-surface)] shadow-sm" : "text-[var(--a-text-soft)]"
              }`}
            >
              {p.experience === "sea" ? "Valencia · Mar" : "Javalambre · Montaña"}
            </Link>
          );
        })}
      </nav>

      <QuickRates key={property.slug} slug={property.slug} name={property.name} config={config} />
    </div>
  );
}
