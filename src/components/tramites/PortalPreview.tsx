/**
 * Vista previa de «Mi carpeta» para la landing. Datos inventados de ejemplo,
 * sin nombres de huéspedes; se marca como ejemplo para que nadie la confunda
 * con una cuenta real.
 */
export function PortalPreview() {
  return (
    <figure className="relative min-w-0">
      <div
        aria-hidden
        className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-paper)] text-[var(--color-ink)] shadow-2xl ring-1 ring-white/10"
      >
        <div className="flex items-center gap-1.5 border-b border-[var(--color-line)] bg-white px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded bg-[var(--color-paper)] px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)]">
            praetoriavacacional.es/mi-cuenta/tramites
          </span>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold tracking-wider text-[var(--color-ink-soft)] uppercase">
              Mi carpeta
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">Saldo: 4 reservas</p>
          </div>
          <p className="text-lg font-semibold">Tienes 1 asunto pendiente</p>
          <div className="rounded-[var(--radius-md)] border border-l-4 border-[var(--color-line)] border-l-[var(--color-warning)] bg-white p-3">
            <p className="font-semibold">Datos de viajeros · entrada 12 dic</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Envíanos los datos antes de la llegada.
            </p>
          </div>
          <ul className="divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
            <PreviewRow
              title="Reserva Booking · Ático Cullera"
              meta="EX-7K2Q · hoy, 10:42"
              badge="Presentado"
              tone="ok"
            />
            <PreviewRow
              title="Alta SES.HOSPEDAJES · Ático Cullera"
              meta="EX-3M9D · 2 dic"
              badge="Finalizado"
              tone="ok"
            />
            <PreviewRow
              title="Reserva Airbnb · Casa Camarena"
              meta="EX-9P4T · ayer"
              badge="En revisión"
              tone="info"
            />
          </ul>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-white p-3 ring-1 ring-[var(--color-line)]">
            <span className="grid size-8 place-items-center rounded bg-[var(--color-paper)] text-[10px] font-bold">
              PDF
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">Justificante SES · reserva 7K2Q</span>
              <span className="text-xs text-[var(--color-ink-soft)]">Resguardo oficial</span>
            </span>
            <span className="text-xs underline">Descargar</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-white/60">
        Vista de ejemplo de tu carpeta online. Los datos son ficticios.
      </figcaption>
    </figure>
  );
}

function PreviewRow({
  title,
  meta,
  badge,
  tone,
}: {
  title: string;
  meta: string;
  badge: string;
  tone: "ok" | "info";
}) {
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="text-[11px] text-[var(--color-ink-faint)]">{meta}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800"}`}
      >
        {badge}
      </span>
    </li>
  );
}
