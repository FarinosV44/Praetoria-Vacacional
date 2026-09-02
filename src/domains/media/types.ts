/**
 * Issue #81 — media library. Assets live in the Supabase Storage `media` bucket
 * (private); `media_assets` rows carry the metadata (ALT text, focal point,
 * tags) and the app mints signed URLs on demand.
 */

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  /** 0–1 fractions → object-position when the image is cropped. */
  focalX: number;
  focalY: number;
  tags: string[];
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Populated by the repository: a time-limited URL to display the file. */
  signedUrl?: string;
}

export interface MediaUploadInput {
  path: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt?: string;
  tags?: string[];
  uploadedBy?: string | null;
}

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function isAllowedUpload(mime: string, sizeBytes: number): { ok: boolean; error?: string } {
  if (!ALLOWED_MIME.includes(mime)) return { ok: false, error: "Tipo de archivo no permitido" };
  if (sizeBytes > MAX_UPLOAD_BYTES) return { ok: false, error: "El archivo supera el límite de 15 MB" };
  return { ok: true };
}

/** Object-position CSS from a focal point. */
export function focalToObjectPosition(x: number, y: number): string {
  const clamp = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100);
  return `${clamp(x)}% ${clamp(y)}%`;
}

export function extensionFor(mime: string): string {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
      "image/gif": "gif",
      "application/pdf": "pdf",
    }[mime] ?? "bin"
  );
}
