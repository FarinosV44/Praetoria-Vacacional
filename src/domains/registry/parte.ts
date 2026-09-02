/**
 * Issue #72 — pure "parte de viajeros" builder + validation.
 *
 * `validateTraveller` enforces the minimum RD 933/2021 data set. `buildParte`
 * assembles the transmission payload for one reservation: the establishment
 * block, the contract/stay block and the traveller list. The actual submission
 * to SES.HOSPEDAJES lives in `submit.ts` and is gated on credentials.
 */

import type { Traveller } from "./types";

export interface ParteEstablishment {
  code: string; // Código de arrendador / establecimiento (SES.HOSPEDAJES)
  name: string;
  nif: string;
  address: string;
  municipality: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface ParteStay {
  reference: string; // localizador
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  internetAccess: boolean;
}

export interface Parte {
  establishment: ParteEstablishment;
  stay: ParteStay;
  travellers: {
    nombre: string;
    apellido1: string | null;
    apellido2: string | null;
    tipoDocumento: string;
    numeroDocumento: string;
    soporteDocumento: string | null;
    nacionalidad: string;
    fechaNacimiento: string | null;
    sexo: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: {
      pais: string;
      direccion: string | null;
      municipio: string | null;
      provincia: string | null;
      codigoPostal: string | null;
    };
    parentesco: string | null;
    formaPago: string | null;
  }[];
}

export interface TravellerValidationIssue {
  field: string;
  message: string;
}

const DNI_RE = /^[0-9]{7,8}[A-Za-z]$/;
const NIE_RE = /^[XYZxyz][0-9]{7}[A-Za-z]$/;

export function validateTraveller(t: Partial<Traveller>): TravellerValidationIssue[] {
  const issues: TravellerValidationIssue[] = [];
  if (!t.fullName?.trim()) issues.push({ field: "fullName", message: "Nombre y apellidos obligatorios" });
  if (!t.docNumber?.trim()) {
    issues.push({ field: "docNumber", message: "Número de documento obligatorio" });
  } else if (t.docType === "DNI" && !DNI_RE.test(t.docNumber.trim())) {
    issues.push({ field: "docNumber", message: "Formato de DNI no válido" });
  } else if (t.docType === "NIE" && !NIE_RE.test(t.docNumber.trim())) {
    issues.push({ field: "docNumber", message: "Formato de NIE no válido" });
  }
  if (!t.nationality?.trim()) issues.push({ field: "nationality", message: "Nacionalidad obligatoria" });
  if (!t.birthDate) issues.push({ field: "birthDate", message: "Fecha de nacimiento obligatoria" });
  if (!t.paymentMethod?.trim()) {
    issues.push({ field: "paymentMethod", message: "Forma de pago obligatoria (RD 933/2021)" });
  }
  // Spanish residents must give a municipality + province.
  if ((t.addressCountry ?? "ESP") === "ESP") {
    if (!t.municipality?.trim()) issues.push({ field: "municipality", message: "Municipio obligatorio para residentes en España" });
    if (!t.province?.trim()) issues.push({ field: "province", message: "Provincia obligatoria para residentes en España" });
  }
  return issues;
}

export function isMinor(birthDate: string | null, refDate: string): boolean {
  if (!birthDate) return false;
  const b = new Date(`${birthDate}T00:00:00Z`);
  const ref = new Date(`${refDate}T00:00:00Z`);
  let age = ref.getUTCFullYear() - b.getUTCFullYear();
  const m = ref.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < b.getUTCDate())) age -= 1;
  return age < 18;
}

export function buildParte(
  establishment: ParteEstablishment,
  stay: ParteStay,
  travellers: Traveller[],
): Parte {
  return {
    establishment,
    stay,
    travellers: travellers.map((t) => ({
      nombre: t.fullName,
      apellido1: t.firstSurname,
      apellido2: t.secondSurname,
      tipoDocumento: t.docType,
      numeroDocumento: t.docNumber,
      soporteDocumento: t.docSupport,
      nacionalidad: t.nationality,
      fechaNacimiento: t.birthDate,
      sexo: t.gender,
      telefono: t.phone,
      correo: t.email,
      direccion: {
        pais: t.addressCountry,
        direccion: t.addressLine,
        municipio: t.municipality,
        provincia: t.province,
        codigoPostal: t.postalCode,
      },
      parentesco: t.kinship,
      formaPago: t.paymentMethod,
    })),
  };
}

/** How complete is the parte for a reservation of `expectedGuests`? */
export function registryStatus(
  travellers: Traveller[],
  expectedGuests: number,
  checkIn: string,
): { complete: boolean; valid: number; invalid: number; missing: number; sent: boolean } {
  let valid = 0;
  let invalid = 0;
  for (const t of travellers) {
    if (validateTraveller({ ...t }).length === 0) valid += 1;
    else invalid += 1;
    void checkIn;
  }
  const missing = Math.max(0, expectedGuests - travellers.length);
  return {
    complete: missing === 0 && invalid === 0 && valid > 0,
    valid,
    invalid,
    missing,
    sent: travellers.length > 0 && travellers.every((t) => !!t.sentAt),
  };
}
