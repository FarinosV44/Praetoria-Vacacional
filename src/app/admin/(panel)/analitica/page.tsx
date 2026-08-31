import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { formatMoney } from "@/lib/format";
import { computePeriodKpis, pctChange, trailingMonths, type PeriodKpis } from "@/domains/analytics/kpis";

export const metadata = { title: "Analítica" };

const MONTHS = 12;

const CHANNEL_LABEL: Record<string, string> = {
  direct: "Directa",
  booking: "Booking",
  airbnb: "Airbnb",
  manual: "Manual",
  other: "Otro",
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function monthLabel(from: string) {
  return new Date(`${from}T00:00:00Z`).toLocaleDateString("es-ES", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--color-ink-soft)]">—</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-green-700" : "text-red-700"}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

export default async function AnaliticaPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const sp = await searchParams;
  const properties = getAllProperties();
  const scoped = properties.find((p) => p.slug === sp.property);
  const scope = scoped ? [scoped] : properties;

  const repo = getRepository();
  const reservations = await repo.listReservations(scoped ? { propertyId: scoped.id } : {});

  const windows = trailingMonths(MONTHS);
  const rows: PeriodKpis[] = windows.map((w) =>
    computePeriodKpis({
      from: w.from,
      to: w.to,
      propertyCount: scope.length,
      reservations,
    }),
  );

  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Analítica de negocio</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Ocupación, ADR (tarifa media por noche), RevPAR (ingreso por noche disponible), mezcla de
          canales y antelación de reserva, mes a mes. Base: una noche cuenta en el mes de su fecha;
          los ingresos se atribuyen al mes de entrada. Reservas directas, confirmadas de plataforma y
          bloqueos externos cuentan como ocupación; canceladas y expiradas no.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/analitica"
          className={`rounded-full px-3 py-1 ring-1 ring-[var(--color-line)] ${!scoped ? "bg-[var(--accent-50)] font-medium" : ""}`}
        >
          Todos
        </Link>
        {properties.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/analitica?property=${p.slug}`}
            className={`rounded-full px-3 py-1 ring-1 ring-[var(--color-line)] ${scoped?.slug === p.slug ? "bg-[var(--accent-50)] font-medium" : ""}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {latest && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Ocupación", v: pct(latest.occupancyRate), d: prev ? pctChange(latest.occupancyRate, prev.occupancyRate) : null },
            { k: "ADR", v: formatMoney(latest.adrCents), d: prev ? pctChange(latest.adrCents, prev.adrCents) : null },
            { k: "RevPAR", v: formatMoney(latest.revparCents), d: prev ? pctChange(latest.revparCents, prev.revparCents) : null },
            { k: "Ingresos del mes", v: formatMoney(latest.revenueCents), d: prev ? pctChange(latest.revenueCents, prev.revenueCents) : null },
          ].map((c) => (
            <div key={c.k} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
              <div className="text-xs text-[var(--color-ink-soft)]">{c.k}</div>
              <div className="mt-1 font-display text-xl">{c.v}</div>
              <div className="mt-1 text-xs">
                <Delta value={c.d} /> <span className="text-[var(--color-ink-soft)]">vs mes anterior</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Mes</th>
              <th className="p-3 text-right">Ocupación</th>
              <th className="p-3 text-right">Noches</th>
              <th className="p-3 text-right">ADR</th>
              <th className="p-3 text-right">RevPAR</th>
              <th className="p-3 text-right">Ingresos</th>
              <th className="p-3 text-right">Reservas</th>
              <th className="p-3 text-right">Antelación</th>
              <th className="p-3 text-right">Directa</th>
              <th className="p-3 text-right">Cancelación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {rows.map((r) => (
              <tr key={r.from}>
                <td className="p-3 capitalize">{monthLabel(r.from)}</td>
                <td className="p-3 text-right">{pct(r.occupancyRate)}</td>
                <td className="p-3 text-right">{r.nightsSold}</td>
                <td className="p-3 text-right">{r.adrCents ? formatMoney(r.adrCents) : "—"}</td>
                <td className="p-3 text-right">{r.revparCents ? formatMoney(r.revparCents) : "—"}</td>
                <td className="p-3 text-right">{formatMoney(r.revenueCents)}</td>
                <td className="p-3 text-right">{r.bookings}</td>
                <td className="p-3 text-right">
                  {r.avgLeadTimeDays === null ? "—" : `${Math.round(r.avgLeadTimeDays)} d`}
                </td>
                <td className="p-3 text-right">{pct(r.directNightsShare)}</td>
                <td className="p-3 text-right">{pct(r.cancellationRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {latest && latest.channelMix.length > 0 && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-5">
          <h2 className="font-display text-lg">Mezcla de canales · {monthLabel(latest.from)}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {latest.channelMix.map((c) => (
              <li key={c.source} className="flex items-center gap-3">
                <span className="w-20 shrink-0">{CHANNEL_LABEL[c.source] ?? c.source}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-paper)]">
                  <span
                    className="block h-full bg-[var(--accent-500,#0891b2)]"
                    style={{ width: pct(c.nightsShare) }}
                  />
                </span>
                <span className="w-28 shrink-0 text-right text-xs text-[var(--color-ink-soft)]">
                  {c.nights} noches · {formatMoney(c.revenueCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-soft)]">
        En modo demostración los datos provienen del almacén en memoria. Con Supabase, provienen de
        las reservas reales (directas + importadas de Booking/Airbnb).
      </p>
    </div>
  );
}
