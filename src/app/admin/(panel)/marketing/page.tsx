import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { describeCriteria } from "@/domains/marketing/segments";
import { CAMPAIGN_STATUS_LABEL } from "@/domains/marketing/types";

export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const repo = getRepository();
  const [segments, campaigns, profiles, unsubs] = await Promise.all([
    repo.listSegments(),
    repo.listCampaigns(),
    repo.listCustomerProfiles(),
    repo.listUnsubscribes(),
  ]);

  const counts = await Promise.all(segments.map((s) => repo.segmentMembers(s.criteria)));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Marketing</h1>
        <Link href="/admin/marketing/bajas" className="text-sm text-[var(--accent-700)] hover:underline">
          Bajas ({unsubs.length})
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Segmentos</h2>
          <Link
            href="/admin/marketing/segmentos/nuevo"
            className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-sm font-medium leading-9 text-white"
          >
            Nuevo segmento
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Criterios</th>
                <th className="p-3">Clientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {segments.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-[var(--color-ink-soft)]">
                    Sin segmentos guardados. Ej.: «Clientes Javalambre última temporada»,
                    «Repetidores», «Reservaron por Booking».
                  </td>
                </tr>
              )}
              {segments.map((s, i) => (
                <tr key={s.id} className="hover:bg-[var(--accent-50)]">
                  <td className="p-3">
                    <Link
                      className="font-medium text-[var(--accent-700)] hover:underline"
                      href={`/admin/marketing/segmentos/${s.id}`}
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                    {describeCriteria(s.criteria).join(" · ")}
                  </td>
                  <td className="p-3">{counts[i]?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          {profiles.length} clientes en total. Los segmentos se recalculan siempre en vivo.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Campañas</h2>
          <Link
            href="/admin/marketing/campanas/nuevo"
            className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-sm font-medium leading-9 text-white"
          >
            Nueva campaña
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <tr>
                <th className="p-3">Campaña</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Destinatarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[var(--color-ink-soft)]">
                    Sin campañas. Prepara emails, códigos promocionales, recuperación de antiguos
                    clientes o promociones cruzadas mar ↔ nieve.
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--accent-50)]">
                  <td className="p-3">
                    <Link
                      className="font-medium text-[var(--accent-700)] hover:underline"
                      href={`/admin/marketing/campanas/${c.id}`}
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3 text-xs">{c.channel}</td>
                  <td className="p-3 text-xs">{CAMPAIGN_STATUS_LABEL[c.status]}</td>
                  <td className="p-3">{c.recipientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          El envío masivo de emails/WhatsApp está <strong>implementado como flujo</strong> pero
          <strong> aún no configurado</strong>: puedes crear, segmentar y preparar campañas y
          exportar los contactos; el envío real requiere activar el proveedor.
        </p>
      </section>
    </div>
  );
}
