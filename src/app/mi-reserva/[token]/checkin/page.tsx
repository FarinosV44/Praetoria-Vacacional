import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { portalDataForToken } from "@/domains/portal/service";
import { registryStatus } from "@/domains/registry/parte";
import { DOC_TYPE_LABEL } from "@/domains/registry/types";
import { deleteTravellerFromPortalAction } from "@/domains/registry/actions";
import { TravellerForm } from "./TravellerForm";

export const metadata: Metadata = { title: "Check-in", robots: { index: false, follow: false } };

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await portalDataForToken(token);
  if (!data) {
    return (
      <div className="container-page max-w-lg py-14 text-center">
        <h1 className="display-3">Enlace no válido</h1>
        <Link href="/mi-reserva" className="pv-btn pv-btn--primary mt-6 inline-flex">
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  const travellers = await getRepository().listTravellers(data.reservation.id);
  const status = registryStatus(travellers, data.reservation.guests, data.reservation.checkIn);

  return (
    <div className="container-page max-w-2xl py-10">
      <Link href={`/mi-reserva/${token}`} className="text-sm text-[var(--accent-700)]">
        ← Volver a la reserva
      </Link>
      <h1 className="display-2 mt-2">Check-in online · {data.propertyName}</h1>
      <p className="lede mt-3">
        Por normativa (RD 933/2021) necesitamos los datos de identificación de todas las personas que
        se alojan. Se envían de forma segura al registro del Ministerio del Interior y no se usan para
        ningún otro fin.
      </p>

      <p className="mt-4 text-sm">
        {status.complete ? (
          <span className="rounded-lg bg-green-50 px-3 py-1 text-green-800">
            Completo: {travellers.length} de {data.reservation.guests} viajeros.
          </span>
        ) : (
          <span className="rounded-lg bg-amber-50 px-3 py-1 text-amber-900">
            Faltan {status.missing} viajero(s){status.invalid ? ` · ${status.invalid} con datos incompletos` : ""}.
          </span>
        )}
      </p>

      {travellers.length > 0 && (
        <ul className="mt-6 space-y-2">
          {travellers.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm"
            >
              <span>
                <strong>{t.fullName}</strong> · {DOC_TYPE_LABEL[t.docType]} {t.docNumber}
                {t.isLead ? " · titular" : ""}
                {t.sentAt ? " · enviado" : ""}
              </span>
              {!t.sentAt && (
                <form action={deleteTravellerFromPortalAction}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-xs text-red-600 hover:underline" type="submit">
                    Quitar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {travellers.length < data.reservation.guests && (
        <div className="pv-card pv-card--pad mt-6">
          <h2 className="font-display text-lg">Añadir viajero</h2>
          <TravellerForm token={token} />
        </div>
      )}
    </div>
  );
}
