"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * A tiny client-side store for the in-progress stay selection (issue #89).
 * Persisted to sessionStorage so the Booking Bar keeps property / dates /
 * guests across navigation without a full router round-trip. Never the source
 * of truth for a booking — the server always re-quotes and re-checks.
 */

export interface StaySelection {
  property: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
}

const KEY = "pv_stay";
const EMPTY: StaySelection = { property: null, checkIn: null, checkOut: null, guests: 2 };

let current: StaySelection = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): StaySelection {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<StaySelection>;
    return {
      property: typeof p.property === "string" ? p.property : null,
      checkIn: typeof p.checkIn === "string" ? p.checkIn : null,
      checkOut: typeof p.checkOut === "string" ? p.checkOut : null,
      guests: Number.isFinite(p.guests) && (p.guests as number) > 0 ? Math.floor(p.guests as number) : 2,
    };
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const l of listeners) l();
}

export function setStay(patch: Partial<StaySelection>) {
  current = { ...current, ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode / storage disabled — the bar still works in-memory */
  }
  emit();
}

function subscribe(cb: () => void) {
  if (!hydrated) {
    current = read();
    hydrated = true;
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Read + update the shared stay selection. SSR-safe (returns EMPTY on the server). */
export function useStay() {
  const selection = useSyncExternalStore(
    subscribe,
    () => current,
    () => EMPTY,
  );
  const update = useCallback((patch: Partial<StaySelection>) => setStay(patch), []);
  return [selection, update] as const;
}

/**
 * Declare the property a page is about, so the bar preselects it (issue #89:
 * "En una ficha, propiedad ya preseleccionada"). Only sets it when nothing is
 * chosen yet, or when the chosen one no longer matches this page's context and
 * the user has not picked dates.
 */
export function usePreferProperty(slug: string | null | undefined) {
  useEffect(() => {
    if (!slug) return;
    if (current.property === slug) return;
    if (!current.property || (!current.checkIn && !current.checkOut)) {
      setStay({ property: slug });
    }
  }, [slug]);
}
