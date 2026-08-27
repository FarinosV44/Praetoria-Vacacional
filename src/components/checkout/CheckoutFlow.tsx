"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatRange, guestsLabel, nightsLabel } from "@/lib/format";
import { track } from "@/lib/analytics";

interface QuoteData {
  nights: number;
  nightlySubtotalCents: number;
  cleaningFeeCents: number;
  extraGuestFeeCents: number;
  taxCents: number;
  totalCents: number;
  lengthOfStayDiscount: { label: string; amountCents: number } | null;
}

interface Props {
  propertySlug: string;
  propertyName: string;
  experience: "ski" | "sea";
  checkIn: string;
  checkOut: string;
  guests: number;
  quote: QuoteData;
  cancellationSummary: string;
}

type Step = 1 | 2 | 3;

function useIdempotencyKey(seed: string): string {
  return useMemo(() => {
    const storageKey = `pv:idem:${seed}`;
    try {
      const existing = sessionStorage.getItem(storageKey);
      if (existing) return existing;
      const fresh = crypto.randomUUID();
      sessionStorage.setItem(storageKey, fresh);
      return fresh;
    } catch {
      return crypto.randomUUID();
    }
  }, [seed]);
}

export function CheckoutFlow(props: Props) {
  const { propertySlug, propertyName, checkIn, checkOut, guests, quote } = props;
  const [step, setStep] = useState<Step>(1);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accept, setAccept] = useState(false);

  const idempotencyKey = useIdempotencyKey(`${propertySlug}|${checkIn}|${checkOut}|${guests}`);

  useEffect(() => {
    track("select_dates", { property_slug: propertySlug, nights: quote.nights });
  }, [propertySlug, quote.nights]);

  async function createHold() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ property: propertySlug, checkIn, checkOut, guests, idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo continuar");
        return false;
      }
      setReservationId(data.reservationId);
      setCode(data.code);
      return true;
    } catch {
      setError("Problema de conexión");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function goToDetails() {
    const ok = reservationId ? true : await createHold();
    if (ok) setStep(2);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!reservationId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId,
          fullName,
          email,
          phone: phone || undefined,
          acceptTerms: accept,
          notes: undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.fields
            ? Object.values(data.fields).flat().join(" · ")
            : (data.error ?? "Revisa los datos"),
        );
        return;
      }
      setStep(3);
    } catch {
      setError("Problema de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!reservationId) return;
    setBusy(true);
    setError(null);
    track("payment_started", { property_slug: propertySlug });
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Problema de conexión");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <ol className="mb-6 flex items-center gap-2 text-sm">
          {(["Fechas", "Tus datos", "Pago"] as const).map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    active
                      ? "bg-[var(--accent-600)] text-white"
                      : done
                        ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                        : "bg-[var(--color-line)] text-[var(--color-ink-soft)]"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span className={active ? "font-medium" : "text-[var(--color-ink-soft)]"}>{label}</span>
                {i < 2 && <span aria-hidden className="text-[var(--color-line)]">—</span>}
              </li>
            );
          })}
        </ol>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
            {error.includes("disponible") && (
              <>
                {" "}
                <Link href={`/${propertySlug}`} className="underline">
                  Elegir otras fechas
                </Link>
              </>
            )}
          </p>
        )}

        {step === 1 && (
          <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-display text-xl">Confirma tu escapada</h2>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              {propertyName} · {formatRange(checkIn, checkOut)} · {nightsLabel(quote.nights)} ·{" "}
              {guestsLabel(guests)}
            </p>
            <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
              ¿Necesitas cambiar algo?{" "}
              <Link href={`/${propertySlug}`} className="underline">
                Volver al alojamiento
              </Link>
            </p>
            <Button className="mt-5 w-full" size="lg" disabled={busy} onClick={goToDetails}>
              {busy ? "Un momento…" : "Continuar"}
            </Button>
          </section>
        )}

        {step === 2 && (
          <form onSubmit={submitDetails} className="rounded-xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-display text-xl">Tus datos de contacto</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              No necesitas crear ninguna cuenta.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Nombre y apellidos" value={fullName} onChange={setFullName} required autoComplete="name" />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
                autoComplete="email"
              />
              <Field
                label="Teléfono (opcional)"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  He leído y acepto las{" "}
                  <Link href="/legal/condiciones-reserva" target="_blank" className="underline">
                    condiciones de reserva
                  </Link>{" "}
                  y la{" "}
                  <Link href="/legal/privacidad" target="_blank" className="underline">
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={busy || !accept}>
                {busy ? "Guardando…" : "Ir al pago"}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-display text-xl">Pago seguro</h2>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              El cobro se procesa con Stripe. Los datos de tu tarjeta no pasan por nuestros
              servidores. La reserva se confirma automáticamente cuando el pago se completa.
            </p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              {props.cancellationSummary}
            </p>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button className="flex-1" size="lg" disabled={busy} onClick={pay}>
                {busy ? "Redirigiendo…" : `Pagar ${formatMoney(quote.totalCents)}`}
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Persistent summary — never lost on back (issues #23, #30) */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-5">
          <p className="font-display text-lg">{propertyName}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {formatRange(checkIn, checkOut)} · {nightsLabel(quote.nights)} · {guestsLabel(guests)}
          </p>
          {code && (
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">Localizador provisional: {code}</p>
          )}
          <dl className="mt-4 space-y-1 text-sm">
            <Line label={`Alojamiento · ${nightsLabel(quote.nights)}`} value={formatMoney(quote.nightlySubtotalCents)} />
            {quote.lengthOfStayDiscount && (
              <Line
                label={quote.lengthOfStayDiscount.label}
                value={`− ${formatMoney(quote.lengthOfStayDiscount.amountCents)}`}
              />
            )}
            {quote.extraGuestFeeCents > 0 && (
              <Line label="Huéspedes adicionales" value={formatMoney(quote.extraGuestFeeCents)} />
            )}
            <Line label="Limpieza" value={formatMoney(quote.cleaningFeeCents)} />
            {quote.taxCents > 0 && <Line label="Impuestos" value={formatMoney(quote.taxCents)} />}
          </dl>
          <div className="mt-3 flex justify-between border-t border-[var(--color-line)] pt-3 font-semibold">
            <span>Total</span>
            <span>{formatMoney(quote.totalCents)}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Precio final. Sin comisiones de intermediarios.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--color-ink-soft)]">
      <dt>{label}</dt>
      <dd className="text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{label}</span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-[var(--color-line)] px-3 text-base"
      />
    </label>
  );
}
