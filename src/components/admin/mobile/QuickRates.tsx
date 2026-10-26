"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildQuote, seasonCovers } from "@/domains/pricing/engine";
import type { RateConfig, Season } from "@/domains/pricing/types";
import { addDays, todayIso } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { quickRatesAction } from "@/domains/admin/mobile-actions";
import { applyQuickRateChanges, type QuickRateChange } from "@/domains/pricing/quick";

const STEP = 500; // 5 €

interface Row {
  field: string;
  label: string;
  saved: number;
}

interface Group {
  key: string;
  title: string;
  dates: string | null;
  rows: Row[];
  /** Picks a Friday inside (season) or outside (base) every season. */
  matches: (iso: string) => boolean;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function mmddLabel(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

function groupsFor(config: RateConfig): Group[] {
  const inAnySeason = (iso: string) => config.seasons.some((s) => seasonCovers(s, iso));
  const base: Group = {
    key: "base",
    title: "Resto del año",
    dates: null,
    rows: [
      { field: "base", label: "Domingo a jueves", saved: config.baseNightlyCents },
      { field: "weekend", label: "Viernes y sábado", saved: config.weekendNightlyCents ?? config.baseNightlyCents },
    ],
    matches: (iso) => !inAnySeason(iso),
  };
  const seasons = config.seasons.map((s: Season) => ({
    key: s.key,
    title: s.label,
    dates: `${mmddLabel(s.start)} – ${mmddLabel(s.end)}`,
    rows: [
      { field: `season:${s.key}`, label: "Domingo a jueves", saved: s.nightlyCents },
      { field: `season-weekend:${s.key}`, label: "Viernes y sábado", saved: s.weekendNightlyCents ?? s.nightlyCents },
    ],
    // The first season that covers a night wins in the engine — mirror that.
    matches: (iso: string) => config.seasons.find((x) => seasonCovers(x, iso))?.key === s.key,
  }));
  return [...seasons, base];
}

/** Pending edits applied to a copy of the config (for the live example totals). */
function withEdits(config: RateConfig, edits: Record<string, number>): RateConfig {
  const res = applyQuickRateChanges(
    config,
    Object.entries(edits).map(([field, cents]) => ({ field, cents })),
  );
  return res.ok ? res.config : config;
}

/** Next Friday→Sunday (both nights in the group) within the coming year. */
function exampleWeekend(matches: (iso: string) => boolean): string | null {
  let d = addDays(todayIso(), 1);
  for (let i = 0; i < 400; i++, d = addDays(d, 1)) {
    if (new Date(`${d}T12:00:00Z`).getUTCDay() === 5 && matches(d) && matches(addDays(d, 1))) return d;
  }
  return null;
}

/**
 * Thumb-friendly nightly price editor for one property: ±5 € steppers per
 * season and weekday/weekend, a live "2-night weekend for 2" example total to
 * compare with Booking, and one save that writes the normal rate override.
 */
export function QuickRates({ slug, name, config }: { slug: string; name: string; config: RateConfig }) {
  const router = useRouter();
  const groups = useMemo(() => groupsFor(config), [config]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const preview = useMemo(() => withEdits(config, edits), [config, edits]);
  const dirty = Object.keys(edits).length;

  function setValue(row: Row, cents: number) {
    setMsg(null);
    const clamped = Math.min(500000, Math.max(1000, Math.round(cents / 100) * 100));
    setEdits((e) => {
      const next = { ...e };
      if (clamped === row.saved) delete next[row.field];
      else next[row.field] = clamped;
      return next;
    });
  }

  function save() {
    const changes: QuickRateChange[] = Object.entries(edits).map(([field, cents]) => ({ field, cents }));
    start(async () => {
      const res = await quickRatesAction(slug, changes);
      if (res.ok) {
        setEdits({});
        setMsg({ tone: "ok", text: "Precios guardados. Ya se aplican en la web." });
        router.refresh();
      } else {
        setMsg({ tone: "danger", text: res.error });
      }
    });
  }

  return (
    <div className="space-y-4 pb-28">
      {groups.map((g) => {
        const friday = exampleWeekend(g.matches);
        const quote = friday
          ? buildQuote(preview, { propertySlug: slug, checkIn: friday, checkOut: addDays(friday, 2), guests: 2 }, todayIso(), {
              skipMinNights: true,
            })
          : null;
        return (
          <section key={g.key} className="admin-card p-4" aria-labelledby={`g-${g.key}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`g-${g.key}`} className="text-base">
                {g.title}
              </h2>
              {g.dates && <span className="text-xs text-[var(--a-text-soft)]">{g.dates}</span>}
            </div>
            <div className="mt-3 divide-y divide-[var(--a-line-soft)]">
              {g.rows.map((row) => {
                const value = edits[row.field] ?? row.saved;
                const diff = value - row.saved;
                return (
                  <div key={row.field} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm">{row.label}</p>
                      <p className="text-xs text-[var(--a-text-soft)]">
                        por noche
                        {diff !== 0 && (
                          <span className="ml-2 font-semibold" style={{ color: diff > 0 ? "var(--a-ok)" : "var(--a-danger)" }}>
                            {diff > 0 ? "+" : "−"}
                            {formatMoney(Math.abs(diff))}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="admin-btn h-11 w-11 justify-center p-0 text-lg"
                        data-variant="outline"
                        aria-label={`Bajar 5 € ${g.title}, ${row.label}`}
                        onClick={() => setValue(row, value - STEP)}
                      >
                        −
                      </button>
                      <label className="sr-only" htmlFor={`v-${row.field}`}>
                        {`${g.title}, ${row.label}, euros por noche`}
                      </label>
                      <input
                        id={`v-${row.field}`}
                        type="number"
                        inputMode="numeric"
                        min={10}
                        max={5000}
                        step={1}
                        value={Math.round(value / 100)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n > 0) setValue(row, n * 100);
                        }}
                        className="pv-input !h-11 !w-20 !px-1 text-center text-base font-semibold tabular-nums"
                      />
                      <button
                        type="button"
                        className="admin-btn h-11 w-11 justify-center p-0 text-lg"
                        data-variant="outline"
                        aria-label={`Subir 5 € ${g.title}, ${row.label}`}
                        onClick={() => setValue(row, value + STEP)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {quote && (
              <p className="mt-2 rounded-[var(--a-radius-sm)] bg-[var(--a-surface-2)] px-3 py-2 text-xs text-[var(--a-text-soft)]">
                Fin de semana de ejemplo, 2 noches y 2 personas:{" "}
                <strong className="text-sm text-[var(--a-text)]">{formatMoney(quote.totalCents)}</strong>
              </p>
            )}
          </section>
        );
      })}

      <p className="text-xs text-[var(--a-text-soft)]">
        Los precios marcados por fecha concreta en el calendario siguen mandando sobre estas tarifas. Más opciones
        (estancia mínima, cargos, descuentos) en <Link className="underline" href="/admin/precios">Precios y reglas</Link>.
      </p>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--a-line)] bg-[var(--a-surface)] px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {msg && (
          <p role="status" className="mb-2 text-sm" style={{ color: msg.tone === "ok" ? "var(--a-ok)" : "var(--a-danger)" }}>
            {msg.text}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className="admin-btn flex-1 justify-center py-3 text-base"
            data-variant="primary"
            disabled={!dirty || pending}
            onClick={save}
          >
            {pending ? "Guardando…" : dirty ? `Guardar ${dirty} ${dirty === 1 ? "cambio" : "cambios"} · ${name.split(" ")[0]}` : "Sin cambios"}
          </button>
          {dirty > 0 && (
            <button type="button" className="admin-btn justify-center py-3" data-variant="ghost" onClick={() => setEdits({})} disabled={pending}>
              Descartar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
