import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { addDays, todayIso } from "@/lib/dates";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { getVapidKeys, listSubscriptions } from "@/domains/notifications/push";
import { MobileAppSetup } from "@/components/admin/mobile/MobileAppSetup";

export const metadata = { title: "App móvil" };
export const dynamic = "force-dynamic";

/**
 * Start screen of the installable admin app (manifest start_url): turn on
 * booking notifications, see who arrives next, jump to quick prices.
 */
export default async function AdminMobileHome() {
  const repo = getRepository();
  const today = todayIso();
  const [vapid, subs, upcoming] = await Promise.all([
    getVapidKeys().catch(() => null),
    listSubscriptions().catch(() => []),
    repo
      .listReservations({ status: ["confirmed"], from: today, to: addDays(today, 60) })
      .catch(() => []),
  ]);
  const next = upcoming
    .filter((r) => r.checkOut > today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1>Praetoria · Reservas</h1>

      <MobileAppSetup vapidPublicKey={vapid?.publicKey ?? ""} devices={subs.length} />

      <section className="admin-card p-4" aria-labelledby="quick-prices">
        <h2 id="quick-prices" className="text-base">
          Precios rápidos
        </h2>
        <div className="mt-3 grid gap-2">
          {getAllProperties().map((p) => (
            <Link
              key={p.slug}
              href={`/admin/movil/precios?alojamiento=${p.slug}`}
              className="admin-btn justify-between py-3 text-base"
              data-variant="outline"
            >
              <span>{p.name}</span>
              <span aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-card p-4" aria-labelledby="next-arrivals">
        <div className="flex items-baseline justify-between">
          <h2 id="next-arrivals" className="text-base">
            Próximas estancias
          </h2>
          <Link href="/admin/reservas" className="text-sm underline">
            Todas
          </Link>
        </div>
        {next.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--a-text-soft)]">Sin estancias confirmadas en los próximos 60 días.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--a-line-soft)]">
            {next.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reservas/${r.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {getPropertyById(r.propertyId)?.name ?? "Alojamiento"}
                    </span>
                    <span className="block truncate text-xs text-[var(--a-text-soft)]">
                      {formatRange(r.checkIn, r.checkOut)} · {guestsLabel(r.guests)}
                      {r.guestName ? ` · ${r.guestName}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(r.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
