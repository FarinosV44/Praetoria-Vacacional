"use client";

import { useActionState } from "react";

type Result = { ok: true } | { ok: false; error: string } | null;

export function GuideOverrideForm({
  propertySlug,
  slug,
  base,
  override,
  action,
}: {
  propertySlug: string;
  slug: string;
  base: { title: string; description: string; lead: string; published: boolean };
  override: {
    title?: string;
    description?: string;
    lead?: string;
    status?: "draft" | "published";
    order?: number;
  } | null;
  action: (prev: unknown, fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );
  const o = override ?? {};
  const effectiveStatus = o.status ?? (base.published ? "published" : "draft");

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm"
    >
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">
          /guias/{propertySlug === "valencia" ? "valencia-playa" : "javalambre"}/{slug}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            effectiveStatus === "published"
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {effectiveStatus === "published" ? "Publicada" : "Borrador"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Título (SEO)</span>
          <input
            name="title"
            defaultValue={o.title ?? ""}
            placeholder={base.title}
            className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Extracto / meta description</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={o.description ?? ""}
            placeholder={base.description}
            className="w-full rounded-lg border border-[var(--color-line)] p-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Entradilla (lead)</span>
          <textarea
            name="lead"
            rows={2}
            defaultValue={o.lead ?? ""}
            placeholder={base.lead}
            className="w-full rounded-lg border border-[var(--color-line)] p-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Estado</span>
          <select
            name="status"
            defaultValue={effectiveStatus}
            className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
          >
            <option value="published">Publicada</option>
            <option value="draft">Borrador (noindex)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Orden en el cluster</span>
          <input
            name="order"
            type="number"
            min={0}
            defaultValue={o.order ?? ""}
            placeholder="auto"
            className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          className="h-9 rounded-lg bg-[var(--accent-600)] px-4 font-medium text-white disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state && !state.ok && <p className="text-red-600">{state.error}</p>}
        {state && state.ok && <p className="text-green-700">Guardado.</p>}
      </div>
    </form>
  );
}
