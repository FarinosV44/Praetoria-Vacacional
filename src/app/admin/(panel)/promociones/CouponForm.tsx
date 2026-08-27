"use client";

import { useActionState } from "react";
import type { PropertyContent } from "@/domains/properties/types";
import type { Coupon } from "@/domains/pricing/coupons";

type Result = { ok: true } | { ok: false; error: string } | null;

export function CouponForm({
  properties,
  action,
  coupon,
}: {
  properties: readonly PropertyContent[];
  action: (prev: unknown, fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
  coupon?: Coupon;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  const F = ({
    label,
    name,
    type = "text",
    defaultValue,
    placeholder,
  }: {
    label: string;
    name: string;
    type?: string;
    defaultValue?: string | number;
    placeholder?: string;
  }) => (
    <label className="text-xs">
      <span className="mb-1 block text-[var(--color-ink-soft)]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        step="any"
        className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
      />
    </label>
  );

  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-3">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <F label="Código" name="code" defaultValue={coupon?.code} placeholder="VERANO25" />
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Tipo</span>
        <select
          name="kind"
          defaultValue={coupon?.kind ?? "percent"}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          <option value="percent">Porcentaje (%)</option>
          <option value="fixed">Importe fijo (€)</option>
        </select>
      </label>
      <F
        label="Valor (% o €)"
        name="value"
        type="number"
        defaultValue={coupon ? (coupon.kind === "fixed" ? coupon.value / 100 : coupon.value) : ""}
      />

      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Alojamiento</span>
        <select
          name="propertySlug"
          defaultValue={coupon?.propertySlug ?? "all"}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          <option value="all">Todas</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <F label="Desde" name="startsOn" type="date" defaultValue={coupon?.startsOn ?? ""} />
      <F label="Hasta" name="endsOn" type="date" defaultValue={coupon?.endsOn ?? ""} />

      <F label="Estancia mínima (noches)" name="minNights" type="number" defaultValue={coupon?.minNights ?? 0} />
      <F
        label="Importe mínimo (€)"
        name="minTotalEuros"
        type="number"
        defaultValue={coupon ? coupon.minTotalCents / 100 : 0}
      />
      <F label="Usos totales máx." name="maxUses" type="number" defaultValue={coupon?.maxUses ?? ""} />
      <F label="Usos máx. por email" name="maxUsesPerEmail" type="number" defaultValue={coupon?.maxUsesPerEmail ?? ""} />
      <F label="Descripción (interna)" name="description" defaultValue={coupon?.description ?? ""} />
      <label className="flex items-end gap-2 text-xs">
        <input type="checkbox" name="active" value="true" defaultChecked={coupon?.active ?? true} />
        <span>Activo</span>
      </label>

      <div className="sm:col-span-3">
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
        <button
          className="mt-1 h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
          disabled={pending}
        >
          {pending ? "Guardando…" : coupon ? "Actualizar código" : "Crear código"}
        </button>
      </div>
    </form>
  );
}
