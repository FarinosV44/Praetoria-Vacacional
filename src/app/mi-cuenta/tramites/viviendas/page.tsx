import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { getActiveCatalog } from "@/domains/tramites/service";
import { serviceByCode } from "@/domains/tramites/catalog";
import { isOpen } from "@/domains/tramites/workflow";
import { AddPropertyForm } from "@/components/tramites/portal-forms";
import { EmptyState } from "@/components/tramites/ui";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Viviendas" };
export const dynamic = "force-dynamic";

const TRI = { si: "Sí", no: "No", no_se: "Sin confirmar" } as const;

export default async function ViviendasPage() {
  const ctx = await requireOwner();
  const [snap, catalog] = await Promise.all([portalSnapshot(ctx), getActiveCatalog()]);
  const ses = serviceByCode(catalog, "ses_alta");
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="v-h">
        <h1 id="v-h" className="text-2xl font-semibold">Viviendas</h1>
        {snap.properties.length === 0 ? (
          <EmptyState>Aún no tienes viviendas.</EmptyState>
        ) : (
          <ul className="mt-4 grid gap-3">
            {snap.properties.map((p) => (
              <li key={p.id}>
                <Link href={`/mi-cuenta/tramites/viviendas/${p.id}`} className="block rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 hover:bg-[var(--color-paper)]">
                  <span className="font-semibold">{p.alias}</span>
                  <span className="block text-sm text-[var(--color-ink-soft)]">
                    {p.street}, {p.postalCode} {p.municipality}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-4 text-xs text-[var(--color-ink-faint)]">
                    <span>Registro turístico: {p.tourismRegistryNumber ?? TRI[p.hasTourismRegistry]}</span>
                    <span>SES.HOSPEDAJES: {p.sesEstablishmentCode ?? TRI[p.hasSesAlta]}</span>
                    <span>{snap.filings.filter((f) => f.propertyId === p.id && isOpen(f.status)).length} trámites abiertos</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="add-h" className="pv-card self-start p-5">
        <h2 id="add-h" className="font-semibold">Añadir una vivienda</h2>
        <div className="mt-4">
          <AddPropertyForm sesPrice={ses?.enabled ? formatMoney(ses.priceCents) : null} />
        </div>
      </section>
    </div>
  );
}
