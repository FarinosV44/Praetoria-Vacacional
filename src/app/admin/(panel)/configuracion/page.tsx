import { getConfigFeatures, configSummary, type ConfigState } from "@/domains/config-status/registry";

export const metadata = { title: "Estado de configuración" };

const STATE_STYLE: Record<ConfigState, { label: string; cls: string }> = {
  configured: { label: "Configurado", cls: "bg-green-100 text-green-800" },
  not_configured: { label: "Pendiente de configuración", cls: "bg-amber-100 text-amber-800" },
  error: { label: "Error de configuración", cls: "bg-red-100 text-red-700" },
  disabled: { label: "Desactivado", cls: "bg-gray-100 text-gray-600" },
};

export default function AdminConfigPage() {
  const features = getConfigFeatures();
  const s = configSummary();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Estado de configuración</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Todas las funcionalidades están implementadas. Lo que aparece como “pendiente” solo necesita
        que añadas las variables de entorno indicadas; no requiere tocar código. Al añadirlas, la
        función se activa sola.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Integraciones" value={s.total} />
        <Stat label="Configuradas" value={s.configured} />
        <Stat label="Pendientes" value={s.pending} warn={s.pending > 0} />
        <Stat label="Con error" value={s.error} warn={s.error > 0} />
      </div>

      <div className="space-y-3">
        {features.map((f) => {
          const st = STATE_STYLE[f.state];
          return (
            <section
              key={f.key}
              className="rounded-xl border border-[var(--color-line)] bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg">{f.label}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              <p className="mt-2 text-sm">{f.statusLine}</p>
              <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{f.impact}</p>
              <dl className="mt-3 grid gap-1 text-xs">
                <div className="flex gap-2">
                  <dt className="text-[var(--color-ink-soft)]">Variables:</dt>
                  <dd className="font-mono">{f.envVars.join(", ")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-[var(--color-ink-soft)]">Dónde:</dt>
                  <dd>{f.where}</dd>
                </div>
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${warn ? "border-amber-300 bg-amber-50" : "border-[var(--color-line)] bg-white"}`}
    >
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
