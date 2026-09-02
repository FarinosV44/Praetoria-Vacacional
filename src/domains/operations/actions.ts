"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getAdminContext } from "@/domains/admin/context";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function guard() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("operations.write");
}

const createSchema = z.object({
  propertySlug: z.string().min(1),
  kind: z.enum(["turnover", "cleaning", "maintenance", "incident"]),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.string().trim().optional(),
  assignee: z.string().trim().max(120).optional(),
  costEuros: z.string().trim().optional(),
});

export async function createOpsTaskAction(_prev: unknown, formData: FormData): Promise<Result> {
  await guard();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  const ctx = await getAdminContext();
  const costEuros = parsed.data.costEuros?.replace(",", ".");
  const task = await getRepository().createOpsTask({
    propertyId: property.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate || null,
    assignee: parsed.data.assignee || null,
    costCents: costEuros ? Math.round(Number(costEuros) * 100) : null,
    createdBy: ctx?.userId ?? null,
  });
  await logAction("ops.create", { entity: "operations_task", entityId: task.id, meta: { kind: task.kind } });
  revalidatePath("/admin/operaciones");
  return { ok: true, id: task.id };
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "scheduled", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignee: z.string().trim().max(120).optional(),
  dueDate: z.string().trim().optional(),
  costEuros: z.string().trim().optional(),
  description: z.string().trim().max(2000).optional(),
  addPhoto: z.string().trim().url().max(600).optional(),
});

export async function updateOpsTaskAction(_prev: unknown, formData: FormData): Promise<Result> {
  await guard();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Datos no válidos" };
  const { id, status, priority, assignee, dueDate, costEuros, description, addPhoto } = parsed.data;

  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (priority) patch.priority = priority;
  if (assignee !== undefined) patch.assignee = assignee || null;
  if (dueDate !== undefined) patch.dueDate = dueDate || null;
  if (description !== undefined) patch.description = description;
  if (costEuros !== undefined && costEuros !== "") {
    patch.costCents = Math.round(Number(costEuros.replace(",", ".")) * 100);
  }
  if (addPhoto) {
    const current = await getRepository().getOpsTask(id);
    patch.photos = [...(current?.photos ?? []), addPhoto].slice(0, 20);
  }

  await getRepository().updateOpsTask(id, patch);
  await logAction("ops.update", { entity: "operations_task", entityId: id, meta: { status, priority } });
  revalidatePath("/admin/operaciones");
  return { ok: true, id };
}

export async function deleteOpsTaskAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().deleteOpsTask(id);
    await logAction("ops.delete", { entity: "operations_task", entityId: id });
  }
  revalidatePath("/admin/operaciones");
}

export async function reconcileTurnoversAction(): Promise<void> {
  await guard();
  const created = await getRepository().reconcileTurnovers();
  await logAction("ops.reconcile_turnovers", { entity: "system", meta: { created } });
  revalidatePath("/admin/operaciones");
}
