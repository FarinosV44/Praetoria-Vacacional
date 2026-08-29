import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { displayName } from "@/domains/crm/types";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { SegmentForm } from "../../SegmentForm";
import { saveSegmentAction, deleteSegmentAction } from "@/domains/marketing/actions";
import { createQuickCouponAction } from "@/domains/promotions/actions";

export const metadata = { title: "Segmento" };

export default async function SegmentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const segment = await repo.getSegment(id);
  if (!segment) notFound();
  const members = await repo.segmentMembers(segment.criteria);

  const withEmail = members.filter((m) => m.email).length;
  const withPhone = members.filter((m) => m.phone || m.whatsapp).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/marketing" className="text-sm text-[var(--accent-700)] hover:underline">
            ← Marketing
          </Link>
          <h1 className="mt-1 font-display text-2xl">{segment.name}</h1>
        </div>
        <form action={deleteSegmentAction}>
          <input type="hidden" name="id" value={segment.id} />
          <ConfirmSubmit message={`Eliminar el segmento «${segment.name}»?`}>Eliminar</ConfirmSubmit>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Clientes", String(members.length)],
          ["Con email", String(withEmail)],
          ["Con teléfono", String(withPhone)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-[var(--color-line)] bg-white p-3">
            <p className="text-xs text-[var(--color-ink-soft)]">{l}</p>
            <p className="mt-1 text-lg font-medium">{v}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          className="rounded-lg border border-[var(--color-line)] px-3 py-2"
          href={`/admin/marketing/export?segment=${segment.id}&field=email`}
        >
          Exportar emails (CSV)
        </a>
        <a
          className="rounded-lg border border-[var(--color-line)] px-3 py-2"
          href={`/admin/marketing/export?segment=${segment.id}&field=phone`}
        >
          Exportar teléfonos (CSV)
        </a>
        <a
          className="rounded-lg border border-[var(--color-line)] px-3 py-2"
          href={`/admin/marketing/export?segment=${segment.id}&field=all`}
        >
          Exportar todo (CSV)
        </a>
      </div>

      <details className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">Crear cupón para este segmento</summary>
        <form action={createQuickCouponAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="label" value={segment.name} />
          <input type="hidden" name="redirectTo" value={`/admin/marketing/segmentos/${segment.id}`} />
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Tipo</span>
            <select name="kind" defaultValue="percent" className="h-9 rounded-lg border border-[var(--color-line)] px-2">
              <option value="percent">Porcentaje</option>
              <option value="fixed">Importe fijo</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Valor</span>
            <input name="value" defaultValue={10} inputMode="decimal" className="h-9 w-20 rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Caduca en (días)</span>
            <input name="days" defaultValue={90} type="number" className="h-9 w-20 rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <input type="hidden" name="perEmail" value="0" />
          <button className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-white">Crear cupón</button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Úsalo luego en una campaña (campo «Código promocional»). Ajustable en Promociones.
        </p>
      </details>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Email</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Gasto</th>
              <th className="p-3">Marketing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {members.slice(0, 200).map((m) => (
              <tr key={m.id}>
                <td className="p-3">
                  <Link className="text-[var(--accent-700)] hover:underline" href={`/admin/clientes/${m.id}`}>
                    {displayName(m)}
                  </Link>
                </td>
                <td className="p-3 text-xs">{m.email ?? "—"}</td>
                <td className="p-3 text-xs">{m.phone ?? m.whatsapp ?? "—"}</td>
                <td className="p-3 text-xs">{(m.totalSpentCents / 100).toFixed(0)} €</td>
                <td className="p-3 text-xs">{m.marketingConsent ? "sí" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length > 200 && (
          <p className="p-3 text-xs text-[var(--color-ink-soft)]">
            Mostrando 200 de {members.length}. La exportación incluye todos.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <h2 className="mb-3 font-display text-lg">Editar segmento</h2>
        <SegmentForm
          action={saveSegmentAction}
          properties={getAllProperties()}
          segment={segment}
          submitLabel="Guardar cambios"
        />
      </section>
    </div>
  );
}
