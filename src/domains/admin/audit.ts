import "server-only";
import { getRepository } from "@/lib/repository";
import { getAdminContext } from "./context";

/**
 * Record a critical admin action (issue #56 §10; actor resolved per-user in
 * issue #65). Never throws — an audit-log failure must not block the operation
 * it describes.
 */
export async function logAction(
  action: string,
  opts: { entity?: string; entityId?: string | null; meta?: unknown } = {},
): Promise<void> {
  try {
    const ctx = await getAdminContext().catch(() => null);
    await getRepository().auditLog({
      actorEmail: ctx?.email ?? "admin",
      action,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      meta: opts.meta ?? {},
    });
  } catch {
    /* audit failure never blocks the action */
  }
}
