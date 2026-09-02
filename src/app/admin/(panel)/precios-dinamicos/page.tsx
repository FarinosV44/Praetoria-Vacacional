import { getAllProperties } from "@/domains/properties/registry";
import { computeDynamicPlan } from "@/domains/pricing/dynamic-apply";
import { applyDynamicPricingNowAction } from "@/domains/pricing/dynamic-actions";
import { DynamicSettingsForm } from "./DynamicSettingsForm";

export const metadata = { title: "Precios dinámicos" };
export const dynamic = "force-dynamic";

const money = (c: number) => (c / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default async function PreciosDinamicosPage() {
  const properties = getAllProperties();
  const plans = await Promise.all(properties.map((p) => computeDynamicPlan(p.slug)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Precios dinámicos</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Ajuste explicable del precio por noche según antelación, demanda y huecos. Cada
          recomendación se limita a ±banda del precio natural y nunca baja del suelo que fijes.
          Con «aplicar automáticamente» activado, el ajuste se escribe cada día sin intervención;
          si no, revisa y pulsa «aplicar ahora».
        </p>
      </div>

      {properties.map((property, idx) => {
        const plan = plans[idx];
        if (!plan) return null;
        const changed = plan.suggestions.filter((s) => s.recommendedCents !== s.baseCents);
        return (
          <section key={property.slug} className="space-y-4">
            <h2 className="font-display text-lg">{property.name}</h2>

            <div className="rounded-xl border border-[var(--color-line)] bg-white p-5">
              <DynamicSettingsForm propertySlug={property.slug} settings={plan.settings} />
              <form action={applyDynamicPricingNowAction} className="mt-3">
                <input type="hidden" name="propertySlug" value={property.slug} />
                <button className="admin-btn" data-variant="primary" type="submit">
                  Aplicar ahora ({changed.length} fechas)
                </button>
              </form>
            </div>

            {changed.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">
                Ninguna fecha necesita ajuste ahora mismo.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Natural</th>
                      <th className="px-3 py-2">Recomendado</th>
                      <th className="px-3 py-2">Cambio</th>
                      <th className="px-3 py-2">Motivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changed.slice(0, 60).map((s) => (
                      <tr key={s.date} className="border-b border-[var(--color-line)] last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{s.date}</td>
                        <td className="px-3 py-2">{money(s.baseCents)}</td>
                        <td className="px-3 py-2 font-medium">{money(s.recommendedCents)}</td>
                        <td className={`px-3 py-2 ${s.changePct < 0 ? "text-red-700" : "text-green-700"}`}>
                          {s.changePct > 0 ? "+" : ""}
                          {s.changePct}%{s.clamped ? ` (tope ${s.clamped === "floor" ? "suelo" : "banda"})` : ""}
                        </td>
                        <td className="px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                          {s.factors.map((f) => `${f.label} ${f.deltaPct > 0 ? "+" : ""}${f.deltaPct}%`).join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
