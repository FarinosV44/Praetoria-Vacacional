import { getRepository } from "@/lib/repository";
import { leadStatusAction } from "@/domains/tramites/actions/admin";
import type { TramitesLead } from "@/domains/tramites/actions/funnel";
import { fmtDateTime } from "@/components/tramites/ui";
import { TramitesTabs } from "../tabs";

export const metadata = { title: "Prealtas de trámites" };
export const dynamic = "force-dynamic";

const STATUS: { value: TramitesLead["status"]; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "alta", label: "Dado de alta" },
  { value: "descartado", label: "Descartado" },
];

export default async function PrealtasPage() {
  const rows = await getRepository()
    .listContentOverrides("lead:tramites:")
    .catch(() => []);
  const leads = rows
    .map((r) => r.value as TramitesLead)
    .filter((l) => l && typeof l.id === "string")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Prealtas</h1>
      <TramitesTabs current="solicitudes" />
      <p className="admin-muted text-sm">
        Propietarios que dejaron sus datos mientras la contratación online está desactivada. No hay
        pago ni cuenta creada: llámales y, si encaja, invítales a darse de alta cuando se active.
      </p>
      {leads.length === 0 ? (
        <p className="admin-card admin-muted p-6 text-sm">Todavía no hay prealtas.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id} className="admin-card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="admin-muted">
                    {l.municipality} · {l.properties} vivienda(s) · {fmtDateTime(l.createdAt)}
                  </p>
                  <p className="mt-1">
                    <a className="underline" href={`tel:${l.phone.replace(/\s+/g, "")}`}>
                      {l.phone}
                    </a>{" "}
                    ·{" "}
                    <a className="underline" href={`mailto:${l.email}`}>
                      {l.email}
                    </a>
                  </p>
                  {l.services && <p className="mt-1">Le interesa: {l.services}</p>}
                  {l.message && <p className="admin-muted mt-1 whitespace-pre-line">{l.message}</p>}
                </div>
                <form action={leadStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select
                    name="status"
                    defaultValue={l.status}
                    className="rounded-md border border-[var(--a-line)] px-2 py-1.5"
                    aria-label={`Estado de ${l.name}`}
                  >
                    {STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="admin-btn" data-variant="outline" type="submit">
                    Guardar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
