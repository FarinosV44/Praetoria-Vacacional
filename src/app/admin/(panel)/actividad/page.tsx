import { getRepository } from "@/lib/repository";
import { currentRole, ROLE_LABEL } from "@/domains/admin/roles";

export const metadata = { title: "Actividad" };

const ACTION_LABEL: Record<string, string> = {
  "reservation.cancel": "Reserva cancelada",
  "reservation.create": "Reserva creada",
  "invoice.issue": "Factura emitida",
  "invoice.void": "Factura anulada",
  "invoice.paid": "Factura marcada cobrada",
  "invoice.rectified": "Factura rectificada",
  "invoice.draft_delete": "Borrador de factura eliminado",
  "customer.merge": "Clientes fusionados",
  "coupon.delete": "Código promocional eliminado",
  "campaign.send": "Campaña enviada",
  "calendar.close_dates": "Fechas cerradas en el calendario",
};

export default async function ActividadPage() {
  const log = await getRepository().listAuditLog(300);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Registro de actividad</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Acciones críticas (cancelaciones, emisión y anulación de facturas, fusiones de clientes,
          envíos de campañas, cierres de calendario). Tu rol actual: <strong>{ROLE_LABEL[currentRole()]}</strong>.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Entidad</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {log.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin actividad registrada todavía.
                </td>
              </tr>
            )}
            {log.map((row) => (
              <tr key={row.id}>
                <td className="p-3 text-xs">{new Date(row.createdAt).toLocaleString("es-ES")}</td>
                <td className="p-3">{ACTION_LABEL[row.action] ?? row.action}</td>
                <td className="p-3 text-xs">
                  {row.entity}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="p-3 text-xs">{row.actorEmail ?? "—"}</td>
                <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                  {row.meta && Object.keys(row.meta as object).length > 0
                    ? JSON.stringify(row.meta)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
