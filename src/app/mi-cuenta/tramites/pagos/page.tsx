import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { buyCreditsAction } from "@/domains/tramites/actions/portal";
import { getActiveCatalog } from "@/domains/tramites/service";
import { planByCode, withVat } from "@/domains/tramites/catalog";
import { PayButton, TrackOnce } from "@/components/tramites/forms";
import { EmptyState, fmtDateTime } from "@/components/tramites/ui";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Pagos" };
export const dynamic = "force-dynamic";

const STATUS = {
  pendiente_verificacion: "Falta confirmar el correo",
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  solicitud_especial: "Solicitud sin cobro",
  cancelado: "Cancelado",
} as const;

export default async function PagosPage({ searchParams }: { searchParams: Promise<{ estado?: string; pedido?: string }> }) {
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const sp = await searchParams;
  const [snap, catalog] = await Promise.all([portalSnapshot(ctx), getActiveCatalog()]);
  const price = planByCode(catalog, "por_uso")?.reservationCents ?? 0;
  const paid = sp.pedido ? snap.orders.find((o) => o.reference === sp.pedido && o.status === "pagado") : undefined;
  const pendingNew = sp.pedido ? snap.orders.find((o) => o.reference === sp.pedido && o.status === "pendiente_pago") : undefined;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="p-h" className="space-y-4">
        <h1 id="p-h" className="text-2xl font-semibold">Pagos y facturas</h1>
        {sp.estado === "ok" && paid && (
          <p className="pv-note pv-note--info" role="status">
            Pago confirmado ({paid.reference}). Ya estamos con tu encargo.
            <TrackOnce event="service_order_complete" params={{ total: paid.totalCents }} />
          </p>
        )}
        {sp.estado === "ok" && !paid && (
          <p className="pv-note pv-note--info" role="status">
            Estamos confirmando el pago con el banco. En unos segundos aparecerá como pagado; puedes recargar la página.
          </p>
        )}
        {sp.estado === "cancelado" && <p className="pv-note pv-note--warn">No se ha completado el pago. Puedes intentarlo de nuevo cuando quieras.</p>}
        {sp.estado === "error" && <p className="pv-note pv-note--error">No hemos podido abrir el pago. Inténtalo de nuevo o escríbenos.</p>}
        {pendingNew && (
          <p className="pv-note pv-note--warn">
            Tienes un pedido pendiente: <Link className="underline" href={`/mi-cuenta/tramites/pagos/${pendingNew.id}`}>revísalo y págalo</Link>.
          </p>
        )}
        {snap.orders.length === 0 ? (
          <EmptyState>Todavía no hay pedidos.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white text-sm">
            {snap.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <Link href={`/mi-cuenta/tramites/pagos/${o.id}`} className="font-medium underline">
                    {o.reference}
                  </Link>
                  <span className="block text-xs text-[var(--color-ink-faint)]">
                    {fmtDateTime(o.createdAt)} · {o.lines.length} {o.lines.length === 1 ? "concepto" : "conceptos"}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold tabular-nums">{formatMoney(o.totalCents)}</span>
                  <span className="block text-xs text-[var(--color-ink-soft)]">{STATUS[o.status]}</span>
                  {o.invoiceUrl && (
                    <a href={o.invoiceUrl} target="_blank" rel="noopener" className="text-xs underline">
                      Factura
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="saldo-h" className="pv-card self-start p-5">
        <h2 id="saldo-h" className="font-semibold">Saldo de reservas</h2>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{ctx.account.reservationCredits}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">reservas disponibles · {formatMoney(price)} + IVA cada una</p>
        <form action={buyCreditsAction} className="mt-5 space-y-3">
          <label className="block">
            <span className="pv-label">Ampliar saldo</span>
            <select name="credits" className="pv-select" defaultValue="5">
              {[1, 2, 5, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "reserva" : "reservas"} · {formatMoney(withVat(price * n, catalog.vatRatePercent))} IVA incl.
                </option>
              ))}
            </select>
          </label>
          <PayButton label="Comprar saldo" />
        </form>
        <p className="mt-3 text-xs text-[var(--color-ink-faint)]">El importe exacto con IVA se calcula al pagar. El saldo no caduca.</p>
      </section>
    </div>
  );
}
