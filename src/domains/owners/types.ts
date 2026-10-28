/**
 * Owner acquisition ("Propietarios") — leads from owners who want Praetoria
 * Vacacional to manage and market their holiday rental.
 *
 * Stored one document per key in the shared `content_overrides` KV
 * (`lead:owner:<id>`), the same no-migration approach as the blog (issue #57),
 * so it works identically in DEMO (memory) and Supabase modes.
 */

export const OWNER_ZONES = [
  { value: "llastra-palmeres", label: "La Llastra / Les Palmeres (Sueca)" },
  { value: "perello", label: "El Perelló" },
  { value: "cullera", label: "Cullera" },
  { value: "sueca-otras", label: "Otra playa de Sueca (Mareny, Bega de Mar…)" },
  { value: "camarena", label: "Camarena de la Sierra" },
  { value: "javalambre", label: "Otro pueblo de la sierra de Javalambre" },
  { value: "otra", label: "Otra zona" },
] as const;

export const OWNER_LOCATIONS = [
  { value: "primera-linea", label: "Primera línea de playa" },
  { value: "cerca-playa", label: "Cerca de la playa" },
  { value: "montana", label: "Montaña / pueblo" },
  { value: "otra", label: "Otra" },
] as const;

export const OWNER_LICENCE = [
  { value: "si", label: "Sí, ya tiene licencia turística" },
  { value: "no", label: "No, todavía no" },
  { value: "no-se", label: "No lo sé" },
] as const;

export type OwnerZone = (typeof OWNER_ZONES)[number]["value"];
export type OwnerLocation = (typeof OWNER_LOCATIONS)[number]["value"];
export type OwnerLicence = (typeof OWNER_LICENCE)[number]["value"];

export type OwnerLeadStatus = "nuevo" | "contactado" | "propuesta" | "cerrado" | "descartado";

export interface OwnerLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  zone: OwnerZone;
  location: OwnerLocation;
  bedrooms: number | null;
  licence: OwnerLicence;
  onPlatforms: boolean;
  message: string;
  status: OwnerLeadStatus;
  source: string;
  createdAt: string;
}

export function labelFor<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: string,
): string {
  return list.find((o) => o.value === value)?.label ?? value;
}
