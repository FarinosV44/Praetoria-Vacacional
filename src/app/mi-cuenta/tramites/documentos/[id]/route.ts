import { getOwnerContext } from "@/domains/tramites/context";
import { ownerDownload } from "@/domains/tramites/service";
import { fileResponse } from "@/domains/tramites/download";

export const dynamic = "force-dynamic";

/**
 * Descarga de un documento por su propietario. La fila se lee con la sesión del
 * cliente (RLS) y se comprueba la pertenencia; el archivo sale del bucket
 * privado con la misma sesión. Un id ajeno devuelve 404 (no revela si existe).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOwnerContext();
  if (!ctx) return new Response("No autorizado", { status: 401, headers: { "Cache-Control": "no-store" } });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const file = await ownerDownload(ctx, id);
  if (!file) return new Response("No encontrado", { status: 404, headers: { "Cache-Control": "no-store" } });
  return fileResponse(file.doc, file.bytes);
}
