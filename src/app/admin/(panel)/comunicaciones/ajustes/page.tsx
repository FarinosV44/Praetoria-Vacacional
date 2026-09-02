import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { resolveRules } from "@/domains/comms/schedule";
import { COMM_KINDS, COMM_KIND_LABEL, type CommRule } from "@/domains/comms/types";
import { saveCommsSettingsAction } from "@/domains/comms/actions";

export const metadata = { title: "Ajustes de comunicaciones" };
export const dynamic = "force-dynamic";

interface StoredSettings {
  rules?: Record<string, Partial<CommRule>>;
  checkinEs?: string | null;
  checkinEn?: string | null;
  checkoutEs?: string | null;
  checkoutEn?: string | null;
}

export default async function CommsSettingsPage() {
  const repo = getRepository();
  const properties = getAllProperties();
  const settings = await Promise.all(
    properties.map(async (p) => {
      const row = await repo.getContentOverride(`comms:settings:${p.id}`).catch(() => null);
      return { property: p, stored: (row?.value as StoredSettings) ?? {} };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Ajustes de comunicaciones</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Por alojamiento: qué mensajes se envían, cuándo (días respecto a la entrada/salida y hora),
          y el texto de acceso/salida que se incluye en las instrucciones. Cambiar esto afecta solo a
          las reservas que se confirmen o replanifiquen a partir de ahora.
        </p>
        <Link href="/admin/comunicaciones" className="mt-2 inline-block text-sm text-[var(--a-accent)]">
          ← Volver a comunicaciones
        </Link>
      </div>

      {settings.map(({ property, stored }) => {
        const rules = resolveRules(stored.rules);
        return (
          <form
            key={property.id}
            action={saveCommsSettingsAction}
            className="space-y-4 rounded-xl border border-[var(--color-line)] bg-white p-5"
          >
            <input type="hidden" name="propertySlug" value={property.slug} />
            <h2 className="font-display text-lg">{property.name}</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="py-1">Mensaje</th>
                    <th className="py-1">Activo</th>
                    <th className="py-1">Días</th>
                    <th className="py-1">Hora</th>
                    <th className="py-1">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {COMM_KINDS.map((kind) => {
                    const r = rules.find((x) => x.kind === kind)!;
                    return (
                      <tr key={kind}>
                        <td className="py-1.5 pr-3">{COMM_KIND_LABEL[kind]}</td>
                        <td className="py-1.5 pr-3">
                          <input
                            type="checkbox"
                            name={`rule.${kind}.enabled`}
                            defaultChecked={r.enabled}
                          />
                        </td>
                        <td className="py-1.5 pr-3">
                          <input
                            type="number"
                            name={`rule.${kind}.offsetDays`}
                            defaultValue={r.offsetDays}
                            className="w-16 rounded border border-[var(--color-line)] px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1.5 pr-3">
                          <input
                            type="number"
                            min={0}
                            max={23}
                            name={`rule.${kind}.hour`}
                            defaultValue={r.hour}
                            className="w-16 rounded border border-[var(--color-line)] px-1 py-0.5"
                          />
                        </td>
                        <td className="py-1.5 text-xs text-[var(--color-ink-soft)]">
                          {r.anchor === "check_in" ? "entrada" : "salida"} (negativo = antes)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Instrucciones de entrada (ES)
                <textarea
                  name="checkinEs"
                  rows={3}
                  defaultValue={stored.checkinEs ?? ""}
                  className="mt-1 w-full rounded border border-[var(--color-line)] p-2 text-sm"
                  placeholder="Cómo recoger las llaves, dónde aparcar, horario de entrada…"
                />
              </label>
              <label className="text-sm">
                Check-in instructions (EN)
                <textarea
                  name="checkinEn"
                  rows={3}
                  defaultValue={stored.checkinEn ?? ""}
                  className="mt-1 w-full rounded border border-[var(--color-line)] p-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Instrucciones de salida (ES)
                <textarea
                  name="checkoutEs"
                  rows={2}
                  defaultValue={stored.checkoutEs ?? ""}
                  className="mt-1 w-full rounded border border-[var(--color-line)] p-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Check-out instructions (EN)
                <textarea
                  name="checkoutEn"
                  rows={2}
                  defaultValue={stored.checkoutEn ?? ""}
                  className="mt-1 w-full rounded border border-[var(--color-line)] p-2 text-sm"
                />
              </label>
            </div>

            <button className="admin-btn" data-variant="primary" type="submit">
              Guardar {property.name}
            </button>
          </form>
        );
      })}
    </div>
  );
}
