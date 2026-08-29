import type { Customer } from "./types";

/**
 * Duplicate detection for the CRM (issue #56 §4). Pure functions — tested in
 * isolation, no repository. A candidate matches on any of: email, phone,
 * document number, or (name AND (email OR phone)).
 */

export function normalizeEmail(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

/** Keep the last 9 digits so "+34 649 18 12 90" and "649181290" collide. */
export function normalizePhone(v: string | null | undefined): string {
  const digits = (v ?? "").replace(/\D+/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export function normalizeDoc(v: string | null | undefined): string {
  return (v ?? "").replace(/[\s.-]+/g, "").toUpperCase();
}

export function normalizeName(v: string | null | undefined): string {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const fullName = (c: Pick<Customer, "firstName" | "lastName">) =>
  normalizeName(`${c.firstName} ${c.lastName}`);

export interface DuplicateMatch {
  customer: Customer;
  reasons: string[];
  /** Higher = more confident. email/doc = 3, phone = 2, name+contact = 2. */
  score: number;
}

export function matchReasons(
  a: Pick<Customer, "firstName" | "lastName" | "email" | "phone" | "docNumber">,
  b: Pick<Customer, "firstName" | "lastName" | "email" | "phone" | "docNumber">,
): { reasons: string[]; score: number } {
  const reasons: string[] = [];
  let score = 0;

  const emailA = normalizeEmail(a.email);
  const emailB = normalizeEmail(b.email);
  const emailMatch = !!emailA && emailA === emailB;
  if (emailMatch) {
    reasons.push("mismo email");
    score += 3;
  }

  const docA = normalizeDoc(a.docNumber);
  const docB = normalizeDoc(b.docNumber);
  if (docA && docA === docB) {
    reasons.push("mismo documento");
    score += 3;
  }

  const phoneA = normalizePhone(a.phone);
  const phoneB = normalizePhone(b.phone);
  const phoneMatch = !!phoneA && phoneA === phoneB;
  if (phoneMatch) {
    reasons.push("mismo teléfono");
    score += 2;
  }

  const nameA = fullName(a);
  const nameB = fullName(b);
  if (nameA && nameA === nameB && (emailMatch || phoneMatch)) {
    reasons.push("mismo nombre y contacto");
    score += 2;
  }

  return { reasons, score };
}

export function findDuplicates(target: Customer, all: Customer[]): DuplicateMatch[] {
  return all
    .filter((c) => c.id !== target.id && !c.mergedInto)
    .map((c) => ({ customer: c, ...matchReasons(target, c) }))
    .filter((m) => m.reasons.length > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Field-level merge: the primary wins where it has a value, the duplicate fills
 * the gaps. Consent is OR-ed (keeping the earliest timestamp). Notes are joined.
 */
export function mergedFields(primary: Customer, duplicate: Customer): Customer {
  const pick = <K extends keyof Customer>(k: K): Customer[K] =>
    (primary[k] ?? null) !== null && primary[k] !== "" ? primary[k] : duplicate[k];

  const consent = primary.marketingConsent || duplicate.marketingConsent;
  const consentAt =
    [primary.marketingConsentAt, duplicate.marketingConsentAt]
      .filter((x): x is string => !!x)
      .sort()[0] ?? null;

  const notes = [primary.notes, duplicate.notes].filter(Boolean).join("\n---\n") || null;

  return {
    ...primary,
    firstName: primary.firstName || duplicate.firstName,
    lastName: primary.lastName || duplicate.lastName,
    email: pick("email"),
    phone: pick("phone"),
    whatsapp: pick("whatsapp"),
    docType: pick("docType"),
    docNumber: pick("docNumber"),
    address: pick("address"),
    postalCode: pick("postalCode"),
    city: pick("city"),
    province: pick("province"),
    country: pick("country"),
    language: pick("language"),
    channelOrigin: primary.channelOrigin ?? duplicate.channelOrigin,
    marketingConsent: consent,
    marketingConsentAt: consent ? consentAt : null,
    marketingConsentSource: primary.marketingConsentSource ?? duplicate.marketingConsentSource,
    notes,
  };
}
