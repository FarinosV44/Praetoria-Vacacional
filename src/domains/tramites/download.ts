import "server-only";
import type { OwnerDocument } from "./types";

/** Respuesta de descarga segura: siempre adjunto, sin caché y sin «sniffing». */
export function fileResponse(doc: OwnerDocument, bytes: Uint8Array): Response {
  const ascii = doc.filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
