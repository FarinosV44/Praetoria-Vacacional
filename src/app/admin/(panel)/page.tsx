import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { addDays, todayIso } from "@/lib/dates";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getConfigFeatures } from "@/domains/config-status/registry";
import { monthNav } from "@/domains/calendar/month";

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
  const monthEnd = addDays(`${nav.nextMonth}-01`, 0);
  const daysInMonth = Math.round(
    (Date.parse(`${monthEnd}T00:00:00Z`) - Date.parse(`${monthStart}T00:00:00Z`)) / 86_400_000,
  );

  const repo = getRepository();
  const today = todayIso();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === sp.property);
  const scope = filterProp ? [filterProp] : properties;

  const [allReservations, payments, invoices, syncRows] = await Promise.all([
    repo.listReservations(filterProp ? { propertyId: filterProp.id } : {}),
    repo.listPayments(500),
    repo.listInvoices(filterProp ? { propertyId: filterProp.id } : {}),
    repo.getSyncRows(),
  ]);

  const inMonth = (d: string) => d >= monthStart && d < monthEnd;
  const occupies = (s: string) => s === "confirmed" || s === "pending" || s === "external";

  const monthReservations = allReservations.filter((r) => occupies(r.status) && inMonth(r.checkIn));
  const monthConfirmed = monthReservations.filter((r) => r.status === "confirmed");
  const revenue = monthConfirmed.reduce((s, r) => s + r.totalCents, 0);
  const nightsSold = monthReservations.reduce((s, r) => s + r.nights, 0);
  const paymentsReceived = payments
    .filter((p) => p.status === "succeeded" && inMonth(p.createdAt.slice(0, 10)))
    .reduce((s, p) => s + p.amountCents, 0);
  const occupancy = Math.min(
    100,
    Math.round((nightsSold / (daysInMonth * scope.length || 1)) * 100),
  );

  const byChannel = new Map<string, number>();
  for (const r of monthReservations) byChannel.set(r.source, (byChannel.get(r.source) ?? 0) + 1);

  const upcoming = allReservations
    .filter((r) => occupies(r.status) && r.checkIn >= today && r.checkIn <= addDays(today, 30))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const recent = [...allReservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

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
  const syncIssues = syncRows.filter((s) => s.lastError || s.lastStatus?.includes("no configurado"));

  const pendingConfig = getConfigFeatures().filter(
    (f) => f.state === "not_configured" || f.state === "error",
  );

  return (
    <div className="space-y-8">
      {pendingConfig.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {pendingConfig.length} integración(es) pendiente(s) de configuración
          </p>
          <p className="mt-1">
            {pendingConfig.map((f) => f.label).join(" · ")}.{" "}
            <Link href="/admin/configuracion" className="underline">
              Ver detalle
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Panel</h1>
        <form className="flex items-center gap-2 text-sm">
          <select
            name="property"
            defaultValue={sp.property ?? ""}
            className="h-9 rounded-lg border border-[var(--color-line)] px-2"
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
            className="h-9 rounded-lg border border-[var(--color-line)] px-2"
          />
          <button className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-white">Ver</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={`Ingresos ${nav.label}`} value={formatMoney(revenue)} />
        <Stat label="Pagos recibidos" value={formatMoney(paymentsReceived)} />
        <Stat label="Reservas del mes" value={String(monthReservations.length)} />
        <Stat label="Noches vendidas" value={String(nightsSold)} />
        <Stat label="Ocupación" value={`${occupancy}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Reservas por canal (mes)">
          {byChannel.size === 0 ? (
            <Empty>Sin reservas este mes.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {[...byChannel.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([ch, n]) => (
                  <li key={ch} className="flex justify-between">
                    <span>{CHANNEL_LABEL[ch] ?? ch}</span>
                    <span className="font-medium">{n}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Facturas pendientes de emitir"
          action={<Link href="/admin/facturas" className="text-xs text-[var(--accent-700)] hover:underline">Facturas →</Link>}
        >
          <p className="text-sm">
            <strong>{pendingInvoicing.length}</strong> reserva(s) confirmada(s) sin factura ·{" "}
            <strong>{draftInvoices.length}</strong> borrador(es)
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {pendingInvoicing.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link className="font-mono text-[var(--accent-700)] hover:underline" href={`/admin/reservas/${r.id}`}>
                  {r.code}
                </Link>{" "}
                · {getPropertyById(r.propertyId)?.name} · {formatMoney(r.totalCents)}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Próximas reservas (30 días)" action={<Link href="/admin/reservas" className="text-xs text-[var(--accent-700)] hover:underline">Todas →</Link>}>
          {upcoming.length === 0 ? (
            <Empty>Sin reservas próximas.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--color-line)] text-sm">
              {upcoming.slice(0, 8).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-mono text-xs">{r.code}</span>
                  <span>{formatRange(r.checkIn, r.checkOut)}</span>
                  <span className="text-[var(--color-ink-soft)]">{guestsLabel(r.guests)}</span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Reservas recientes">
          {recent.length === 0 ? (
            <Empty>Sin actividad.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--color-line)] text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link className="font-mono text-xs text-[var(--accent-700)] hover:underline" href={`/admin/reservas/${r.id}`}>
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

        <Panel title="Sincronización de calendarios" action={<Link href="/admin/sincronizacion" className="text-xs text-[var(--accent-700)] hover:underline">Ver →</Link>}>
          {syncIssues.length === 0 ? (
            <p className="text-sm text-green-700">Todo al día.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {syncIssues.map((s) => (
                <li key={s.id}>
                  {getPropertyById(s.propertyId)?.name} · {s.channel} ·{" "}
                  <span className="text-amber-700">{s.lastError ?? s.lastStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Accesos rápidos">
          <div className="flex flex-wrap gap-2 text-sm">
            {(
              [
                ["/admin/reservas/nuevo", "Nueva reserva"],
                ["/admin/clientes", "Clientes"],
                ["/admin/facturas", "Facturas"],
                ["/admin/calendario", "Calendario y precios"],
                ["/admin/marketing", "Campañas"],
                ["/admin/actividad", "Actividad"],
              ] as const
            ).map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5">
                {label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      {scope.map((p) => {
        const rs = monthReservations.filter((r) => r.propertyId === p.id);
        const nights = rs.reduce((s, r) => s + r.nights, 0);
        return (
          <p key={p.id} className="text-sm text-[var(--color-ink-soft)]">
            <strong className="text-[var(--color-ink)]">{p.name}</strong> — {rs.length} reservas ·{" "}
            {nights} noches · ocupación {Math.min(100, Math.round((nights / daysInMonth) * 100))}%
          </p>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-xl">{value}</p>
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
    <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--color-ink-soft)]">{children}</p>;
}
