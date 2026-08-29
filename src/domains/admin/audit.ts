import "server-only";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";

/**
 * Record a critical admin action (issue #56 §10). Never throws — an audit-log
 * failure must not block the operation it describes.
 */
export async function logAction(
  action: string,
  opts: { entity?: string; entityId?: string | null; meta?: unknown } = {},
): Promise<void> {
  try {
    await getRepository().auditLog({
      actorEmail: env.adminEmails[0] ?? "admin",
      action,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      meta: opts.meta ?? {},
    });
  } catch {
    /* audit failure never blocks the action */
  }
}
