"use client";

import { useActionState, useState } from "react";
import { deleteMediaAction, updateMediaAction } from "@/domains/media/actions";
import { focalToObjectPosition, type MediaAsset } from "@/domains/media/types";

export function MediaCard({ asset }: { asset: MediaAsset }) {
  const [state, action, pending] = useActionState(updateMediaAction, null);
  const [focal, setFocal] = useState({ x: asset.focalX, y: asset.focalY });
  const [copied, setCopied] = useState(false);
  const isImage = asset.mime.startsWith("image/");

  function pickFocal(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocal({
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    });
  }

  async function copyUrl() {
    if (!asset.signedUrl) return;
    await navigator.clipboard.writeText(asset.signedUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      {isImage && asset.signedUrl ? (
        <div
          className="relative aspect-[4/3] cursor-crosshair bg-[var(--color-surface-2,#f4f6fb)]"
          onClick={pickFocal}
          title="Haz clic para fijar el punto focal"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.signedUrl}
            alt={asset.alt || asset.filename}
            className="h-full w-full object-cover"
            style={{ objectPosition: focalToObjectPosition(focal.x, focal.y) }}
          />
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent-600)] shadow"
            style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-surface-2,#f4f6fb)] text-xs text-[var(--color-ink-soft)]">
          {asset.mime}
        </div>
      )}

      <form action={action} className="space-y-2 p-3 text-sm">
        <input type="hidden" name="id" value={asset.id} />
        <input type="hidden" name="focalX" value={focal.x.toFixed(3)} />
        <input type="hidden" name="focalY" value={focal.y.toFixed(3)} />
        <div className="truncate text-xs text-[var(--color-ink-soft)]" title={asset.filename}>
          {asset.filename}
          {asset.width ? ` · ${asset.width}×${asset.height}` : ""}
        </div>
        <input
          name="alt"
          defaultValue={asset.alt}
          placeholder="Texto alternativo"
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2"
        />
        <input
          name="tags"
          defaultValue={asset.tags.join(", ")}
          placeholder="etiquetas"
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2"
        />
        <div className="flex flex-wrap gap-1">
          <button className="admin-btn" data-variant="primary" type="submit" disabled={pending}>
            {pending ? "…" : "Guardar"}
          </button>
          <button className="admin-btn" data-variant="ghost" type="button" onClick={copyUrl} disabled={!asset.signedUrl}>
            {copied ? "¡Copiado!" : "Copiar URL"}
          </button>
        </div>
        {state && !state.ok && <p className="text-xs text-red-600">{state.error}</p>}
      </form>

      <form action={deleteMediaAction} className="border-t border-[var(--color-line)] p-2">
        <input type="hidden" name="id" value={asset.id} />
        <button className="admin-btn w-full" data-variant="ghost" type="submit">
          Eliminar
        </button>
      </form>
    </div>
  );
}
