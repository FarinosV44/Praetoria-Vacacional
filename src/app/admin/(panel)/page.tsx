import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { addDays, nightsBetween, todayIso } from "@/lib/dates";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getConfigFeatures } from "@/domains/config-status/registry";
import { monthNav } from "@/domains/calendar/month";
import { findHardGaps } from "@/domains/calendar/gaps";
import { occupancy } from "@/domains/booking/availability";

const CHANNEL_LABEL: Record<string, string> = {
  direct: "Directa",
  booking: "Booking",
  airbnb: "Airbnb",
  manual: "Manual",
  other: "Otro",
};

function parseMonth(raw: string | undefined) {
  const m = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; property?: string }>;
}) {
  const sp = await searchParams;
  const { year, month } = parseMonth(sp.m);
  const nav = monthNav(year, month);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${nav.nextMonth}-01`;
  const daysInMonth = nightsBetween(monthStart, monthEnd);

  const repo = getRepository();
  const today = todayIso();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === sp.property);
  const scope = filterProp ? [filterProp] : properties;

  const [allReservations, payments, invoices, syncRows, ...busyByProp] = await Promise.all([
    repo.listReservations(filterProp ? { propertyId: filterProp.id } : {}),
    repo.listPayments(500),
    repo.listInvoices(filterProp ? { propertyId: filterProp.id } : {}),
    repo.getSyncRows(),
    ...scope.map((p) => repo.getBusyRanges(p.id, today, addDays(today, 95))),
  ]);
  const busyOf = new Map(scope.map((p, i) => [p.id, busyByProp[i] ?? []]));

  const inMonth = (d: string) => d >= monthStart && d < monthEnd;
  const occupies = (s: string) => s === "confirmed" || s === "pending" || s === "external";

  const monthReservations = allReservations.filter((r) => occupies(r.status) && inMonth(r.checkIn));
  const monthConfirmed = monthReservations.filter((r) => r.status === "confirmed");
  const revenue = monthConfirmed.reduce((s, r) => s + r.totalCents, 0);
  const nightsSold = monthReservations.reduce((s, r) => s + r.nights, 0);
  const paymentsReceived = payments
    .filter((p) => p.status === "succeeded" && inMonth(p.createdAt.slice(0, 10)))
    .reduce((s, p) => s + p.amountCents, 0);
  const occ = (days: number) => {
    let taken = 0;
    let total = 0;
    for (const p of scope) {
      const o = occupancy(busyOf.get(p.id) ?? [], today, addDays(today, days));
      taken += o.busyNights;
      total += o.totalNights;
    }
    return total === 0 ? 0 : Math.round((taken / total) * 100);
  };

  const byChannel = new Map<string, number>();
  for (const r of monthReservations) byChannel.set(r.source, (byChannel.get(r.source) ?? 0) + 1);

  const staying = allReservations.filter(
    (r) => occupies(r.status) && r.checkIn <= today && r.checkOut > today,
  );
  const arrivals = allReservations
    .filter((r) => occupies(r.status) && r.checkIn >= today && r.checkIn <= addDays(today, 7))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const departures = allReservations
    .filter((r) => occupies(r.status) && r.checkOut >= today && r.checkOut <= addDays(today, 7))
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut));
  const recent = [...allReservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const hardGaps = scope.flatMap((p) =>
    findHardGaps(busyOf.get(p.id) ?? [], today, addDays(today, 60)).map((g) => ({ ...g, property: p.name })),
  );

  const invoicedReservationIds = new Set(
    invoices.filter((i) => i.reservationId).map((i) => i.reservationId),
  );
  const pendingInvoicing = allReservations.filter(
    (r) =>
      r.status === "confirmed" &&
      !r.invoiceNumber &&
      !invoicedReservationIds.has(r.id) &&
      r.checkIn <= addDays(today, 3),
  );
  const draftInvoices = invoices.filter((i) => i.status === "draft");
  const failedPayments = payments.filter((p) => p.status === "failed").slice(0, 5);
  const syncIssues = syncRows.filter((s) => s.lastError || s.lastStatus?.includes("no configurado"));

  const pendingConfig = getConfigFeatures().filter(
    (f) => f.state === "not_configured" || f.state === "error",
  );

  return (
    <div className="space-y-5">
      {pendingConfig.length > 0 && (
        <div className="admin-card border-l-4 border-l-[var(--a-warn)] p-3 text-sm">
          <p className="font-medium">
            {pendingConfig.length} integración(es) pendiente(s) de configuración
          </p>
          <p className="admin-muted mt-1">
            {pendingConfig.map((f) => f.label).join(" · ")}.{" "}
            <Link href="/admin/configuracion" className="text-[var(--a-accent-strong)] underline">
              Ver detalle
            </Link>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Resumen</h1>
        <form className="flex items-center gap-2 text-sm">
          <select
            name="property"
            defaultValue={sp.property ?? ""}
            className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] bg-[var(--a-surface)] px-2"
          >
            <option value="">Todos los alojamientos</option>
            {properties.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            name="m"
            defaultValue={`${year}-${String(month).padStart(2, "0")}`}
            className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] bg-[var(--a-surface)] px-2"
          />
          <button className="admin-btn" data-variant="primary">
            Ver
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label={`Ingresos ${nav.label}`} value={formatMoney(revenue)} />
        <Stat label="Pagos recibidos" value={formatMoney(paymentsReceived)} />
        <Stat label="Reservas del mes" value={String(monthReservations.length)} />
        <Stat label="Noches vendidas" value={String(nightsSold)} />
        <Stat label="Alojados ahora" value={String(staying.length)} />
        <Stat
          label="Ocupación 30 / 60 / 90"
          value={`${occ(30)}% · ${occ(60)}% · ${occ(90)}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={`Entradas (7 días)`} action={<More href="/admin/reservas" />}>
          <StayList
            rows={arrivals}
            empty="Sin entradas próximas."
            dateOf={(r) => r.checkIn}
          />
        </Panel>

        <Panel title="Salidas (7 días)" action={<More href="/admin/reservas" />}>
          <StayList
            rows={departures}
            empty="Sin salidas próximas."
            dateOf={(r) => r.checkOut}
          />
        </Panel>

        <Panel title="Alojados ahora">
          {staying.length === 0 ? (
            <Empty>Nadie alojado ahora mismo.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--a-line-soft)] text-sm">
              {staying.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="truncate">{r.guestName ?? r.code}</span>
                  <span className="admin-muted text-xs">
                    {getPropertyById(r.propertyId)?.name?.split(" ")[0]} · sale{" "}
                    {formatRange(r.checkIn, r.checkOut).split("–")[1]?.trim()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Reservas por canal (mes)">
          {byChannel.size === 0 ? (
            <Empty>Sin reservas este mes.</Empty>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...byChannel.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([ch, n]) => {
                  const pct = Math.round((n / monthReservations.length) * 100);
                  return (
                    <li key={ch}>
                      <div className="flex justify-between">
                        <span>{CHANNEL_LABEL[ch] ?? ch}</span>
                        <span className="font-medium">{n}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[var(--a-surface-2)]">
                        <div
                          className="h-full rounded-full bg-[var(--a-accent)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>

        <Panel title="Huecos difíciles de vender" action={<More href="/admin/calendario" />}>
          {hardGaps.length === 0 ? (
            <Empty>Sin huecos cortos en 60 días.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {hardGaps.slice(0, 6).map((g, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>{formatRange(g.checkIn, g.checkOut)}</span>
                  <span className="admin-chip" data-tone="warn">
                    {g.nights} {g.nights === 1 ? "noche" : "noches"} · {g.property.split(" ")[0]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Facturas pendientes" action={<More href="/admin/facturas" />}>
          <p className="text-sm">
            <strong>{pendingInvoicing.length}</strong> sin factura ·{" "}
            <strong>{draftInvoices.length}</strong> borrador(es)
          </p>
          <ul className="admin-muted mt-2 space-y-1 text-xs">
            {pendingInvoicing.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link className="font-mono text-[var(--a-accent-strong)] hover:underline" href={`/admin/reservas/${r.id}`}>
                  {r.code}
                </Link>{" "}
                · {getPropertyById(r.propertyId)?.name} · {formatMoney(r.totalCents)}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Pagos con incidencia" action={<More href="/admin/pagos" />}>
          {failedPayments.length === 0 ? (
            <p className="text-sm text-[var(--a-ok)]">Sin pagos fallidos.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {failedPayments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="admin-muted">{p.createdAt.slice(0, 10)}</span>
                  <span>{formatMoney(p.amountCents)}</span>
                  <span className="admin-chip" data-tone="danger">
                    fallido
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Sincronización de calendarios" action={<More href="/admin/sincronizacion" />}>
          {syncIssues.length === 0 ? (
            <p className="text-sm text-[var(--a-ok)]">Todo al día.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {syncIssues.map((s) => (
                <li key={s.id}>
                  {getPropertyById(s.propertyId)?.name} · {s.channel} ·{" "}
                  <span className="text-[var(--a-warn)]">{s.lastError ?? s.lastStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Reservas recientes">
          {recent.length === 0 ? (
            <Empty>Sin actividad.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--a-line-soft)] text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <Link className="font-mono text-xs text-[var(--a-accent-strong)] hover:underline" href={`/admin/reservas/${r.id}`}>
                    {r.code}
                  </Link>
                  <span className="text-xs">{CHANNEL_LABEL[r.source] ?? r.source}</span>
                  <span>{formatMoney(r.totalCents)}</span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="admin-card p-4">
        <h2 className="text-sm font-semibold">Por alojamiento · {nav.label}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {scope.map((p) => {
            const rs = monthReservations.filter((r) => r.propertyId === p.id);
            const nights = rs.reduce((s, r) => s + r.nights, 0);
            return (
              <p key={p.id} className="admin-muted text-sm">
                <strong className="text-[var(--a-text)]">{p.name}</strong> — {rs.length} reservas ·{" "}
                {nights} noches · ocupación{" "}
                {Math.min(100, Math.round((nights / daysInMonth) * 100))}%
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card p-3">
      <p className="admin-muted text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function More({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs text-[var(--a-accent-strong)] hover:underline">
      Ver →
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="admin-muted text-sm">{children}</p>;
}

function StayList({
  rows,
  empty,
  dateOf,
}: {
  rows: import("@/domains/booking/types").Reservation[];
  empty: string;
  dateOf: (r: import("@/domains/booking/types").Reservation) => string;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-[var(--a-line-soft)] text-sm">
      {rows.slice(0, 6).map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
          <span className="tabular-nums">{dateOf(r).slice(5)}</span>
          <span className="min-w-0 flex-1 truncate px-2">{r.guestName ?? r.code}</span>
          <span className="admin-muted text-xs">{guestsLabel(r.guests)}</span>
          <StatusBadge status={r.status} />
        </li>
      ))}
    </ul>
  );
}
