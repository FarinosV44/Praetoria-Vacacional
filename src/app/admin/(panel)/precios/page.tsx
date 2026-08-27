import { getAllProperties } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { updateRatesAction } from "@/domains/admin/actions";
import { RatesForm } from "./RatesForm";

export const metadata = { title: "Precios y reglas" };

export default async function AdminPreciosPage() {
  const properties = getAllProperties();
  const configs = await Promise.all(
    properties.map(async (p) => ({
      property: p,
      effective: (await resolveRateConfig(p.slug)) ?? getRateConfig(p.slug)!,
    })),
  );

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl">Precios y reglas por alojamiento</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Los cambios se guardan como override y se reflejan en la web pública (precio del buscador,
        ficha y checkout) de inmediato. Importes en céntimos de euro. Las temporadas y descuentos se
        editan como JSON.
      </p>

      {configs.map(({ property, effective }) => (
        <section
          key={property.slug}
          data-experience={property.experience}
          className="rounded-xl border border-[var(--color-line)] bg-white p-5"
        >
          <h2 className="font-display text-lg">{property.name}</h2>
          <RatesForm propertySlug={property.slug} config={effective} action={updateRatesAction} />
        </section>
      ))}
    </div>
  );
}
