/**
 * Issue #176 — control de subida de documentos.
 *
 * El tipo se decide por la FIRMA real del fichero (bytes mágicos), no por la
 * extensión ni por el `type` que manda el navegador. Solo PDF, PNG y JPEG, con
 * un tamaño máximo. No hay antivirus en el servidor: los ficheros quedan en un
 * bucket privado, nunca se sirven en línea (siempre como descarga) y el equipo
 * los revisa antes de validarlos (decisión D-050).
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;
export type AllowedMime = "application/pdf" | "image/png" | "image/jpeg";

export function sniffMime(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d)
    return "application/pdf"; // %PDF-
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

/** Nombre visible seguro: sin rutas, sin caracteres de control, longitud acotada. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "documento";
  const cleaned = base
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "documento";
}

export type UploadCheck =
  | { ok: true; mime: AllowedMime; filename: string }
  | { ok: false; error: string };

export function checkUpload(name: string, bytes: Uint8Array): UploadCheck {
  if (bytes.length === 0) return { ok: false, error: "El archivo está vacío." };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "El archivo supera los 10 MB." };
  const filename = sanitizeFilename(name);
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext))
    return { ok: false, error: "Solo se admiten archivos PDF, PNG o JPG." };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, error: "El contenido del archivo no es un PDF, PNG o JPG válido." };
  const expected: Record<string, AllowedMime> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
  if (expected[ext] !== mime) return { ok: false, error: "La extensión no coincide con el contenido del archivo." };
  return { ok: true, mime, filename };
}
