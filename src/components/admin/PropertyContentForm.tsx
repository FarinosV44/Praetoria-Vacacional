"use client";

import { useActionState, useState } from "react";

type Result = { ok: true } | { ok: false; error: string } | null;

interface BaseFields {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tagline: string;
  shortIntro: string;
  highlights: { title: string; body: string }[];
  nearby: { name: string; distance: string }[];
  faq: { question: string; answer: string }[];
}

export function PropertyContentForm({
  slug,
  name,
  base,
  override,
  action,
}: {
  slug: string;
  name: string;
  base: BaseFields;
  override: Partial<BaseFields> | null;
  action: (prev: unknown, fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );
  const o = override ?? {};

  const [title, setTitle] = useState(o.metaTitle ?? "");
  const [meta, setMeta] = useState(o.metaDescription ?? "");

  const previewTitle = title || base.metaTitle;
  const previewMeta = meta || base.metaDescription;

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[var(--color-line)] bg-white p-5 text-sm"
    >
      <input type="hidden" name="slug" value={slug} />
      <h3 className="font-display text-lg">{name}</h3>

      {/* SERP preview */}
      <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-mist,#f6f7f9)] p-3">
        <p className="text-xs text-[var(--color-ink-soft)]">Previsualización en Google</p>
        <p className="mt-1 truncate text-[15px] text-[#1a0dab]">{previewTitle}</p>
        <p className="text-xs text-green-700">praetoriavacacional.com › {slug}</p>
        <p className="line-clamp-2 text-[13px] text-[#4d5156]">{previewMeta}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          Title {previewTitle.length}/60 · Meta {previewMeta.length}/160
          {(previewTitle.length > 60 || previewMeta.length > 160) && (
            <span className="ml-1 text-amber-600">— revisa la longitud</span>
          )}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <Text label="SEO title" name="metaTitle" value={title} onChange={setTitle} placeholder={base.metaTitle} />
        <Area label="Meta description" name="metaDescription" value={meta} onChange={setMeta} placeholder={base.metaDescription} />
        <Text label="H1" name="h1" defaultValue={o.h1 ?? ""} placeholder={base.h1} />
        <Text label="Tagline" name="tagline" defaultValue={o.tagline ?? ""} placeholder={base.tagline} />
        <Area label="Intro corta" name="shortIntro" defaultValue={o.shortIntro ?? ""} placeholder={base.shortIntro} />
        <Json
          label="Ventajas (highlights)"
          name="highlights"
          defaultValue={o.highlights ?? base.highlights}
          hint='[{ "title": "…", "body": "…" }]'
        />
        <Json
          label="Distancias (qué tienes cerca)"
          name="nearby"
          defaultValue={o.nearby ?? base.nearby}
          hint='[{ "name": "Playa Les Palmeretes", "distance": "3 min a pie" }]'
        />
        <Json
          label="FAQ"
          name="faq"
          defaultValue={o.faq ?? base.faq}
          hint='[{ "question": "…", "answer": "…" }]'
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          className="h-10 rounded-lg bg-[var(--accent-600)] px-4 font-medium text-white disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state && !state.ok && <p className="text-red-600">{state.error}</p>}
        {state && state.ok && <p className="text-green-700">Guardado.</p>}
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        Vacía todos los campos y guarda para volver al contenido original.
      </p>
    </form>
  );
}

function Text({
  label,
  name,
  value,
  onChange,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">{label}</span>
      <input
        name={name}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
      />
    </label>
  );
}

function Area({
  label,
  name,
  value,
  onChange,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">{label}</span>
      <textarea
        name={name}
        rows={2}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--color-line)] p-2"
      />
    </label>
  );
}

function Json({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: unknown;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">
        {label} <span className="font-mono text-[10px]">{hint}</span>
      </span>
      <textarea
        name={name}
        rows={5}
        defaultValue={JSON.stringify(defaultValue, null, 2)}
        className="w-full rounded-lg border border-[var(--color-line)] p-2 font-mono text-xs"
      />
    </label>
  );
}
