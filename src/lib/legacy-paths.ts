/**
 * Old guide URLs that now 308-redirect (see `redirects()` in next.config.ts).
 * Links saved in blog posts before the move still point at them; rendering them
 * with the final URL avoids a redirect hop for visitors and crawlers (DinoRANK
 * flagged them as internal 3XX links). Keep in sync with next.config.ts.
 */
const EXACT: Record<string, string> = {
  "/guias/valencia/guia-playas-de-valencia": "/guias/valencia-playa",
  "/guias/javalambre/guia-de-javalambre": "/guias/javalambre",
};

export function currentInternalPath(href: string): string {
  const m = href.match(/^([^?#]*)(.*)$/);
  const path = m?.[1] ?? href;
  const rest = m?.[2] ?? "";
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  if (EXACT[clean]) return EXACT[clean] + rest;
  const valencia = clean.match(/^\/guias\/valencia\/([^/]+)$/);
  if (valencia) return `/guias/valencia-playa/${valencia[1]}${rest}`;
  return href;
}
