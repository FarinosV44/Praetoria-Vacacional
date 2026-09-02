/**
 * Role architecture (issue #56 §10 → multi-user in issue #65). Every admin user
 * has a role; every mutating server action checks a capability, never a raw "is
 * authenticated". The current user/role comes from `getAdminContext()`.
 */
export type AdminRole = "admin" | "gestion" | "lectura";

export type Capability =
  | "reservations.write"
  | "customers.write"
  | "invoices.write"
  | "calendar.write"
  | "marketing.write"
  | "promotions.write"
  | "content.write"
  | "settings.write";

const MATRIX: Record<AdminRole, Capability[]> = {
  // full control
  admin: [
    "reservations.write",
    "customers.write",
    "invoices.write",
    "calendar.write",
    "marketing.write",
    "promotions.write",
    "content.write",
    "settings.write",
  ],
  // day-to-day operations, no configuration
  gestion: [
    "reservations.write",
    "customers.write",
    "invoices.write",
    "calendar.write",
    "marketing.write",
    "promotions.write",
    "content.write",
  ],
  // read-only
  lectura: [],
};

export const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Administrador",
  gestion: "Gestión",
  lectura: "Solo lectura",
};

export function can(role: AdminRole, cap: Capability): boolean {
  return MATRIX[role].includes(cap);
}

/** Capabilities that demand an MFA (AAL2) session when the user has MFA required. */
export const MFA_GATED: Capability[] = ["settings.write", "invoices.write"];

/** The current user's role, or `lectura` when nobody is authenticated. */
export async function getCurrentRole(): Promise<AdminRole> {
  const { getAdminContext } = await import("./context");
  const ctx = await getAdminContext();
  return ctx?.role ?? "lectura";
}

/**
 * Throws if the current user cannot perform `cap`. Call at the top of every
 * mutating server action (after the auth check).
 */
export async function assertCapability(cap: Capability): Promise<void> {
  const { getAdminContext } = await import("./context");
  const ctx = await getAdminContext();
  if (!ctx) throw new Error("SIN_PERMISO: sesión no válida");
  if (!can(ctx.role, cap)) {
    throw new Error(`SIN_PERMISO: el rol «${ROLE_LABEL[ctx.role]}» no puede ${cap}`);
  }
  if (ctx.mfaRequired && ctx.mfaLevel !== "aal2" && MFA_GATED.includes(cap)) {
    throw new Error("MFA_REQUERIDO: completa la verificación en dos pasos para esta acción");
  }
}
