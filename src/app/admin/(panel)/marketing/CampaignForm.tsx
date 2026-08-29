"use client";

import { useActionState } from "react";
import type { Campaign, Segment } from "@/domains/marketing/types";

type Result = { ok: true; id?: string } | { ok: false; error: string } | null;

export function CampaignForm({
  action,
  segments,
  campaign,
  submitLabel,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  segments: Segment[];
  campaign?: Campaign;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (p, fd) => action(p, fd),
    null,
  );
  const input = "h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm";
  const label = "mb-1 block text-xs text-[var(--color-ink-soft)]";

  return (
    <form action={formAction} className="space-y-4">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={label}>Nombre</span>
          <input name="name" defaultValue={campaign?.name ?? ""} required className={input} />
        </label>
        <label>
          <span className={label}>Canal</span>
          <select name="channel" defaultValue={campaign?.channel ?? "email"} className={input}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp / teléfono</option>
            <option value="promo">Solo código promocional</option>
          </select>
        </label>
        <label>
          <span className={label}>Segmento</span>
          <select name="segmentId" defaultValue={campaign?.segmentId ?? ""} className={input}>
            <option value="">Todos los clientes</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={label}>Código promocional (opcional)</span>
          <input name="couponCode" defaultValue={campaign?.couponCode ?? ""} className={input} />
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Asunto</span>
          <input name="subject" defaultValue={campaign?.subject ?? ""} className={input} />
        </label>
        <label className="sm:col-span-2">
          <span className={label}>Mensaje</span>
          <textarea
            name="body"
            rows={6}
            defaultValue={campaign?.body ?? ""}
            className="w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            placeholder="Este invierno descubre Javalambre Mountain SuperSki con un 10% de descuento…"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="consentRequired"
          defaultChecked={campaign?.consentRequired ?? true}
        />
        Solo enviar a clientes con consentimiento de marketing
      </label>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
      <button
        className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
