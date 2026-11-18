import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { UploadForm } from "@/components/tramites/portal-forms";
import { DOC_KIND_LABEL, EmptyState, fmtDateTime } from "@/components/tramites/ui";

export const metadata = { title: "Documentos" };
export const dynamic = "force-dynamic";

const STATUS = { recibido: "Recibido", validado: "Validado", rechazado: "No válido" } as const;

export default async function DocumentosPage() {
  const ctx = await requireOwner();
  const snap = await portalSnapshot(ctx);
  const alias = new Map(snap.properties.map((p) => [p.id, p.alias]));
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="doc-h">
        <h1 id="doc-h" className="text-2xl font-semibold">Documentos</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Lo que nos has enviado y los justificantes oficiales de cada trámite. Se descargan siempre como archivo.
        </p>
        {snap.documents.length === 0 ? (
          <EmptyState>Todavía no hay documentos.</EmptyState>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white text-sm">
            {snap.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span>
                  <a className="font-medium underline" href={`/mi-cuenta/tramites/documentos/${d.id}`}>
                    {d.isOfficialProof ? `Justificante · ${d.filename}` : DOC_KIND_LABEL[d.kind]}
                  </a>
                  <span className="block text-xs text-[var(--color-ink-faint)]">
                    {d.propertyId ? alias.get(d.propertyId) : "General"} · {fmtDateTime(d.createdAt)}
                  </span>
                  {d.status === "rechazado" && d.reviewNote && <span className="block text-xs text-[var(--color-danger)]">{d.reviewNote}</span>}
                </span>
                <span className="text-xs">{d.isOfficialProof ? "Oficial" : STATUS[d.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="up-h" className="pv-card self-start p-5">
        <h2 id="up-h" className="font-semibold">Subir un documento</h2>
        <div className="mt-4">
          <UploadForm properties={snap.properties.map((p) => ({ id: p.id, alias: p.alias }))} />
        </div>
      </section>
    </div>
  );
}
