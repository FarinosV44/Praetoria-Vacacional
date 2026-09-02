/**
 * Issue #72 — Spain traveller registry (SES.HOSPEDAJES, RD 933/2021).
 */

export type DocType = "DNI" | "NIE" | "PAS" | "OTRO";
export type Gender = "H" | "M" | "O";

export interface Traveller {
  id: string;
  reservationId: string;
  fullName: string;
  firstSurname: string | null;
  secondSurname: string | null;
  docType: DocType;
  docNumber: string;
  docSupport: string | null;
  nationality: string;
  birthDate: string | null;
  gender: Gender | null;
  phone: string | null;
  email: string | null;
  addressCountry: string;
  addressLine: string | null;
  municipality: string | null;
  province: string | null;
  postalCode: string | null;
  kinship: string | null;
  isLead: boolean;
  paymentMethod: string | null;
  signedAt: string | null;
  sentAt: string | null;
  sentRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TravellerInput {
  reservationId: string;
  fullName: string;
  firstSurname?: string | null;
  secondSurname?: string | null;
  docType: DocType;
  docNumber: string;
  docSupport?: string | null;
  nationality?: string;
  birthDate?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  addressCountry?: string;
  addressLine?: string | null;
  municipality?: string | null;
  province?: string | null;
  postalCode?: string | null;
  kinship?: string | null;
  isLead?: boolean;
  paymentMethod?: string | null;
}

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  DNI: "DNI",
  NIE: "NIE / TIE",
  PAS: "Pasaporte",
  OTRO: "Otro documento",
};
