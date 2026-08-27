import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { formatRange } from "@/lib/format";
import { createBlockAction, deleteBlockAction } from "@/domains/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { BlockForm } from "./BlockForm";

export const metadata = { title: "Calendario y bloqueos" };

export default async function AdminCalendarioPage() {
  const repo = getRepository();
  const properties = getAllProperties();
  const blocksByProp = await Promise.all(
    properties.map(async (p) => ({ property: p, blocks: await repo.listBlocks(p.id) })),
  );

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl">Calendario y bloqueos manuales</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Los bloqueos manuales cierran fechas en la web pública inmediatamente. Los bloqueos
        importados de Booking se gestionan en “Sincronización”.
      </p>

      {blocksByProp.map(({ property, blocks }) => (
        <section key={property.slug} className="rounded-xl border border-[var(--color-line)] bg-white p-5">
          <h2 className="font-display text-lg">{property.name}</h2>

          <BlockForm propertySlug={property.slug} action={createBlockAction} />

          <ul className="mt-4 divide-y divide-[var(--color-line)] text-sm">
            {blocks.length === 0 && (
              <li className="py-2 text-[var(--color-ink-soft)]">Sin bloqueos.</li>
            )}
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {formatRange(b.startDate, b.endDate)}{" "}
                  <span className="text-[var(--color-ink-soft)]">
                    · {b.summary ?? "—"} ({b.source})
                  </span>
                </span>
                {b.source === "manual" && (
                  <form action={deleteBlockAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmSubmit message="¿Eliminar este bloqueo? Las fechas volverán a estar disponibles.">
                      Eliminar
                    </ConfirmSubmit>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
