import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { addDays, todayIso } from "@/lib/dates";
import { buildMonthGrid, CHANNEL_COLOR, monthNav } from "@/domains/calendar/month";
import { CalendarMonth } from "./CalendarMonth";

export const metadata = { title: "Calendario y precios" };

function parseMonth(raw: string | undefined): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export default async function AdminCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const { year, month } = parseMonth(sp.m);
  const repo = getRepository();
  const properties = getAllProperties();
  const today = todayIso();

  const gridFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const gridTo = addDays(gridFrom, 45);

  const perProperty = await Promise.all(
    properties.map(async (p) => {
      const [config, reservations, blocks, dayRates] = await Promise.all([
        resolveRateConfig(p.slug),
        repo.listReservations({ propertyId: p.id, from: gridFrom, to: gridTo }),
        repo.listBlocks(p.id),
        repo.listDailyRates(p.id, gridFrom, gridTo),
      ]);
      return { property: p, config, reservations, blocks, dayRates };
    }),
  );

  const nav = monthNav(year, month);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Calendario y precios</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/admin/calendario?m=${nav.prevMonth}`} className="admin-btn" data-variant="outline">
            ← {nav.prevMonth}
          </Link>
          <span className="min-w-[9rem] text-center font-medium capitalize">{nav.label}</span>
          <Link href={`/admin/calendario?m=${nav.nextMonth}`} className="admin-btn" data-variant="outline">
            {nav.nextMonth} →
          </Link>
        </div>
      </div>

      <p className="flex flex-wrap gap-3 text-xs text-[var(--a-text-faint)]">
        {Object.entries({
          direct: "Directa",
          booking: "Booking",
          airbnb: "Airbnb",
          manual: "Cierre manual",
        }).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded" style={{ background: CHANNEL_COLOR[k] }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="text-[var(--a-accent-strong)]">●</span> precio ajustado
        </span>
      </p>

      {perProperty.map(({ property, config, reservations, blocks, dayRates }) => {
        if (!config) {
          return (
            <p key={property.id} className="admin-muted text-sm">
              {property.name}: sin tarifa configurada.
            </p>
          );
        }
        const grid = buildMonthGrid({
          year,
          month,
          config,
          reservations,
          blocks,
          dayRates,
          today,
        });
        return (
          <CalendarMonth
            key={property.id}
            propertySlug={property.slug}
            propertyName={property.name}
            weeks={grid.weeks}
          />
        );
      })}

      <p className="admin-muted text-xs">
        Los cambios de precio y estancia mínima se aplican de inmediato en la web pública y en el
        checkout. El ajuste porcentual parte del precio efectivo actual de cada día. «Cerrar
        fechas» crea un bloqueo manual. Las reservas y bloqueos importados de Booking/Airbnb se
        gestionan en «Integraciones».
      </p>
    </div>
  );
}
