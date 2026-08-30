"use client";

import { useEffect, useMemo, useState } from "react";
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

/**
 * "Solo salida" marker — a single thin line crossing the cell corner to corner.
 * Deliberately understated: ~1.2px, a soft neutral at low opacity, no fill. It
 * reads as "half a day" without looking like a broken or struck-through cell.
 */
const EXIT_ONLY_HAIRLINE =
  "linear-gradient(45deg, transparent calc(50% - 0.6px), color-mix(in oklch, var(--color-ink-soft), transparent 55%) calc(50% - 0.6px), color-mix(in oklch, var(--color-ink-soft), transparent 55%) calc(50% + 0.6px), transparent calc(50% + 0.6px))";
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

  function renderMonth(offset: number) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + offset);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    const cells = monthCells(year, month + 1);

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
                  ? `${date} no disponible`
                  : exitOnly
                    ? `${date} disponible solo como fecha de salida`
                    : date;

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
                className={[
                  "relative h-10 overflow-hidden rounded-lg text-sm transition-colors",
                  disabled
                    ? "cursor-not-allowed text-[var(--color-line)] line-through"
                    : "hover:bg-[var(--accent-50)]",
                  isIn || isOut ? "bg-[var(--accent-600)] text-white hover:bg-[var(--accent-600)]" : "",
                  inRange ? "bg-[var(--accent-50)] text-[var(--accent-700)]" : "",
                  exitOnly && !isIn && !isOut && !inRange
                    ? choosingCheckout
                      ? "bg-[var(--accent-50)] font-medium text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)]"
                    : "",
                ].join(" ")}
              >
                {exitOnly && !isIn && !isOut && !inRange && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: EXIT_ONLY_HAIRLINE }}
                  />
                )}
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
          className="h-9 w-9 rounded-full text-lg disabled:opacity-30"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {loading
            ? "Cargando disponibilidad…"
            : selectionPhase(value) === "checkout"
              ? "Elige la fecha de salida"
              : "Selecciona entrada y salida"}
        </span>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.min(10, m + 1))}
          className="h-9 w-9 rounded-full text-lg disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:gap-6">
        {renderMonth(0)}
        <div className="hidden sm:block">{renderMonth(1)}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-[var(--color-line)]" />
          Libre
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-[var(--color-line)]"
            style={{ background: EXIT_ONLY_HAIRLINE }}
          />
          Solo salida
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-[var(--color-line)] bg-[var(--color-line)] opacity-50" />
          No disponible
        </span>
      </div>

      {minNightsHint && minNightsHint > 1 && (
        <p
          className={[
            "mt-2 text-xs",
            belowMin ? "font-medium text-red-600" : "text-[var(--color-ink-soft)]",
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
