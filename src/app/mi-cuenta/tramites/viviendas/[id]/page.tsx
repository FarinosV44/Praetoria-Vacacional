import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/domains/tramites/context";
import { ownerGet } from "@/domains/tramites/service";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { PropertyEditForm, UploadForm } from "@/components/tramites/portal-forms";
import { DOC_KIND_LABEL, EmptyState, OwnerStatusBadge, fmtDate, fmtDateTime } from "@/components/tramites/ui";

export const metadata = { title: "Vivienda" };
export const dynamic = "force-dynamic";

export default async function ViviendaPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwner();
  const { id } = await params;
  const p = await ownerGet(ctx, (s) => s.getProperty(id));
  if (!p) notFound();
  const snap = await portalSnapshot(ctx);
  const filings = snap.filings.filter((f) => f.propertyId === p.id);
  const docs = snap.documents.filter((d) => d.propertyId === p.id);
  const reports = snap.reports.filter((r) => r.propertyId === p.id);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/mi-cuenta/tramites/viviendas" className="text-sm underline">
          ← Viviendas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{p.alias}</h1>
        <p className="text-[var(--color-ink-soft)]">
          {p.street}, {p.postalCode} {p.municipality} ({p.province})
        </p>
        <p className="mt-4">
          <Link href={`/mi-cuenta/tramites/reservas/nueva?vivienda=${p.id}`} className="pv-btn pv-btn--ink">
            Comunicar una reserva de esta vivienda
          </Link>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="t-h">
          <h2 id="t-h" className="text-lg font-semibold">Trámites</h2>
          {filings.length === 0 ? (
            <EmptyState>Sin trámites todavía.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
              {filings.map((f) => (
                <li key={f.id}>
                  <Link href={`/mi-cuenta/tramites/expedientes/${f.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-[var(--color-paper)]">
                    <span>
                      <span className="font-medium">{f.title}</span>
                      <span className="block text-xs text-[var(--color-ink-faint)]">{f.reference} · {fmtDateTime(f.updatedAt)}</span>
                    </span>
                    <OwnerStatusBadge status={f.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-8 text-lg font-semibold">Reservas comunicadas</h2>
          {reports.length === 0 ? (
            <EmptyState>Todavía no nos has comunicado reservas de esta vivienda.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white text-sm">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link href={`/mi-cuenta/tramites/reservas/${r.id}`} className="flex justify-between gap-3 p-3 hover:bg-[var(--color-paper)]">
                    <span>
                      {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {r.travellers} viajeros
                    </span>
                    <span className="text-[var(--color-ink-soft)]">{r.cancelledAt ? "Anulada" : r.channel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="d-h" className="space-y-6">
          <div className="pv-card p-5">
            <h2 id="d-h" className="font-semibold">Datos de la vivienda</h2>
            <div className="mt-4">
              <PropertyEditForm p={p} />
            </div>
          </div>
          <div className="pv-card p-5">
            <h2 className="font-semibold">Documentos de esta vivienda</h2>
            {docs.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex justify-between gap-3">
                    <a className="underline" href={`/mi-cuenta/tramites/documentos/${d.id}`}>
                      {DOC_KIND_LABEL[d.kind]}
                    </a>
                    <span className="text-[var(--color-ink-faint)]">{fmtDate(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <UploadForm propertyId={p.id} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
