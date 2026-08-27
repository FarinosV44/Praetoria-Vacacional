import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Pagos y emails" };

const PAY_STYLE: Record<string, string> = {
  succeeded: "bg-green-100 text-green-800",
  created: "bg-gray-100 text-gray-600",
  processing: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-600",
};
const EMAIL_STYLE: Record<string, string> = {
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-amber-100 text-amber-800",
};

export default async function AdminPagosPage() {
  const repo = getRepository();
  const [payments, reservations, emails] = await Promise.all([
    repo.listPayments(100),
    repo.listReservations({}),
    repo.listEmailLog(100),
  ]);
  const code = (rid: string) => reservations.find((r) => r.id === rid)?.code ?? "—";
  const prop = (rid: string) => {
    const r = reservations.find((x) => x.id === rid);
    return r ? (getPropertyById(r.propertyId)?.name ?? "—") : "—";
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-2xl">Pagos</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Estado e identificadores de cada intento de pago. Las reservas solo se confirman tras un
          webhook de Stripe válido.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Reserva</th>
                <th className="p-3">Alojamiento</th>
                <th className="p-3">Importe</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Proveedor / IDs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--color-ink-soft)]">
                    Sin pagos registrados.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 text-xs">{new Date(p.createdAt).toLocaleString("es-ES")}</td>
                  <td className="p-3 font-mono text-xs">{code(p.reservationId)}</td>
                  <td className="p-3">{prop(p.reservationId)}</td>
                  <td className="p-3">{formatMoney(p.amountCents)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PAY_STYLE[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-[var(--color-ink-soft)]">
                    {p.provider}
                    {p.providerPaymentIntent ? ` · pi ${p.providerPaymentIntent.slice(-10)}` : ""}
                    {p.providerCheckoutSession ? ` · cs ${p.providerCheckoutSession.slice(-8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl">Emails</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Registro de cada correo transaccional. Un fallo de email nunca invalida una reserva
          pagada; aquí se ve qué quedó pendiente para reenviarlo.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Reserva</th>
                <th className="p-3">Destinatario</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {emails.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--color-ink-soft)]">
                    Sin emails registrados.
                  </td>
                </tr>
              )}
              {emails.map((e) => (
                <tr key={e.id} className={e.status === "failed" ? "bg-red-50" : ""}>
                  <td className="p-3 text-xs">{new Date(e.createdAt).toLocaleString("es-ES")}</td>
                  <td className="p-3">{e.kind}</td>
                  <td className="p-3 font-mono text-xs">
                    {e.reservationId ? code(e.reservationId) : "—"}
                  </td>
                  <td className="p-3 text-xs">{e.recipient}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${EMAIL_STYLE[e.status] ?? ""}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                    {e.error ?? e.providerId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
