import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { registryStatus } from "@/domains/registry/parte";
import { sesHospedajesConfigured } from "@/domains/registry/submit";
import { markParteSentAction } from "@/domains/registry/actions";

export const metadata = { title: "Registro de viajeros" };
export const dynamic = "force-dynamic";

export default async function RegistroViajerosPage() {
  const rows = await getRepository().upcomingTravellerRegistrations(14).catch(() => []);
  const configured = sesHospedajesConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Registro de viajeros (SES.HOSPEDAJES)</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Entradas de los próximos 14 días. Los huéspedes rellenan sus datos desde el check-in
          online; aquí ves lo que falta y registras el envío al Ministerio del Interior.
        </p>
        {!configured && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            La transmisión automática a SES.HOSPEDAJES no está configurada. Descarga el parte desde
            la ficha de la reserva, súbelo en el portal oficial y marca «enviado» aquí.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Entrada</th>
              <th className="px-3 py-2">Reserva</th>
              <th className="px-3 py-2">Alojamiento</th>
              <th className="px-3 py-2">Parte</th>
              <th className="px-3 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-ink-soft)]">
                  Sin entradas en los próximos 14 días.
                </td>
              </tr>
            )}
            {rows.map(({ reservation, travellers }) => {
              const status = registryStatus(travellers, reservation.guests, reservation.checkIn);
              return (
                <tr key={reservation.id} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{reservation.checkIn}</td>
                  <td className="px-3 py-2">
                    <Link className="text-[var(--a-accent-strong)] hover:underline" href={`/admin/reservas/${reservation.id}`}>
                      {reservation.code}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{getPropertyById(reservation.propertyId)?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {status.sent ? (
                      <span className="admin-chip" data-tone="accent">enviado</span>
                    ) : status.complete ? (
                      <span className="admin-chip" data-tone="accent">completo, sin enviar</span>
                    ) : (
                      <span className="admin-chip" data-tone="warn">
                        {travellers.length}/{reservation.guests}
                        {status.invalid ? ` · ${status.invalid} con errores` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!status.sent && status.complete && (
                      <form action={markParteSentAction} className="inline">
                        <input type="hidden" name="reservationId" value={reservation.id} />
                        <input type="hidden" name="ref" value="manual" />
                        <button className="admin-btn" data-variant="ghost" type="submit">
                          Marcar enviado
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
