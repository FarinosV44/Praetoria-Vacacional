"use client";

import { useActionState, useMemo, useState } from "react";
import type { CalendarCell } from "@/domains/calendar/month";
import { CHANNEL_COLOR } from "@/domains/calendar/month";
import {
  applyDayPriceAction,
  applyDayPricePercentAction,
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

/** Fri (5) or Sat (6) — matches the pricing engine's weekend-night rule. */
function isWeekendDate(iso: string) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dow === 5 || dow === 6;
}

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
  const [priceMode, setPriceMode] = useState<"fixed" | "percent">("fixed");
  const [priceInput, setPriceInput] = useState("");
  const dates = useMemo(() => [...selected].sort(), [selected]);

  const cellByDate = useMemo(() => {
    const m = new Map<string, CalendarCell>();
    for (const w of weeks) for (const c of w) m.set(c.date, c);
    return m;
  }, [weeks]);

  const selectableDates = useMemo(
    () => weeks.flatMap((w) => w.filter((c) => c.inMonth && !c.past).map((c) => c.date)),
    [weeks],
  );

  const toggle = (date: string, selectable: boolean) => {
    if (!selectable) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };
  const addAll = () => setSelected(new Set(selectableDates));
  const keepOnly = (pred: (d: string) => boolean) =>
    setSelected((prev) => new Set([...prev].filter(pred)));
  const selectKind = (kind: "all" | "week" | "weekend") =>
    setSelected(
      new Set(
        selectableDates.filter((d) =>
          kind === "all" ? true : kind === "weekend" ? isWeekendDate(d) : !isWeekendDate(d),
        ),
      ),
    );

  const [priceState, priceAction, pricePending] = useActionState<Result, FormData>(
    (_p, fd) => applyDayPriceAction(_p, fd),
    null,
  );
  const [pctState, pctAction, pctPending] = useActionState<Result, FormData>(
    (_p, fd) => applyDayPricePercentAction(_p, fd),
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

  // Preview of the price change over the current selection.
  const preview = useMemo(() => {
    if (dates.length === 0) return null;
    const prices = dates.map((d) => cellByDate.get(d)?.priceCents ?? 0);
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const n = Number(priceInput.replace(",", "."));
    let next: number | null = null;
    if (priceInput.trim() !== "" && !Number.isNaN(n)) {
      next = priceMode === "fixed" ? Math.round(n * 100) : Math.round(avg * (1 + n / 100));
    }
    return { nights: dates.length, avg, next: next != null && next >= 0 ? next : null };
  }, [dates, cellByDate, priceInput, priceMode]);

  const hidden = (
    <>
      <input type="hidden" name="propertySlug" value={propertySlug} />
      {dates.map((d) => (
        <input key={d} type="hidden" name="date" value={d} />
      ))}
    </>
  );

  return (
    <section className="admin-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{propertyName}</h2>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button type="button" className="admin-btn" data-variant="outline" onClick={() => selectKind("all")}>
            Todo el mes
          </button>
          <button type="button" className="admin-btn" data-variant="outline" onClick={() => selectKind("week")}>
            Entre semana
          </button>
          <button type="button" className="admin-btn" data-variant="outline" onClick={() => selectKind("weekend")}>
            Fin de semana
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="admin-btn"
              data-variant="ghost"
            >
              Limpiar ({selected.size})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--a-text-faint)]">
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
                  data-date={c.date}
                  data-cell-state={
                    c.reservation ? "reservation" : c.block ? "block" : c.past ? "past" : "free"
                  }
                  className={`min-h-[60px] rounded-[var(--a-radius-sm)] border p-1 text-left text-[11px] transition ${
                    !c.inMonth
                      ? "border-transparent opacity-30"
                      : c.past
                        ? "border-[var(--a-line-soft)] opacity-50"
                        : isSel
                          ? "border-[var(--a-accent)] bg-[var(--a-accent-soft)]"
                          : "border-[var(--a-line)] hover:border-[var(--a-accent)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.day}</span>
                    {c.overridePrice && (
                      <span title="Precio ajustado" className="text-[var(--a-accent-strong)]">
                        ●
                      </span>
                    )}
                  </div>
                  <div className={c.overridePrice ? "font-semibold text-[var(--a-accent-strong)]" : ""}>
                    {money(c.priceCents)}
                  </div>
                  {c.overrideMinNights && <div className="admin-muted">mín {c.overrideMinNights}</div>}
                  {busy && (
                    <div
                      className="mt-0.5 truncate rounded px-1 text-white"
                      style={{ background: color ?? "#64748b" }}
                    >
                      {c.reservation
                        ? c.reservation.source
                        : c.block?.source === "manual"
                          ? "cerrado"
                          : c.block?.source}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <button type="button" onClick={addAll} className="admin-btn" data-variant="ghost">
          Seleccionar mes visible
        </button>
        {weeks.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              setSelected((prev) => {
                const next = new Set(prev);
                for (const c of w) if (c.inMonth && !c.past) next.add(c.date);
                return next;
              })
            }
            className="admin-btn"
            data-variant="ghost"
          >
            Sem. {i + 1}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mt-4 space-y-3 rounded-[var(--a-radius)] border border-[var(--a-accent-soft)] bg-[var(--a-accent-soft)] p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {selected.size} día(s) seleccionados
              {selected.size > 14 && (
                <span className="admin-chip ml-2" data-tone="warn">
                  afecta a muchas fechas
                </span>
              )}
            </p>
            <div className="flex gap-1.5 text-xs">
              <button type="button" className="admin-btn" data-variant="ghost" onClick={() => keepOnly((d) => !isWeekendDate(d))}>
                Solo entre semana
              </button>
              <button type="button" className="admin-btn" data-variant="ghost" onClick={() => keepOnly(isWeekendDate)}>
                Solo fin de semana
              </button>
            </div>
          </div>

          <div className="rounded-[var(--a-radius-sm)] border border-[var(--a-line)] bg-[var(--a-surface)] p-3">
            <div className="mb-2 flex gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input type="radio" name="pm" checked={priceMode === "fixed"} onChange={() => setPriceMode("fixed")} />
                Precio fijo (€)
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="pm" checked={priceMode === "percent"} onChange={() => setPriceMode("percent")} />
                Ajuste porcentual (%)
              </label>
            </div>

            <form action={priceMode === "fixed" ? priceAction : pctAction} className="flex flex-wrap items-end gap-2">
              {hidden}
              <label className="text-xs">
                <span className="admin-muted mb-1 block">
                  {priceMode === "fixed" ? "Nuevo precio/noche (€)" : "Variación (%, negativo para bajar)"}
                </span>
                <input
                  name={priceMode === "fixed" ? "priceEuros" : "percent"}
                  inputMode="decimal"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="h-9 w-40 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2"
                />
              </label>
              <button className="admin-btn" data-variant="primary" disabled={pricePending || pctPending}>
                Aplicar
              </button>
              {(priceState && !priceState.ok && <span className="text-[var(--a-danger)]">{priceState.error}</span>) ||
                (pctState && !pctState.ok && <span className="text-[var(--a-danger)]">{pctState.error}</span>) ||
                ((priceState?.ok || pctState?.ok) && (
                  <span className="text-[var(--a-ok)]">✓ Guardado, ya está activo en la web</span>
                ))}
            </form>

            {preview && (
              <p className="admin-muted mt-2 text-xs">
                {preview.nights} {preview.nights === 1 ? "noche" : "noches"} · media actual{" "}
                <strong className="text-[var(--a-text)]">{money(preview.avg)}</strong>
                {preview.next != null && (
                  <>
                    {" "}
                    → media nueva{" "}
                    <strong className="text-[var(--a-accent-strong)]">{money(preview.next)}</strong>
                  </>
                )}
              </p>
            )}
          </div>

          <form action={minAction} className="flex flex-wrap items-end gap-2">
            {hidden}
            <label className="text-xs">
              <span className="admin-muted mb-1 block">Estancia mínima (noches)</span>
              <input
                name="minNights"
                type="number"
                min={1}
                required
                className="h-9 w-40 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2"
              />
            </label>
            <button className="admin-btn" data-variant="outline" disabled={minPending}>
              Aplicar estancia mínima
            </button>
            {minState && !minState.ok && <span className="text-[var(--a-danger)]">{minState.error}</span>}
            {minState?.ok && <span className="text-[var(--a-ok)]">✓ Guardado</span>}
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={clearDayRatesAction}>
              {hidden}
              <button className="admin-btn" data-variant="outline">
                Quitar ajustes de precio/estancia
              </button>
            </form>
            <form action={closeAction}>
              {hidden}
              <button className="admin-btn" data-variant="outline" disabled={closePending}>
                Cerrar fechas
              </button>
              {closeState && !closeState.ok && (
                <span className="ml-2 text-[var(--a-danger)]">{closeState.error}</span>
              )}
            </form>
            <form action={openDatesAction}>
              {hidden}
              <button className="admin-btn" data-variant="outline">
                Abrir fechas
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
