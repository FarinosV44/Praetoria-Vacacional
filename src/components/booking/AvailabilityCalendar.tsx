"use client";

import { useEffect, useMemo, useState } from "react";

type DayState = "free" | "busy" | "past" | "checkout-only";
interface CalendarDay {
  date: string;
  state: DayState;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
/** Monday = 0 */
function mondayIndex(dow: number) {
  return (dow + 6) % 7;
}

export interface RangeSelection {
  checkIn: string | null;
  checkOut: string | null;
}

/**
 * Touch-friendly availability calendar (issues #7, #23). Shows real free/busy
 * days from the property calendar API and enforces valid ranges client-side
 * (server re-validates). Two months visible; paginates forward.
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
  const [days, setDays] = useState<Map<string, DayState>>(new Map());
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

  function stateOf(date: string): DayState {
    return days.get(date) ?? (date < iso(new Date()) ? "past" : "free");
  }

  /** Is every night in [a,b) free? */
  function rangeClear(a: string, b: string): boolean {
    const cur = new Date(a);
    const end = new Date(b);
    while (cur < end) {
      const s = stateOf(iso(cur));
      if (s === "busy" || s === "past") return false;
      cur.setDate(cur.getDate() + 1);
    }
    return true;
  }

  function pick(date: string) {
    const s = stateOf(date);
    if (s === "past") return;

    if (!value.checkIn || (value.checkIn && value.checkOut)) {
      if (s === "busy") return;
      onChange({ checkIn: date, checkOut: null });
      return;
    }
    // choosing checkout
    if (date <= value.checkIn) {
      onChange({ checkIn: date, checkOut: null });
      return;
    }
    if (!rangeClear(value.checkIn, date)) {
      // Restart the selection at the new date.
      onChange({ checkIn: date, checkOut: null });
      return;
    }
    onChange({ checkIn: value.checkIn, checkOut: date });
  }

  function renderMonth(offset: number) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + offset);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDow = mondayIndex(new Date(year, month, 1).getDay());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(iso(new Date(year, month, day)));

    const previewEnd = value.checkIn && !value.checkOut && hover ? hover : value.checkOut;

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
            const isIn = date === value.checkIn;
            const isOut = date === value.checkOut;
            const inRange =
              value.checkIn &&
              previewEnd &&
              date > value.checkIn &&
              date < previewEnd &&
              rangeClear(value.checkIn, previewEnd);
            const disabled = s === "past" || (s === "busy" && !isOut);

            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                onMouseEnter={() => setHover(date)}
                onFocus={() => setHover(date)}
                onClick={() => pick(date)}
                aria-label={`${date}${s === "busy" ? " no disponible" : ""}`}
                aria-pressed={isIn || isOut}
                className={[
                  "relative h-10 rounded-lg text-sm transition-colors",
                  disabled
                    ? "cursor-not-allowed text-[var(--color-line)] line-through"
                    : "hover:bg-[var(--accent-50)]",
                  isIn || isOut ? "bg-[var(--accent-600)] text-white hover:bg-[var(--accent-600)]" : "",
                  inRange ? "bg-[var(--accent-50)] text-[var(--accent-700)]" : "",
                  s === "checkout-only" && !isIn && !isOut && !inRange ? "text-[var(--color-ink-soft)]" : "",
                ].join(" ")}
              >
                {Number(date.slice(8, 10))}
              </button>
            );
          })}
        </div>
      </div>
    );
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
          {loading ? "Cargando disponibilidad…" : "Selecciona entrada y salida"}
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

      {minNightsHint && minNightsHint > 1 && (
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Estancia mínima habitual: {minNightsHint} noches.
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
