import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { getRateConfig } from "@/content/rates";
import { resolveStayFees } from "@/domains/pricing/fees";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Alojamientos" };

/**
 * Alojamientos hub (issue #60 §6). One card per property with its operational
 * facts and shortcuts. The full tabbed fiche (General / Capacidad / Contenido /
 * Precios / Cargos / Políticas / Calendarios / SEO / Integraciones) is built on
 * top of this in a later sprint.
 */
export default async function AlojamientosPage() {
  const props = getAllProperties();
  const rows = await Promise.all(
    props.map(async (p) => ({
      p,
      rate: (await resolveRateConfig(p.slug)) ?? getRateConfig(p.slug)!,
    })),
  );

  return (
    <div className="space-y-4">
      <p className="admin-muted text-sm">
        Datos operativos de cada alojamiento. Todo se edita sin tocar código.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ p, rate }) => {
          const fees = resolveStayFees(rate);
          const links: [string, string][] = [
            ["/admin/calendario", "Calendario y precios"],
            ["/admin/precios", "Precios y reglas"],
            ["/admin/contenido", "Contenido y SEO"],
            ["/admin/sincronizacion", "Integraciones (iCal)"],
            ["/admin/configuracion", "Configuración"],
          ];
          return (
            <section key={p.slug} className="admin-card p-4" data-experience={p.experience}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{p.name}</h2>
                  <p className="admin-muted text-xs">
                    {p.location.area} · {p.location.region}
                  </p>
                </div>
                <span className="admin-chip" data-tone="neutral">
                  {p.experience === "ski" ? "Montaña" : "Playa"}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Fact label="Capacidad" value={`${p.capacity.guests} huéspedes`} />
                <Fact label="Dormitorios" value={String(p.capacity.bedrooms)} />
                <Fact label="Precio base" value={`${formatMoney(rate.baseNightlyCents)}/noche`} />
                <Fact label="Estancia mín." value={`${rate.minNights} noches`} />
                <Fact
                  label="Cargos"
                  value={fees.length ? fees.map((f) => f.label).join(", ") : "Sin cargos"}
                />
                <Fact
                  label="Licencia turística"
                  value={p.stayInfo.licenseNumber ?? "—"}
                />
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {links.map(([href, label]) => (
                  <Link key={label} href={href} className="admin-btn" data-variant="outline">
                    {label}
                  </Link>
                ))}
                <Link
                  href={`/${p.slug}`}
                  target="_blank"
                  className="admin-btn"
                  data-variant="ghost"
                >
                  Ver ficha pública
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="admin-muted text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
