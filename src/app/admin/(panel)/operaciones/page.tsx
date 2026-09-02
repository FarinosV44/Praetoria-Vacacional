import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import {
  KIND_LABEL,
  OPEN_STATUSES,
  type OpsKind,
} from "@/domains/operations/types";
import { reconcileTurnoversAction } from "@/domains/operations/actions";
import { NewOpsTask } from "./NewOpsTask";
import { OpsTaskRow } from "./OpsTaskRow";

export const metadata = { title: "Operaciones" };
export const dynamic = "force-dynamic";

const KINDS: (OpsKind | "all")[] = ["all", "turnover", "cleaning", "maintenance", "incident"];

export default async function OperacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; ver?: string }>;
}) {
  const { kind, ver } = await searchParams;
  const showDone = ver === "todas";
  const tasks = await getRepository()
    .listOpsTasks({
      kind: kind && kind !== "all" ? (kind as OpsKind) : undefined,
      status: showDone ? undefined : OPEN_STATUSES,
      limit: 400,
    })
    .catch(() => []);

  const properties = getAllProperties();
  const openCount = tasks.filter((t) => OPEN_STATUSES.includes(t.status)).length;
  const urgent = tasks.filter((t) => t.priority === "urgent" && OPEN_STATUSES.includes(t.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Operaciones</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Cambios de huésped, limpiezas, mantenimiento e incidencias. Los cambios de huésped se
          crean solos a partir de las salidas confirmadas.{" "}
          <strong>{openCount}</strong> tareas abiertas
          {urgent > 0 ? ` · ${urgent} urgentes` : ""}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/admin/operaciones?${new URLSearchParams({
              ...(k !== "all" ? { kind: k } : {}),
              ...(showDone ? { ver: "todas" } : {}),
            }).toString()}`}
            className="admin-chip"
            data-tone={((kind ?? "all") === k) ? "accent" : undefined}
          >
            {k === "all" ? "Todas" : KIND_LABEL[k as OpsKind]}
          </Link>
        ))}
        <Link
          href={`/admin/operaciones?${new URLSearchParams({
            ...(kind && kind !== "all" ? { kind } : {}),
            ...(showDone ? {} : { ver: "todas" }),
          }).toString()}`}
          className="admin-chip"
          data-tone={showDone ? "accent" : undefined}
        >
          {showDone ? "Ocultar hechas" : "Ver hechas"}
        </Link>
        <form action={reconcileTurnoversAction} className="ml-auto">
          <button className="admin-btn" data-variant="ghost" type="submit">
            Generar cambios de huésped
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Nueva tarea</h2>
        <NewOpsTask properties={properties.map((p) => ({ slug: p.slug, name: p.name }))} />
      </section>

      <div className="space-y-3">
        {tasks.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Nada pendiente. 🎉</p>
        )}
        {tasks.map((t) => (
          <OpsTaskRow
            key={t.id}
            task={t}
            propertyName={getPropertyById(t.propertyId)?.name ?? "—"}
          />
        ))}
      </div>
    </div>
  );
}
