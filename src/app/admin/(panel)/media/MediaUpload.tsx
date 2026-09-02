"use client";

import { useActionState, useRef, useState } from "react";
import { uploadMediaAction } from "@/domains/media/actions";

export function MediaUpload({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(uploadMediaAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setDims(null);
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = URL.createObjectURL(file);
  }

  if (state?.ok) {
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-3 grid gap-3 sm:grid-cols-2"
      onSubmit={() => {
        /* dims added via hidden inputs below */
      }}
    >
      <input type="hidden" name="width" value={dims?.w ?? ""} />
      <input type="hidden" name="height" value={dims?.h ?? ""} />
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Archivo</span>
        <input
          type="file"
          name="file"
          required
          accept="image/*,application/pdf"
          onChange={onPick}
          disabled={disabled}
          className="block w-full text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Texto alternativo (ALT)</span>
        <input name="alt" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Etiquetas (coma)</span>
        <input name="tags" placeholder="javalambre, exterior" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3" />
      </label>
      <div className="sm:col-span-2">
        <button className="admin-btn" data-variant="primary" type="submit" disabled={disabled || pending}>
          {pending ? "Subiendo…" : "Subir archivo"}
        </button>
        {state && !state.ok && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="ml-3 text-sm text-green-700">Subido.</span>}
      </div>
    </form>
  );
}
