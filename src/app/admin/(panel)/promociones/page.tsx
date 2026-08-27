import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { formatMoney } from "@/lib/format";
import { saveCouponAction, toggleCouponAction, deleteCouponAction } from "@/domains/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { CouponForm } from "./CouponForm";

export const metadata = { title: "Promociones" };

export default async function AdminPromosPage() {
  const repo = getRepository();
  const coupons = await repo.listCoupons();
  const properties = getAllProperties();
  const usageEntries = await Promise.all(
    coupons.map(async (c) => [c.id, await repo.couponRedemptions(c.id)] as const),
  );
  const usage = new Map(usageEntries);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl">Promociones y códigos de descuento</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Los códigos se validan en el servidor. El importe que se envía a Stripe siempre es el total
        final ya descontado. Nunca crees descuentos falsos permanentes.
      </p>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Crear código</h2>
        <CouponForm properties={properties} action={saveCouponAction} />
      </section>

      <div className="space-y-4">
        {coupons.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Todavía no hay promociones.</p>
        )}
        {coupons.map((c) => {
          const uses = usage.get(c.id) ?? [];
          return (
            <section
              key={c.id}
              className={`rounded-xl border p-5 ${c.active ? "border-[var(--color-line)] bg-white" : "border-[var(--color-line)] bg-[var(--color-paper)] opacity-70"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-lg font-semibold">{c.code}</span>
                  <span className="ml-2 text-sm text-[var(--color-ink-soft)]">
                    {c.kind === "percent" ? `−${c.value} %` : `−${formatMoney(c.value)}`}
                    {c.propertySlug ? ` · solo ${c.propertySlug}` : " · todas"}
                    {c.startsOn || c.endsOn ? ` · ${c.startsOn ?? "…"} → ${c.endsOn ?? "…"}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleCouponAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={String(c.active)} />
                    <button className="rounded-full px-3 py-1 text-xs ring-1 ring-[var(--color-line)]">
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmSubmit message={`¿Eliminar el código ${c.code}?`}>Eliminar</ConfirmSubmit>
                  </form>
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                Usos: {c.usesCount}
                {c.maxUses ? ` / ${c.maxUses}` : ""}
                {c.minNights ? ` · mín. ${c.minNights} noches` : ""}
                {c.minTotalCents ? ` · mín. ${formatMoney(c.minTotalCents)}` : ""}
                {c.maxUsesPerEmail ? ` · máx. ${c.maxUsesPerEmail}/email` : ""}
                {c.description ? ` · ${c.description}` : ""}
              </p>
              {uses.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-[var(--accent-700)]">
                    {uses.length} reserva(s) con este código
                  </summary>
                  <ul className="mt-1 space-y-0.5">
                    {uses.map((u, i) => (
                      <li key={i} className="font-mono">
                        {u.reservationCode} · −{formatMoney(u.discountCents)} ·{" "}
                        {new Date(u.createdAt).toLocaleDateString("es-ES")}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-[var(--accent-700)]">Editar</summary>
                <CouponForm properties={properties} action={saveCouponAction} coupon={c} />
              </details>
            </section>
          );
        })}
      </div>
    </div>
  );
}
