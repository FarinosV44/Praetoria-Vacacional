import type { ContentStatus } from "@/domains/properties/types";

/**
 * Renders a small, honest note when a content block is still a placeholder
 * (decision D-004). Keeps the platform from ever presenting unverified data as
 * confirmed fact, while letting the rest of the page ship.
 */
export function ContentStatusNote({
  status,
  what,
}: {
  status: ContentStatus;
  what: string;
}) {
  if (status === "authored") return null;
  return (
    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {what} pendiente de confirmación por el propietario. Se completará antes de la publicación
      definitiva.
    </p>
  );
}
