import { getActiveCatalog } from "@/domains/tramites/service";
import { getAdminContext } from "@/domains/admin/context";
import { can } from "@/domains/admin/roles";
import { saveCatalogAction } from "@/domains/tramites/actions/admin";
import { ActionForm } from "@/components/tramites/forms";
import { TramitesTabs } from "../tabs";

export const metadata = { title: "Tarifas de trámites" };
export const dynamic = "force-dynamic";

const eur = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const input = "mt-1 block w-28 rounded-md border border-[var(--a-line)] px-2 py-1.5";

export default async function TarifasPage() {
  const catalog = await getActiveCatalog();
  const ctx = await getAdminContext();
  const editable = !!ctx && can(ctx.role, "settings.write");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Tarifas de trámites</h1>
      <TramitesTabs current="tarifas" />
      <p className="admin-muted text-sm">
        Precios sin IVA. Vigente: <strong>{catalog.version}</strong> desde {catalog.effectiveFrom}.
        Cada cambio crea una versión nueva; los pedidos ya aceptados conservan su precio. La landing
        y el alta leen siempre la versión vigente.
      </p>
      {!editable && (
        <p className="pv-note pv-note--info text-sm">
          Solo un administrador puede cambiar tarifas.
        </p>
      )}

      <ActionForm
        action={saveCatalogAction}
        submitLabel="Guardar nueva versión"
        className="space-y-6"
      >
        <fieldset disabled={!editable} className="space-y-6">
          <section className="admin-card grid gap-4 p-4 sm:grid-cols-3">
            <label className="text-sm">
              Nombre de la versión
              <input
                name="version"
                required
                defaultValue=""
                placeholder={`p. ej. ${today.slice(0, 7)}-v2`}
                className={`${input} w-full`}
              />
            </label>
            <label className="text-sm">
              En vigor desde
              <input
                name="effectiveFrom"
                type="date"
                defaultValue={today}
                className={`${input} w-full`}
              />
            </label>
            <label className="text-sm">
              IVA (%)
              <input
                name="vat"
                inputMode="decimal"
                defaultValue={String(catalog.vatRatePercent)}
                className={input}
              />
            </label>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Servicios</h2>
            <ul className="mt-3 divide-y divide-[var(--a-line-soft)]">
              {catalog.services.map((s) => (
                <li
                  key={s.code}
                  className="flex flex-wrap items-end justify-between gap-4 py-3 text-sm"
                >
                  <span className="min-w-[14rem] flex-1">
                    <strong>{s.name}</strong>
                    <span className="admin-muted block text-xs">
                      {s.unit === "quote"
                        ? "Presupuesto manual · importe orientativo «desde»"
                        : s.unit === "per_property"
                          ? "Por vivienda"
                          : s.unit === "per_reservation"
                            ? "Por reserva"
                            : "Por vivienda y año"}
                      {s.note && ` · ${s.note}`}
                    </span>
                  </span>
                  <label>
                    € sin IVA
                    <input
                      name={`svc:${s.code}:price`}
                      inputMode="decimal"
                      defaultValue={eur(s.priceCents)}
                      className={input}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={`svc:${s.code}:enabled`}
                      defaultChecked={s.enabled}
                    />{" "}
                    Activo
                  </label>
                </li>
              ))}
            </ul>
            <p className="admin-muted mt-2 text-xs">
              NRUA y depósito anual siguen desactivados por la anulación del Supremo (STS 620/2026).
              Actívalos solo si una norma nueva los recupera y tras revisar los textos de la web.
            </p>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Planes</h2>
            <ul className="mt-3 divide-y divide-[var(--a-line-soft)]">
              {catalog.plans.map((p) => (
                <li
                  key={p.code}
                  className="flex flex-wrap items-end justify-between gap-4 py-3 text-sm"
                >
                  <span className="min-w-[14rem] flex-1">
                    <strong>{p.name}</strong>
                    <span className="admin-muted block text-xs">
                      {p.includedReservationsPerMonth} reservas incluidas al mes por vivienda
                    </span>
                  </span>
                  <label>
                    Cuota mensual €
                    <input
                      name={`plan:${p.code}:monthly`}
                      inputMode="decimal"
                      defaultValue={eur(p.monthlyFeeCents)}
                      className={input}
                    />
                  </label>
                  <label>
                    € por reserva
                    <input
                      name={`plan:${p.code}:reservation`}
                      inputMode="decimal"
                      defaultValue={eur(p.reservationCents)}
                      className={input}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={`plan:${p.code}:visible`}
                      defaultChecked={p.visible}
                    />{" "}
                    Visible
                  </label>
                  {p.code === "gestion_continua" ? (
                    <span className="admin-chip" data-tone="warn">
                      Contratación bloqueada hasta aprobarla
                    </span>
                  ) : (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`plan:${p.code}:purchasable`}
                        defaultChecked={p.purchasable}
                      />{" "}
                      Se puede contratar
                    </label>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </fieldset>
      </ActionForm>
    </div>
  );
}
