import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatDateLong } from "@/lib/format";
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "@/domains/invoicing/types";
import { numberingInsight, yearCodeOf } from "@/domains/invoicing/numbering";
import { todayIso } from "@/lib/dates";

export const metadata = { title: "Facturas" };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-green-100 text-green-800",
  paid: "bg-emerald-100 text-emerald-800",
  void: "bg-red-100 text-red-700",
  rectified: "bg-amber-100 text-amber-800",
};

export default async function AdminFacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const repo = getRepository();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === sp.property);

  const [invoices, allNumbers] = await Promise.all([
    repo.listInvoices({
      propertyId: filterProp?.id,
      status: sp.status ? [sp.status as InvoiceStatus] : undefined,
      q: sp.q || undefined,
    }),
    Promise.all(properties.map((p) => repo.allInvoiceNumbers(p.id))),
  ]);

  const yc = yearCodeOf(todayIso());
  const insights = await Promise.all(
    properties.map(async (p, i) => {
      const settings = await repo.invoiceSettings(p.id);
      return { property: p, insight: numberingInsight(settings.series, yc, allNumbers[i] ?? []) };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Facturas</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/admin/facturas/export?${new URLSearchParams(
              Object.entries(sp).filter(([, v]) => v) as [string, string][],
            ).toString()}`}
            className="h-9 rounded-lg border border-[var(--color-line)] px-3 text-sm leading-9"
          >
            Exportar CSV
          </a>
          <Link
            href="/admin/facturas/ajustes"
            className="text-sm text-[var(--accent-700)] hover:underline"
          >
            Ajustes de facturación
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map(({ property, insight }) => (
          <div key={property.id} className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm">
            <p className="font-medium">
              {property.name} · serie {insight.series}
            </p>
            <p className="mt-1 text-[var(--color-ink-soft)]">
              {insight.count} facturas en {yc} · siguiente sugerido{" "}
              <span className="font-mono text-[var(--color-ink)]">{insight.suggestedNext}</span>
            </p>
            {insight.gaps.length > 0 && (
              <p className="mt-1 text-amber-700">
                Saltos detectados: {insight.gaps.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Número, nombre, NIF…"
          className="h-10 min-w-[220px] rounded-lg border border-[var(--color-line)] px-3"
        />
        <select
          name="property"
          defaultValue={sp.property ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los alojamientos</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los estados</option>
          {Object.entries(INVOICE_STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Número</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Alojamiento</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin facturas. Se emiten desde la ficha de una reserva.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[var(--accent-50)]">
                <td className="p-3 font-mono text-xs">
                  <Link
                    className="text-[var(--accent-700)] hover:underline"
                    href={`/admin/facturas/${inv.id}`}
                  >
                    {inv.number}
                  </Link>
                </td>
                <td className="p-3">{formatDateLong(inv.issueDate)}</td>
                <td className="p-3">{getPropertyById(inv.propertyId)?.name ?? "—"}</td>
                <td className="p-3">{inv.billTo.name || "—"}</td>
                <td className="p-3">{formatMoney(inv.totalCents)}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[inv.status] ?? "bg-gray-100"}`}
                  >
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
