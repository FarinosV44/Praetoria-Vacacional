import { getAdminContext } from "@/domains/admin/context";
import { can } from "@/domains/admin/roles";
import { adminDownload } from "@/domains/tramites/service";
import { fileResponse } from "@/domains/tramites/download";

export const dynamic = "force-dynamic";

/** Descarga interna de documentos de clientes: exige permiso de trámites y queda auditada. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext();
  if (!ctx || ctx.needsMfa || !can(ctx.role, "tramites.write"))
    return new Response("No autorizado", { status: 403, headers: { "Cache-Control": "no-store" } });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const file = await adminDownload(id, { type: "admin", id: ctx.email, label: ctx.fullName ?? ctx.email });
  if (!file) return new Response("No encontrado", { status: 404 });
  return fileResponse(file.doc, file.bytes);
}
