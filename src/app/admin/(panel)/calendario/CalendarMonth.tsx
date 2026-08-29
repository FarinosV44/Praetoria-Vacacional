"use client";

import { useActionState, useState } from "react";
import type { CalendarCell } from "@/domains/calendar/month";
import { CHANNEL_COLOR } from "@/domains/calendar/month";
import {
  applyDayPriceAction,
  applyDayMinNightsAction,
  clearDayRatesAction,
  closeDatesAction,
  openDatesAction,
} from "@/domains/calendar/actions";

type Result = { ok: true } | { ok: false; error: string } | null;

const money = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function CalendarMonth({
  propertySlug,
  propertyName,
  weeks,
}: {
  propertySlug: string;
  propertyName: string;
  weeks: CalendarCell[][];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const dates = [...selected].sort();

  const toggle = (date: string, selectable: boolean) => {
    if (!selectable) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };
  const selectWeek = (week: CalendarCell[]) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of week) if (c.inMonth && !c.past) next.add(c.date);
      return next;
    });

  const [priceState, priceAction, pricePending] = useActionState<Result, FormData>(
    (_p, fd) => applyDayPriceAction(_p, fd),
    null,
  );
  const [minState, minAction, minPending] = useActionState<Result, FormData>(
    (_p, fd) => applyDayMinNightsAction(_p, fd),
    null,
  );
  const [closeState, closeAction, closePending] = useActionState<Result, FormData>(
    (_p, fd) => closeDatesAction(_p, fd),
    null,
  );

  const hidden = (
    <>
      <input type="hidden" name="propertySlug" value={propertySlug} />
      {dates.map((d) => (
        <input key={d} type="hidden" name="date" value={d} />
      ))}
    </>
  );

  return (
    <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg">{propertyName}</h2>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-[var(--accent-700)] hover:underline"
          >
            Limpiar selección ({selected.size})
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-ink-soft)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((c) => {
              const selectable = c.inMonth && !c.past;
              const isSel = selected.has(c.date);
              const busy = c.reservation ?? c.block;
              const color = c.reservation
                ? CHANNEL_COLOR[c.reservation.source]
                : c.block
                  ? CHANNEL_COLOR.manual
                  : undefined;
              return (
                <button
                  type="button"
                  key={c.date}
                  onClick={() => toggle(c.date, selectable)}
                  disabled={!selectable}
                  aria-pressed={isSel}
                  className={`min-h-[62px] rounded-lg border p-1 text-left text-[11px] transition ${
                    !c.inMonth
                      ? "border-transparent text-[var(--color-ink-soft)] opacity-40"
                      : c.past
                        ? "border-[var(--color-line)] opacity-50"
                        : isSel
                          ? "border-[var(--accent-600)] bg-[var(--accent-50)]"
                          : "border-[var(--color-line)] hover:border-[var(--accent-400)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.day}</span>
                    {c.overridePrice && (
                      <span title="Precio ajustado" className="text-[var(--accent-700)]">
                        ●
                      </span>
                    )}
                  </div>
                  <div className={c.overridePrice ? "font-semibold text-[var(--accent-700)]" : ""}>
                    {money(c.priceCents)}
                  </div>
                  {c.overrideMinNights && <div>mín {c.overrideMinNights}</div>}
                  {busy && (
                    <div
                      className="mt-0.5 truncate rounded px-1 text-white"
                      style={{ background: color ?? "#64748b" }}
                    >
                      {c.reservation
                        ? `${c.reservation.source}`
                        : c.block?.source === "manual"
                          ? "cerrado"
                          : c.block?.source}
                    </div>
                  )}
                </button>
              );
            })}
            <div className="col-span-7 -mt-1 hidden">{/* spacer */}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {weeks.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => selectWeek(w)}
            className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-ink-soft)] hover:border-[var(--accent-400)]"
          >
            Semana {i + 1}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-3 text-sm">
          <p className="font-medium">{selected.size} día(s) seleccionados</p>

          <form action={priceAction} className="flex flex-wrap items-end gap-2">
            {hidden}
            <label className="text-xs">
              <span className="mb-1 block text-[var(--color-ink-soft)]">Precio por noche (€)</span>
              <input
                name="priceEuros"
                inputMode="decimal"
                required
                className="h-9 w-32 rounded-lg border border-[var(--color-line)] px-2"
              />
            </label>
            <button
              className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-white"
              disabled={pricePending}
            >
              Aplicar precio
            </button>
            {priceState && !priceState.ok && (
              <span className="text-red-600">{priceState.error}</span>
            )}
          </form>

          <form action={minAction} className="flex flex-wrap items-end gap-2">
            {hidden}
            <label className="text-xs">
              <span className="mb-1 block text-[var(--color-ink-soft)]">Estancia mínima (noches)</span>
              <input
                name="minNights"
                type="number"
                min={1}
                required
                className="h-9 w-32 rounded-lg border border-[var(--color-line)] px-2"
              />
            </label>
            <button
              className="h-9 rounded-lg bg-[var(--accent-600)] px-3 text-white"
              disabled={minPending}
            >
              Aplicar estancia mínima
            </button>
            {minState && !minState.ok && <span className="text-red-600">{minState.error}</span>}
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={clearDayRatesAction}>
              {hidden}
              <button className="h-9 rounded-lg border border-[var(--color-line)] bg-white px-3">
                Quitar ajustes de precio/estancia
              </button>
            </form>
            <form action={closeAction}>
              {hidden}
              <button
                className="h-9 rounded-lg border border-[var(--color-line)] bg-white px-3"
                disabled={closePending}
              >
                Cerrar fechas
              </button>
              {closeState && !closeState.ok && (
                <span className="ml-2 text-red-600">{closeState.error}</span>
              )}
            </form>
            <form action={openDatesAction}>
              {hidden}
              <button className="h-9 rounded-lg border border-[var(--color-line)] bg-white px-3">
                Abrir fechas (quitar cierres)
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
