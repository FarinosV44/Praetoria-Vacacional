import { env } from "@/lib/env";

/**
 * Role architecture (issue #56 §10). Today there is a single admin login whose
 * role comes from `ADMIN_ROLE` (default `admin`). The capability matrix is the
 * seam a real multi-user system plugs into later — every mutating server action
 * checks a capability, never a raw "is authenticated".
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

export function currentRole(): AdminRole {
  return env.adminRole;
}

export function can(role: AdminRole, cap: Capability): boolean {
  return MATRIX[role].includes(cap);
}

/** Throws if the current role lacks the capability. Call at the top of a mutating action. */
export function assertCapability(cap: Capability): void {
  if (!can(currentRole(), cap)) {
    throw new Error(`SIN_PERMISO: el rol «${ROLE_LABEL[currentRole()]}» no puede ${cap}`);
  }
}
