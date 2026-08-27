"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { Locale } from "@/i18n/config";

export interface CouponState {
  code: string;
  applied: boolean;
  discountCents: number;
  label: string;
  message: string | null;
}

const T = {
  es: {
    toggle: "¿Tienes un código promocional?",
    placeholder: "CÓDIGO",
    apply: "Aplicar",
    remove: "Quitar",
    applied: "Código aplicado",
  },
  en: {
    toggle: "Have a promo code?",
    placeholder: "CODE",
    apply: "Apply",
    remove: "Remove",
    applied: "Code applied",
  },
} as const;

/**
 * Promo-code input (issue #45). Purely presentational + local state — the actual
 * validation and discount happen server-side in the quote; the parent passes
 * `coupon.applied` / `coupon.message` back down from that response.
 */
export function CouponField({
  value,
  status,
  onChange,
  locale = "es",
  propertySlug,
}: {
  value: string;
  status: CouponState | null;
  onChange: (code: string) => void;
  locale?: Locale;
  propertySlug?: string;
}) {
  const t = T[locale];
  const [open, setOpen] = useState(Boolean(value));
  const [draft, setDraft] = useState(value);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-[var(--accent-700)] underline"
      >
        {t.toggle}
      </button>
    );
  }

  const applied = status?.applied;

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          disabled={applied}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          className="h-11 flex-1 rounded-xl border border-[var(--color-line)] px-3 font-mono text-sm uppercase tracking-wide disabled:bg-[var(--color-paper)]"
        />
        {applied ? (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange("");
            }}
            className="h-11 rounded-xl px-4 text-sm font-medium ring-1 ring-[var(--color-line)]"
          >
            {t.remove}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onChange(draft.trim());
              track(draft.trim() ? "coupon_applied" : "coupon_rejected", {
                property_slug: propertySlug,
              });
            }}
            className="h-11 rounded-xl bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
          >
            {t.apply}
          </button>
        )}
      </div>
      {status && !status.applied && status.message && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {status.message}
        </p>
      )}
      {applied && (
        <p className="mt-1 text-xs text-green-700">
          {t.applied}: {status?.label}
        </p>
      )}
    </div>
  );
}
