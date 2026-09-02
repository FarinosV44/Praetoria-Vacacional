import { DEFAULT_RETENTION, FISCAL_RETENTION_YEARS } from "@/domains/privacy/types";
import { runRetentionSweepNowAction } from "@/domains/privacy/actions";
import { PrivacyConsole } from "./PrivacyConsole";

export const metadata = { title: "Privacidad" };
export const dynamic = "force-dynamic";

export default function PrivacidadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Privacidad y protección de datos</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Derechos de acceso, portabilidad y supresión (RGPD art. 15, 17, 20) y conservación
          automática. Las facturas y sus importes se conservan por obligación fiscal (
          {FISCAL_RETENTION_YEARS} años); el resto de datos de contacto se anonimiza o elimina
          según la política de retención.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Solicitud de un interesado</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Busca por correo electrónico para ver, exportar o eliminar los datos de una persona.
        </p>
        <PrivacyConsole />
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Retención automática</h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink-soft)]">
          <li>· Reservas abandonadas sin pago: se eliminan a los {DEFAULT_RETENTION.abandonedHoldDays} días.</li>
          <li>· Reservas canceladas: se anonimiza el contacto al año.</li>
          <li>
            · Estancias finalizadas: se anonimiza el contacto a los{" "}
            {DEFAULT_RETENTION.completedStayContactYears} años.
          </li>
          <li>· Mensajes de ciclo de vida ya enviados: se borran a los {DEFAULT_RETENTION.scheduledMessageDays} días.</li>
          <li>· Registro de actividad: se recorta a los {Math.round(DEFAULT_RETENTION.auditLogDays / 365)} años.</li>
        </ul>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Se ejecuta automáticamente el día 1 de cada mes (<code>/api/cron/privacy</code>).
        </p>
        <form action={runRetentionSweepNowAction} className="mt-3">
          <button className="admin-btn" data-variant="ghost" type="submit">
            Ejecutar barrido ahora
          </button>
        </form>
      </section>
    </div>
  );
}
