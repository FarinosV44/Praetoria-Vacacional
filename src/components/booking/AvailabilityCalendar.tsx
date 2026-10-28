"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SkeletonCalendar } from "@/components/ui/Skeleton";
import { monthCells } from "@/lib/calendar-cells";
import {
  applyDayClick,
  dayRole,
  isDaySelectable,
  nightsClear,
  selectionPhase,
  stayNights,
  type PublicDayState,
  type RangeSelection,
} from "@/domains/booking/calendar-select";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface CalendarDay {
  date: string;
  state: PublicDayState;
}

/** Today's date as YYYY-MM-DD in UTC — matches the server's `todayIso()`. */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export type { RangeSelection };

/**
 * Touch-friendly availability calendar (issues #7, #23, #59). Shows real
 * free/busy days from the property calendar API and enforces valid ranges
 * client-side (server re-validates). A stay is `[check-in, check-out)`: a day
 * occupied by another guest's arrival can still be picked as a check-OUT date,
 * and it is drawn as a departure-only half-cell so that is clear.
 */
export function AvailabilityCalendar({
  propertySlug,
  value,
  onChange,
  minNightsHint,
}: {
  propertySlug: string;
  value: RangeSelection;
  onChange: (r: RangeSelection) => void;
  minNightsHint?: number;
}) {
  const [days, setDays] = useState<Map<string, PublicDayState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  // Two months side by side only when the calendar itself is wide enough
  // (~576px); in the narrow booking sidebar one roomy month reads far better.
  // A callback ref, because the grid only mounts once the skeleton is gone.
  const [wide, setWide] = useState(false);
  const observer = useRef<ResizeObserver | null>(null);
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(([entry]) => {
      if (entry) setWide(entry.contentRect.width >= 576);
    });
    observer.current.observe(el);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/properties/${propertySlug}/calendar`)
      .then((r) => r.json())
      .then((data: { days: CalendarDay[] }) => {
        if (!alive) return;
        setDays(new Map(data.days.map((d) => [d.date, d.state])));
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [propertySlug]);

  const base = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  function stateOf(date: string): PublicDayState {
    return days.get(date) ?? (date < todayStr() ? "past" : "free");
  }

  function pick(date: string) {
    const next = applyDayClick(date, value, stateOf);
    if (next) onChange(next);
  }

  const selectedNights =
    value.checkIn && value.checkOut ? stayNights(value.checkIn, value.checkOut) : 0;
  const belowMin =
    !!minNightsHint && minNightsHint > 1 && selectedNights > 0 && selectedNights < minNightsHint;

  /** Month cells without the weeks that are entirely in the past, so the
   *  bookable days are what the eye lands on (end of month = one short row). */
  function visibleCells(year: number, month1: number): (string | null)[] {
    const all = monthCells(year, month1);
    const today = todayStr();
    const out: (string | null)[] = [];
    for (let i = 0; i < all.length; i += 7) {
      const week = all.slice(i, i + 7);
      if (week.some((c) => c && c >= today)) out.push(...week);
    }
    return out;
  }

  // In the narrow (one-month) layout, also stack next month underneath when
  // fewer than three weeks of the current month are still ahead.
  const firstShown = new Date(base);
  const stackNext =
    visibleCells(firstShown.getFullYear(), firstShown.getMonth() + 1).length / 7 < 3;

  function renderMonth(offset: number) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + offset);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    const cells = visibleCells(year, month + 1);

    const previewEnd = value.checkIn && !value.checkOut && hover ? hover : value.checkOut;
    const choosingCheckout = selectionPhase(value) === "checkout";

    return (
      <div key={offset} className="flex-1">
        <p className="mb-2 text-center text-sm font-medium capitalize">
          {MONTHS[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-ink-soft)]">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <span key={i} />;
            const s = stateOf(date);
            const role = dayRole(date, stateOf);
            const isIn = date === value.checkIn;
            const isOut = date === value.checkOut;
            const inRange =
              value.checkIn &&
              previewEnd &&
              date > value.checkIn &&
              date < previewEnd &&
              nightsClear(value.checkIn, previewEnd, stateOf);
            const selectable = isDaySelectable(date, value, stateOf);
            const disabled = !selectable && !isIn && !isOut;
            // A departure-only day: occupied by someone's arrival, still valid
            // as a check-out endpoint while we are choosing one.
            const exitOnly = role === "exit-only";
            const label =
              s === "past"
                ? `${date} pasado`
                : role === "blocked"
                  ? `${date} ocupado`
                  : exitOnly
                    ? `${date} disponible solo como fecha de salida`
                    : `${date} libre`;

            const selected = isIn || isOut;
            const tone = selected
              ? "pv-day--sel"
              : inRange
                ? "pv-day--range"
                : s === "past"
                  ? "pv-day--past"
                  : role === "blocked"
                    ? "pv-day--busy"
                    : exitOnly
                      ? `pv-day--exit${choosingCheckout && selectable ? " pv-day--exit-active" : ""}`
                      : disabled
                        ? "pv-day--unreachable"
                        : "pv-day--free";

            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                data-state={s}
                data-role={role}
                onMouseEnter={() => setHover(date)}
                onFocus={() => setHover(date)}
                onClick={() => pick(date)}
                aria-label={label}
                aria-pressed={isIn || isOut}
                className={`pv-day w-full ${tone}`}
              >
                <span className="relative">{Number(date.slice(8, 10))}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading && days.size === 0) {
    return <SkeletonCalendar />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
          disabled={monthOffset === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--accent-50)] disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-[var(--color-ink)]">
          {loading
            ? "Cargando disponibilidad…"
            : selectionPhase(value) === "checkout"
              ? "Elige la fecha de salida"
              : "Selecciona entrada y salida"}
        </span>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.min(10, m + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--accent-50)] disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div ref={wrapRef} className={`mt-2 flex gap-4 ${wide ? "flex-row gap-6" : "flex-col"}`}>
        {renderMonth(0)}
        {(wide || stackNext) && renderMonth(1)}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-soft)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="pv-day-swatch pv-day--free" />
          Libre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="pv-day-swatch pv-day--busy" />
          Ocupado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="pv-day-swatch pv-day--exit" />
          Solo salida
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="pv-day-swatch pv-day--sel" />
          Tu estancia
        </span>
      </div>

      {minNightsHint && minNightsHint > 1 && (
        <p
          className={[
            "mt-2 text-xs",
            belowMin ? "font-medium text-[var(--color-danger)]" : "text-[var(--color-ink-soft)]",
          ].join(" ")}
        >
          {belowMin
            ? `Esta estancia son ${selectedNights} noche(s); la mínima para estas fechas es de ${minNightsHint}.`
            : `Estancia mínima habitual: ${minNightsHint} noches.`}
        </p>
      )}
      {value.checkIn && !value.checkOut && (
        <button
          type="button"
          onClick={() => onChange({ checkIn: null, checkOut: null })}
          className="mt-2 text-xs text-[var(--accent-700)] underline"
        >
          Reiniciar selección
        </button>
      )}
    </div>
  );
}
