/**
 * Where to go after signing in: the `next` query param when it is an admin
 * path on this site, else the dashboard. Rejects absolute and protocol-relative
 * URLs so the login page can never bounce someone to another site.
 */
export function safeAdminNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//") || raw.includes("\\")) return "/admin";
  if (raw.startsWith("/admin/login")) return "/admin";
  return raw;
}
