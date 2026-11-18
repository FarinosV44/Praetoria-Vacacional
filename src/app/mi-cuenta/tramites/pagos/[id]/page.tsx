import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/domains/tramites/context";
import { ownerGet } from "@/domains/tramites/service";
import { payOrderAction } from "@/domains/tramites/actions/portal";
import { PayButton } from "@/components/tramites/forms";
import { fmtDateTime } from "@/components/tramites/ui";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Pedido" };
export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const { id } = await params;
  const o = await ownerGet(ctx, (s) => s.getOrder(id));
  if (!o) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/mi-cuenta/tramites/pagos" className="text-sm underline">
        ← Pagos
      </Link>
      <h1 className="text-2xl font-semibold">Pedido {o.reference}</h1>
      <div className="pv-card p-5">
        <ul className="space-y-2 text-sm">
          {o.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{l.description}</span>
              <span className="tabular-nums">{formatMoney(l.netCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-[var(--color-line)] pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Base</dt>
            <dd className="tabular-nums">{formatMoney(o.netCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>IVA ({o.vatRatePercent} %)</dt>
            <dd className="tabular-nums">{formatMoney(o.vatCents)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(o.totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[var(--color-ink-faint)]">
          Tarifa {o.catalogVersion}. Condiciones aceptadas el {fmtDateTime(o.acceptance.acceptedAt)} (versión {o.acceptance.termsVersion}).
          Tasas o gastos oficiales no incluidos.
        </p>
      </div>
      {o.status === "pendiente_pago" && (
        <form action={payOrderAction}>
          <input type="hidden" name="orderId" value={o.id} />
          <PayButton label={`Pagar ${formatMoney(o.totalCents)} con tarjeta`} />
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Pago seguro con Stripe. No guardamos los datos de tu tarjeta.</p>
        </form>
      )}
      {o.status === "pagado" && <p className="pv-note pv-note--info">Pagado el {fmtDateTime(o.paidAt)}.</p>}
    </div>
  );
}
