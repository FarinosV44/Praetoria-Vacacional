import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/domains/tramites/context";
import { ownerGet } from "@/domains/tramites/service";
import { ownerReadStore } from "@/domains/tramites/repo";
import { UploadForm } from "@/components/tramites/portal-forms";
import { DOC_KIND_HELP, DOC_KIND_LABEL, OwnerStatusBadge, fmtDate, fmtDateTime } from "@/components/tramites/ui";
import type { DocumentKind } from "@/domains/tramites/types";

export const metadata = { title: "Trámite" };
export const dynamic = "force-dynamic";

const CHANNEL: Record<string, string> = {
  ses_hospedajes_web: "SES.HOSPEDAJES (web)",
  ses_hospedajes_fichero: "SES.HOSPEDAJES (fichero)",
  registro_autonomico: "Registro autonómico",
  otro: "Otro canal",
};

export default async function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwner();
  const { id } = await params;
  const f = await ownerGet(ctx, (s) => s.getFiling(id));
  if (!f) notFound();
  const store = ownerReadStore();
  const [events, docs] = await Promise.all([store.listEvents(f.id), store.listDocuments({ accountId: f.accountId, filingId: f.id })]);
  const visible = events.filter((e) => e.visibleToOwner && e.accountId === f.accountId);
  const proofs = docs.filter((d) => d.isOfficialProof);
  const others = docs.filter((d) => !d.isOfficialProof);

  return (
    <div className="space-y-8">
      <Link href="/mi-cuenta/tramites" className="text-sm underline">
        ← Resumen
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{f.title}</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Expediente {f.reference} · abierto el {fmtDate(f.createdAt)}
            {f.dueAt && ` · límite de referencia ${fmtDateTime(f.dueAt)}`}
          </p>
        </div>
        <OwnerStatusBadge status={f.status} />
      </div>

      {f.late && (
        <p className="pv-note pv-note--warn">
          Este trámite se refiere a hechos que ya estaban fuera de plazo. Lo presentamos igualmente, pero hacerlo tarde no elimina el
          retraso anterior.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          {f.requestedDocuments.length > 0 && (
            <section aria-labelledby="faltan-h" className="rounded-[var(--radius-md)] border border-l-4 border-[var(--color-line)] border-l-[var(--color-warning)] bg-white p-5">
              <h2 id="faltan-h" className="font-semibold">Necesitamos estos documentos</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {f.requestedDocuments.map((k) => (
                  <li key={k}>
                    <span className="font-medium">{DOC_KIND_LABEL[k as DocumentKind] ?? k}</span>
                    {DOC_KIND_HELP[k as DocumentKind] && (
                      <span className="block text-[var(--color-ink-soft)]">{DOC_KIND_HELP[k as DocumentKind]}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <UploadForm filingId={f.id} suggested={f.requestedDocuments as DocumentKind[]} />
              </div>
            </section>
          )}

          <section aria-labelledby="hist-h">
            <h2 id="hist-h" className="text-lg font-semibold">Historial</h2>
            <ol className="mt-3 space-y-3 border-l border-[var(--color-line)] pl-5 text-sm">
              {visible.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full bg-[var(--color-ink-faint)]" aria-hidden />
                  <span className="block text-xs text-[var(--color-ink-faint)]">
                    {fmtDateTime(e.at)} · {e.actor.type === "owner" ? "Tú" : e.actor.type === "admin" ? "Equipo Praetoria" : "Sistema"}
                  </span>
                  {e.message ?? (e.toStatus ? `Estado: ${e.toStatus.replaceAll("_", " ")}` : "")}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="pv-card p-5" aria-labelledby="just-h">
            <h2 id="just-h" className="font-semibold">Justificantes oficiales</h2>
            {f.submittedAt && (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Presentado el {fmtDateTime(f.submittedAt)} por {CHANNEL[f.submissionChannel ?? "otro"]}
                {f.submissionRef && ` · código ${f.submissionRef}`}.
              </p>
            )}
            {proofs.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-faint)]">Aparecerán aquí cuando presentemos el trámite.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {proofs.map((d) => (
                  <li key={d.id}>
                    <a className="font-medium underline" href={`/mi-cuenta/tramites/documentos/${d.id}`}>
                      {d.filename}
                    </a>
                    <span className="block text-xs text-[var(--color-ink-faint)]">{fmtDateTime(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="pv-card p-5" aria-labelledby="docs-h">
            <h2 id="docs-h" className="font-semibold">Documentos aportados</h2>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-faint)]">Ninguno todavía.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {others.map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <a className="underline" href={`/mi-cuenta/tramites/documentos/${d.id}`}>
                      {DOC_KIND_LABEL[d.kind]}
                    </a>
                    <span className="text-xs text-[var(--color-ink-faint)]">
                      {d.status === "validado" ? "Validado" : d.status === "rechazado" ? "No válido" : "Recibido"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {f.requestedDocuments.length === 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm underline">Añadir otro documento</summary>
                <div className="mt-3">
                  <UploadForm filingId={f.id} />
                </div>
              </details>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
