import type { ReservationSource } from "@/domains/booking/types";
import type { IsoDate } from "@/lib/dates";

export type DocType = "dni" | "nie" | "passport" | "cif" | "other";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  docType: DocType | null;
  docNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  language: string | null;
  channelOrigin: ReservationSource | null;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  marketingConsentSource: string | null;
  notes: string | null;
  /** Set when this record was folded into another; such rows are hidden. */
  mergedInto: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  docType?: DocType | null;
  docNumber?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  language?: string | null;
  channelOrigin?: ReservationSource | null;
  marketingConsent?: boolean;
  marketingConsentSource?: string | null;
  notes?: string | null;
}

export interface CustomerFilter {
  /** Substring over name / email / phone / doc number. */
  q?: string;
  property?: string;
  channel?: ReservationSource;
  consentOnly?: boolean;
  repeatersOnly?: boolean;
}

/** A customer plus the stats derived from their reservations/invoices. */
export interface CustomerProfile extends Customer {
  fullName: string;
  reservationCount: number;
  confirmedCount: number;
  totalSpentCents: number;
  propertiesVisited: string[]; // property ids
  lastPropertyId: string | null;
  lastStay: IsoDate | null;
  firstStay: IsoDate | null;
  couponsUsed: string[];
  channels: ReservationSource[];
}

export const displayName = (c: Pick<Customer, "firstName" | "lastName" | "email">): string =>
  [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.email || "Sin nombre";
