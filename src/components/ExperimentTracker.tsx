"use client";

import { useEffect } from "react";

/**
 * Reports active A/B variants to GA4 as user properties so conversion can be
 * segmented per variant (issue #30). Reads the non-HttpOnly `pv_exp` cookie set
 * by the server assignment. No-op when analytics is not loaded.
 */
export function ExperimentTracker() {
  useEffect(() => {
    let raw: string | undefined;
    try {
      raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("pv_exp="))
        ?.split("=")[1];
    } catch {
      return;
    }
    if (!raw) return;
    let assignments: Record<string, string>;
    try {
      assignments = JSON.parse(decodeURIComponent(raw));
    } catch {
      return;
    }
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(assignments)) props[`exp_${k}`] = v;
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("set", "user_properties", props);
  }, []);

  return null;
}
