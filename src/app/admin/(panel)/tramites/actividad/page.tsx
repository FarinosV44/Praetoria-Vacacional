import Link from "next/link";
import { serverStore } from "@/domains/tramites/repo";
import { fmtDateTime } from "@/components/tramites/ui";
import { TramitesTabs } from "../tabs";

export const metadata = { title: "Auditoría de trámites" };
export const dynamic = "force-dynamic";

export default async function TramitesAudit() {
  const rows = await serverStore().listAudit({ limit: 200 });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Auditoría</h1>
      <TramitesTabs current="actividad" />
      <p className="admin-muted text-sm">
        Registro inalterable de quién hizo qué: altas, pagos, cambios de estado, descargas de
        documentos y consultas de datos de viajeros. No guarda datos personales, solo
        identificadores.
      </p>
      <div className="admin-card overflow-x-auto p-2">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Quién</th>
              <th>Acción</th>
              <th>Objeto</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap">{fmtDateTime(a.at)}</td>
                <td>
                  {a.actor.label} <span className="admin-muted">({a.actor.type})</span>
                </td>
                <td>
                  <code>{a.action}</code>
                </td>
                <td>
                  {a.accountId ? (
                    <Link className="underline" href={`/admin/tramites/clientes/${a.accountId}`}>
                      {a.targetType}
                    </Link>
                  ) : (
                    a.targetType
                  )}
                </td>
                <td className="admin-muted text-xs">
                  {Object.entries(a.meta)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-muted">
                  Sin actividad todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
