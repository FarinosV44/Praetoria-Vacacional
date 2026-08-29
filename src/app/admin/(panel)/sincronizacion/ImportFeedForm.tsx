"use client";

import { useActionState } from "react";

type Result = { ok: true } | { ok: false; error: string } | null;

export function ImportFeedForm({
  propertySlug,
  channel = "booking",
  channelLabel,
  placeholder,
  current,
  action,
}: {
  propertySlug: string;
  channel?: string;
  channelLabel?: string;
  placeholder?: string;
  current: string | null;
  action: (prev: unknown, fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <input type="hidden" name="channel" value={channel} />
      <label className="flex-1">
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">
          URL iCal de importación · {channelLabel ?? channel}
        </span>
        <input
          type="url"
          name="url"
          defaultValue={current ?? ""}
          placeholder={placeholder ?? "https://ical.booking.com/v1/export?t=…"}
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2 font-mono text-xs"
        />
      </label>
      <button
        className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : current ? "Actualizar" : "Guardar"}
      </button>
      {state && !state.ok && <p className="w-full text-red-600">{state.error}</p>}
      {state && state.ok && <p className="w-full text-green-700">Guardado. Se usará en la próxima sincronización.</p>}
    </form>
  );
}
