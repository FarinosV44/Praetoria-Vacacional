import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { addDays, todayIso } from "@/lib/dates";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getConfigFeatures } from "@/domains/config-status/registry";

export default async function AdminDashboard() {
  const repo = getRepository();
  const today = todayIso();
  const horizon = addDays(today, 120);
  const properties = getAllProperties();

  const upcoming = await repo.listReservations({
    status: ["confirmed", "pending"],
    from: today,
    to: horizon,
  });

  const confirmed = upcoming.filter((r) => r.status === "confirmed");
  const revenue = confirmed.reduce((s, r) => s + r.totalCents, 0);
  const nightsSold = confirmed.reduce((s, r) => s + r.nights, 0);

  const pending = getConfigFeatures().filter(
    (f) => f.state === "not_configured" || f.state === "error",
  );

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {pending.length} integración(es) pendiente(s) de configuración
          </p>
          <p className="mt-1">
            {pending.map((f) => f.label).join(" · ")}. Todo el código está implementado; solo faltan
            las claves.{" "}
            <Link href="/admin/configuracion" className="underline">
              Ver detalle y cómo activarlas
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Reservas confirmadas (120 días)" value={String(confirmed.length)} />
        <Stat label="Ingresos confirmados" value={formatMoney(revenue)} />
        <Stat label="Noches vendidas" value={String(nightsSold)} />
      </div>

      {properties.map((p) => {
        const rs = upcoming.filter((r) => r.propertyId === p.id);
        return (
          <section key={p.slug}>
            <h2 className="font-display text-lg">
              {p.name}{" "}
              <span className="text-sm text-[var(--color-ink-soft)]">
                · {rs.filter((r) => r.status === "confirmed").length} confirmadas
              </span>
            </h2>
            {rs.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Sin reservas próximas.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-white">
                {rs.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <span className="font-mono text-xs">{r.code}</span>
                    <span>{formatRange(r.checkIn, r.checkOut)}</span>
                    <span className="text-[var(--color-ink-soft)]">{guestsLabel(r.guests)}</span>
                    <span>{formatMoney(r.totalCents)}</span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <p className="text-sm">
        <Link href="/admin/reservas" className="text-[var(--accent-700)] hover:underline">
          Ver todas las reservas →
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

