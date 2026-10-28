import { listOwnerLeads } from "@/domains/owners/store";
import { setOwnerLeadStatusAction } from "@/domains/owners/actions";
import { OWNER_LICENCE, OWNER_LOCATIONS, OWNER_ZONES, labelFor, type OwnerLeadStatus } from "@/domains/owners/types";

export const metadata = { title: "Propietarios" };
export const dynamic = "force-dynamic";

const STATUS: { value: OwnerLeadStatus; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "propuesta", label: "Propuesta enviada" },
  { value: "cerrado", label: "Cerrado (gestionamos)" },
  { value: "descartado", label: "Descartado" },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });

export default async function AdminOwnersPage() {
  const leads = await listOwnerLeads();
  const fresh = leads.filter((l) => l.status === "nuevo").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Propietarios interesados</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Solicitudes de gestión recibidas desde <code>/propietarios</code>.{" "}
          {leads.length > 0 && (
            <>
              {leads.length} en total · <strong>{fresh} sin contactar</strong>.
            </>
          )}
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-ink-soft)]">
          Todavía no hay solicitudes. Llegarán aquí, por correo y como aviso en la app móvil.
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id} className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{l.name}</p>
                  <p className="text-[var(--color-ink-soft)]">
                    {labelFor(OWNER_ZONES, l.zone)} · {labelFor(OWNER_LOCATIONS, l.location)}
                    {l.bedrooms !== null && ` · ${l.bedrooms} dorm.`}
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
                  <p className="mt-1 text-[var(--color-ink-soft)]">
                    Licencia: {labelFor(OWNER_LICENCE, l.licence)} · En plataformas: {l.onPlatforms ? "sí" : "no"} ·{" "}
                    {fmt(l.createdAt)}
                  </p>
                  {l.message && <p className="mt-2 whitespace-pre-line">{l.message}</p>}
                </div>
                <form action={setOwnerLeadStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select
                    name="status"
                    defaultValue={l.status}
                    className="h-9 rounded-lg border border-[var(--color-line)] px-2"
                    aria-label={`Estado de ${l.name}`}
                  >
                    {STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="admin-btn" type="submit">
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
