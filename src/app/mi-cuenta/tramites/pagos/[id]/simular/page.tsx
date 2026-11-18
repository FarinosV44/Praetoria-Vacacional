import { notFound, redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/env";
import { stripeEnabled } from "@/domains/payments/stripe";
import { requireOwner } from "@/domains/tramites/context";
import { ownerGet } from "@/domains/tramites/service";
import { simulatePaymentAction } from "@/domains/tramites/actions/portal";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Pago de prueba" };
export const dynamic = "force-dynamic";

/** Solo modo demo: simula la respuesta de la pasarela para probar el flujo completo. */
export default async function SimularPagoPage({ params }: { params: Promise<{ id: string }> }) {
  if (stripeEnabled || !DEMO_MODE) redirect("/mi-cuenta/tramites/pagos");
  const ctx = await requireOwner("/mi-cuenta/tramites/pagos");
  const { id } = await params;
  const o = await ownerGet(ctx, (s) => s.getOrder(id));
  if (!o) notFound();
  return (
    <div className="max-w-md space-y-5">
      <p className="pv-note pv-note--warn">Modo demostración: no hay pasarela de pago conectada y no se cobra nada.</p>
      <h1 className="text-2xl font-semibold">Pago de prueba · {formatMoney(o.totalCents)}</h1>
      <form action={simulatePaymentAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="orderId" value={o.id} />
        <button className="pv-btn pv-btn--ink" name="outcome" value="ok" type="submit">
          Simular pago correcto
        </button>
        <button className="pv-btn pv-btn--ghost" name="outcome" value="ko" type="submit">
          Simular pago rechazado
        </button>
      </form>
    </div>
  );
}
