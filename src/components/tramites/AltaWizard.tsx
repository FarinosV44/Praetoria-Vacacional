"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Catalog } from "@/domains/tramites/catalog";
import { buildQuote } from "@/domains/tramites/pricing";
import { submitEngagementAction, type FunnelResult } from "@/domains/tramites/actions/funnel";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

/**
 * Alta online (#175). El precio que se ve aquí es una vista previa calculada
 * con el mismo tarificador y catálogo que usa el servidor; al enviar, el
 * servidor lo vuelve a calcular y es ese el que se guarda y se cobra.
 */

type Tri = "si" | "no" | "no_se";
interface PropForm {
  alias: string;
  street: string;
  postalCode: string;
  municipality: string;
  province: string;
  hasTourismRegistry: Tri;
  tourismRegistryNumber: string;
  hasSesAlta: Tri;
  platforms: string[];
  wantsSesAlta: boolean;
}

const emptyProp = (): PropForm => ({
  alias: "",
  street: "",
  postalCode: "",
  municipality: "",
  province: "",
  hasTourismRegistry: "si",
  tourismRegistryNumber: "",
  hasSesAlta: "no_se",
  platforms: [],
  wantsSesAlta: true,
});

const PLATFORMS = [
  { v: "booking", l: "Booking" },
  { v: "airbnb", l: "Airbnb" },
  { v: "vrbo", l: "Vrbo" },
  { v: "directa", l: "Reserva directa" },
];

const STEPS = ["Plan", "Viviendas", "Servicios", "Tus datos", "Confirmar"] as const;

export function AltaWizard({ catalog, loggedIn }: { catalog: Catalog; loggedIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [planCode, setPlan] = useState<"por_uso" | "gestion_continua">("por_uso");
  const [props, setProps] = useState<PropForm[]>([emptyProp()]);
  const [credits, setCredits] = useState(2);
  const [historical, setHistorical] = useState(false);
  const [historicalNotes, setHistoricalNotes] = useState("");
  const [owner, setOwner] = useState({
    kind: "particular" as "particular" | "empresa",
    legalName: "",
    taxId: "",
    contactName: "",
    email: "",
    phone: "",
    billingAddress: "",
  });
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState({ terms: false, privacy: false, mandate: false, marketing: false });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FunnelResult | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => track("lead_start", { page: "alta-tramites" }), []);

  const plan = catalog.plans.find((p) => p.code === planCode)!;
  const ses = catalog.services.find((s) => s.code === "ses_alta");
  const reserva = catalog.services.find((s) => s.code === "comunicacion_reserva");
  const revision = catalog.services.find((s) => s.code === "revision_historica");

  const quote = useMemo(
    () =>
      buildQuote(catalog, {
        planCode,
        properties: props.map((p, i) => ({ propertyId: `#${i}`, alias: p.alias || `Vivienda ${i + 1}`, sesAlta: p.wantsSesAlta })),
        reservationCredits: credits,
        historicalReview: historical,
      }),
    [catalog, planCode, props, credits, historical],
  );

  const setProp = (i: number, patch: Partial<PropForm>) =>
    setProps((cur) => cur.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  function validateStep(s: number): string | null {
    if (s === 0 && !plan.purchasable) return "Este plan todavía no se puede contratar. Elige «Por uso».";
    if (s === 1) {
      for (const [i, p] of props.entries()) {
        const n = `Vivienda ${i + 1}`;
        if (!p.alias.trim()) return `${n}: ponle un nombre corto.`;
        if (p.street.trim().length < 4) return `${n}: indica la dirección.`;
        if (!/^\d{5}$/.test(p.postalCode.trim())) return `${n}: el código postal tiene 5 cifras.`;
        if (p.municipality.trim().length < 2 || p.province.trim().length < 2) return `${n}: indica municipio y provincia.`;
      }
    }
    if (s === 2 && !quote.ok) return quote.errors[0] ?? "Elige al menos un servicio.";
    if (s === 3) {
      if (owner.legalName.trim().length < 2) return "Indica el nombre completo o la razón social.";
      if (!/^[A-Za-z0-9]{8,10}$/.test(owner.taxId.trim())) return "El NIF, NIE o CIF no tiene un formato válido.";
      if (owner.contactName.trim().length < 2) return "Indica una persona de contacto.";
      if (!/^\S+@\S+\.\S+$/.test(owner.email.trim())) return "El correo no es válido.";
      if (!/^\+?[\d\s]{9,16}$/.test(owner.phone.trim())) return "Indica un teléfono válido.";
      if (owner.billingAddress.trim().length < 6) return "Indica la dirección de facturación.";
      if (!loggedIn) {
        if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
          return "La contraseña necesita al menos 10 caracteres, letras y un número.";
      }
    }
    if (s === 4 && !(accept.terms && accept.privacy && accept.mandate))
      return "Para continuar tienes que aceptar las condiciones, el tratamiento de datos y la autorización.";
    return null;
  }

  function next() {
    const e = validateStep(step);
    setError(e);
    if (e) return;
    if (step === 0) track("plan_selected", { plan: planCode });
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    start(async () => {
      const r = await submitEngagementAction({
        planCode,
        properties: props.map((p) => ({ ...p, postalCode: p.postalCode.trim() })),
        reservationCredits: credits,
        historicalReview: historical,
        historicalNotes,
        owner,
        password,
        acceptTerms: accept.terms,
        acceptPrivacy: accept.privacy,
        acceptMandate: accept.mandate,
        marketingOptIn: accept.marketing,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      track("signup_complete", { plan: planCode, properties: props.length });
      if (r.next === "pagar") {
        router.push(`/mi-cuenta/tramites/pagos/${r.orderId}`);
        return;
      }
      setResult(r);
    });
  }

  if (result?.ok && result.next !== "pagar") {
    return (
      <div className="pv-card p-6 sm:p-8" role="status">
        {result.next === "verificar" ? (
          <>
            <h2 className="text-xl font-semibold">Revisa tu correo</h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Te hemos enviado un enlace a <strong>{owner.email}</strong> para confirmar tu correo. Al confirmarlo entrarás en tu carpeta
              y podrás revisar el encargo y pagarlo. Si no lo ves, mira en la carpeta de correo no deseado.
            </p>
            {result.demoVerifyUrl && (
              <p className="pv-note pv-note--warn mt-5">
                Modo demostración: el correo no se envía de verdad.{" "}
                <a className="font-semibold underline" href={result.demoVerifyUrl}>
                  Confirmar correo ahora
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Solicitud recibida</h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Estudiaremos tu caso y te enviaremos un presupuesto a tu carpeta antes de empezar. No se ha cobrado nada.
            </p>
            <p className="mt-5">
              <Link href="/mi-cuenta/tramites" className="pv-btn pv-btn--ink">
                Ir a mi carpeta
              </Link>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <ol className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Pasos del alta">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} className={i === step ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}>
              <span className="tabular-nums">{i + 1}.</span> {s}
            </li>
          ))}
        </ol>

        <div className="pv-card p-5 sm:p-7">
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-semibold">¿Cómo quieres contratar?</legend>
              <div className="mt-5 grid gap-3">
                {catalog.plans.filter((p) => p.visible).map((p) => (
                  <label
                    key={p.code}
                    className={`block rounded-[var(--radius-md)] border p-4 ${planCode === p.code ? "border-[var(--color-ink)]" : "border-[var(--color-line)]"} ${p.purchasable ? "cursor-pointer" : "opacity-70"}`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={p.code}
                        checked={planCode === p.code}
                        disabled={!p.purchasable}
                        onChange={() => setPlan(p.code)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-semibold">{p.name}</span>
                        {!p.purchasable && <span className="pv-chip ml-2 align-middle">Próximamente</span>}
                        <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">{p.short}</span>
                        <span className="mt-2 block text-sm">
                          {p.monthlyFeeCents > 0
                            ? `${formatMoney(p.monthlyFeeCents)} al mes por vivienda + IVA · ${p.includedReservationsPerMonth} reservas incluidas · extra ${formatMoney(p.reservationCents)} + IVA`
                            : `Sin cuota · ${formatMoney(p.reservationCents)} + IVA por reserva`}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <h2 className="text-lg font-semibold">Tus viviendas</h2>
              {props.map((p, i) => (
                <fieldset key={i} className="space-y-4 border-t border-[var(--color-line)] pt-5 first-of-type:border-0 first-of-type:pt-0">
                  <legend className="sr-only">Vivienda {i + 1}</legend>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Vivienda {i + 1}</p>
                    {props.length > 1 && (
                      <button type="button" className="text-sm underline" onClick={() => setProps(props.filter((_, j) => j !== i))}>
                        Quitar
                      </button>
                    )}
                  </div>
                  <Field label="Nombre corto" hint="Para reconocerla en tu carpeta, p. ej. «Ático Cullera».">
                    <input className="pv-input" value={p.alias} maxLength={80} onChange={(e) => setProp(i, { alias: e.target.value })} />
                  </Field>
                  <Field label="Dirección">
                    <input className="pv-input" value={p.street} autoComplete="street-address" onChange={(e) => setProp(i, { street: e.target.value })} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Código postal">
                      <input className="pv-input" inputMode="numeric" value={p.postalCode} maxLength={5} onChange={(e) => setProp(i, { postalCode: e.target.value })} />
                    </Field>
                    <Field label="Municipio">
                      <input className="pv-input" value={p.municipality} onChange={(e) => setProp(i, { municipality: e.target.value })} />
                    </Field>
                    <Field label="Provincia">
                      <input className="pv-input" value={p.province} onChange={(e) => setProp(i, { province: e.target.value })} />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="¿Tiene registro turístico autonómico?">
                      <select className="pv-select" value={p.hasTourismRegistry} onChange={(e) => setProp(i, { hasTourismRegistry: e.target.value as Tri })}>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                        <option value="no_se">No lo sé</option>
                      </select>
                    </Field>
                    {p.hasTourismRegistry === "si" && (
                      <Field label="Número de registro (opcional)">
                        <input className="pv-input" value={p.tourismRegistryNumber} maxLength={60} onChange={(e) => setProp(i, { tourismRegistryNumber: e.target.value })} />
                      </Field>
                    )}
                  </div>
                  {p.hasTourismRegistry !== "si" && (
                    <p className="pv-note pv-note--warn">
                      Sin registro turístico no se puede comercializar la vivienda. Ese trámite no forma parte de este servicio; si lo necesitas, cuéntanoslo y te orientamos.
                    </p>
                  )}
                  <Field label="¿Está dada de alta en SES.HOSPEDAJES?">
                    <select
                      className="pv-select"
                      value={p.hasSesAlta}
                      onChange={(e) => setProp(i, { hasSesAlta: e.target.value as Tri, wantsSesAlta: e.target.value !== "si" })}
                    >
                      <option value="si">Sí, ya está dada de alta</option>
                      <option value="no">No</option>
                      <option value="no_se">No lo sé</option>
                    </select>
                  </Field>
                  {ses?.enabled && p.hasSesAlta !== "si" && (
                    <label className="flex items-start gap-3 text-sm">
                      <input type="checkbox" className="mt-1" checked={p.wantsSesAlta} onChange={(e) => setProp(i, { wantsSesAlta: e.target.checked })} />
                      <span>
                        Quiero que hagáis el alta en SES.HOSPEDAJES ({formatMoney(ses.priceCents)} + IVA, una sola vez).
                      </span>
                    </label>
                  )}
                  <fieldset>
                    <legend className="pv-label">¿Dónde la anuncias?</legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {PLATFORMS.map((pl) => (
                        <label key={pl.v} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={p.platforms.includes(pl.v)}
                            onChange={(e) =>
                              setProp(i, { platforms: e.target.checked ? [...p.platforms, pl.v] : p.platforms.filter((x) => x !== pl.v) })
                            }
                          />
                          {pl.l}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </fieldset>
              ))}
              {props.length < 20 && (
                <button type="button" className="pv-btn pv-btn--ghost" onClick={() => setProps([...props, emptyProp()])}>
                  Añadir otra vivienda
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Comunicación de reservas</h2>
              {reserva?.enabled && (
                <div>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {reserva.short} Compras un saldo de reservas y cada reserva que nos comuniques consume una. Puedes ampliarlo cuando
                    quieras desde tu carpeta; no hacemos cargos automáticos.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button type="button" className="pv-btn pv-btn--ghost" aria-label="Una reserva menos" onClick={() => setCredits(Math.max(0, credits - 1))}>
                      −
                    </button>
                    <output className="min-w-16 text-center text-2xl font-semibold tabular-nums" aria-live="polite">
                      {credits}
                    </output>
                    <button type="button" className="pv-btn pv-btn--ghost" aria-label="Una reserva más" onClick={() => setCredits(Math.min(50, credits + 1))}>
                      +
                    </button>
                    <span className="text-sm text-[var(--color-ink-soft)]">
                      reservas · {formatMoney(plan.reservationCents)} + IVA cada una
                    </span>
                  </div>
                </div>
              )}
              {revision?.enabled && (
                <div className="border-t border-[var(--color-line)] pt-6">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" checked={historical} onChange={(e) => setHistorical(e.target.checked)} />
                    <span>
                      <span className="font-semibold">{revision.name}</span>
                      <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                        {revision.short} Orientativo: desde {formatMoney(revision.priceCents)} + IVA para hasta seis estancias. No se cobra ahora.
                      </span>
                    </span>
                  </label>
                  {historical && (
                    <Field label="Cuéntanos brevemente (opcional)" hint="Fechas aproximadas y número de estancias. Sin datos de los viajeros.">
                      <textarea className="pv-textarea !h-28" maxLength={1500} value={historicalNotes} onChange={(e) => setHistoricalNotes(e.target.value)} />
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Titular de la actividad</h2>
              <div className="flex gap-5 text-sm">
                {(["particular", "empresa"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input type="radio" name="kind" checked={owner.kind === k} onChange={() => setOwner({ ...owner, kind: k })} />
                    {k === "particular" ? "Particular" : "Empresa"}
                  </label>
                ))}
              </div>
              <Field label={owner.kind === "empresa" ? "Razón social" : "Nombre y apellidos"}>
                <input className="pv-input" value={owner.legalName} autoComplete={owner.kind === "empresa" ? "organization" : "name"} onChange={(e) => setOwner({ ...owner, legalName: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={owner.kind === "empresa" ? "CIF" : "NIF o NIE"}>
                  <input className="pv-input uppercase" value={owner.taxId} maxLength={10} onChange={(e) => setOwner({ ...owner, taxId: e.target.value })} />
                </Field>
                <Field label="Persona de contacto">
                  <input className="pv-input" value={owner.contactName} onChange={(e) => setOwner({ ...owner, contactName: e.target.value })} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correo electrónico">
                  <input className="pv-input" type="email" autoComplete="email" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
                </Field>
                <Field label="Teléfono">
                  <input className="pv-input" type="tel" autoComplete="tel" value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Dirección de facturación">
                <input className="pv-input" value={owner.billingAddress} onChange={(e) => setOwner({ ...owner, billingAddress: e.target.value })} />
              </Field>
              {!loggedIn && (
                <Field label="Crea una contraseña para tu carpeta" hint="Mínimo 10 caracteres, con letras y al menos un número.">
                  <input className="pv-input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Revisa y confirma</h2>
              <p className="text-sm text-[var(--color-ink-soft)]">
                Lee los documentos antes de aceptarlos. Guardamos la versión que aceptas con la fecha y la hora.
              </p>
              <Check checked={accept.terms} onChange={(v) => setAccept({ ...accept, terms: v })}>
                He leído y acepto las{" "}
                <Link href="/legal/condiciones-tramites" target="_blank" className="underline">
                  condiciones del servicio
                </Link>
                , incluidos el precio por vivienda y el ámbito del encargo.
              </Check>
              <Check checked={accept.privacy} onChange={(v) => setAccept({ ...accept, privacy: v })}>
                Acepto la{" "}
                <Link href="/legal/condiciones-tramites#privacidad" target="_blank" className="underline">
                  política de privacidad y el encargo del tratamiento
                </Link>{" "}
                de los datos de mis viajeros.
              </Check>
              <Check checked={accept.mandate} onChange={(v) => setAccept({ ...accept, mandate: v })}>
                Autorizo a Praetoria a representarme ante el Ministerio del Interior en los términos de la{" "}
                <Link href="/legal/condiciones-tramites#autorizacion" target="_blank" className="underline">
                  autorización de representación
                </Link>
                .
              </Check>
              <Check checked={accept.marketing} onChange={(v) => setAccept({ ...accept, marketing: v })}>
                Quiero recibir novedades sobre obligaciones de los alquileres turísticos (opcional).
              </Check>
              <p className="pv-note pv-note--info">
                La obligación de comunicar los datos sigue siendo del titular. Empezamos cuando el pago está confirmado y tenemos la
                documentación mínima; para cumplir los plazos tienes que avisarnos de cada reserva en cuanto se produzca.
              </p>
            </div>
          )}

          {error && (
            <p className="pv-note pv-note--error mt-5" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" className="pv-btn pv-btn--ghost" onClick={() => { setError(null); setStep(step - 1); }}>
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="pv-btn pv-btn--ink pv-btn--lg" onClick={next} disabled={pending}>
              {step < STEPS.length - 1 ? "Continuar" : pending ? "Enviando…" : quote.totalCents > 0 ? "Confirmar y continuar al pago" : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Resumen del precio">
        <div className="pv-card p-5">
          <p className="eyebrow">Resumen</p>
          <ul className="mt-3 space-y-2 text-sm">
            {quote.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{l.description}</span>
                <span className="tabular-nums">{formatMoney(l.netCents)}</span>
              </li>
            ))}
            {quote.lines.length === 0 && <li className="text-[var(--color-ink-faint)]">Todavía no has elegido servicios.</li>}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-[var(--color-line)] pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Base</dt>
              <dd className="tabular-nums">{formatMoney(quote.netCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>IVA ({quote.vatRatePercent} %)</dt>
              <dd className="tabular-nums">{formatMoney(quote.vatCents)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total a pagar hoy</dt>
              <dd className="tabular-nums">{formatMoney(quote.totalCents)}</dd>
            </div>
          </dl>
          {quote.needsManualQuote && (
            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
              Revisión de reservas anteriores: presupuesto aparte, desde {formatMoney(quote.manualQuoteFromNetCents)} + IVA.
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
            Tasas o gastos oficiales no incluidos: si alguno fuera necesario, te lo presupuestamos antes.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="pv-label">{label}</span>
      {children}
      {hint && <span className="pv-hint block">{hint}</span>}
    </label>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-1 size-4 shrink-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
