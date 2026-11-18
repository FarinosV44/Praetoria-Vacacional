import { z } from "zod";
import { PLAN_CODES } from "./catalog";
import { DOCUMENT_KINDS } from "./types";

/**
 * Validación de todo lo que llega del navegador (#175, #176). Nunca se aceptan
 * importes: solo códigos, cantidades y datos del cliente.
 */

const trimmed = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, msg).max(max, msg);
const triState = z.enum(["si", "no", "no_se"]);

export const propertyInputSchema = z.object({
  alias: trimmed(1, 80, "Pon un nombre corto a la vivienda."),
  street: trimmed(4, 160, "Indica la dirección."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "El código postal tiene 5 cifras."),
  municipality: trimmed(2, 80, "Indica el municipio."),
  province: trimmed(2, 60, "Indica la provincia."),
  hasTourismRegistry: triState,
  tourismRegistryNumber: z.string().trim().max(60).optional().default(""),
  hasSesAlta: triState,
  platforms: z.array(z.string().trim().max(40)).max(8).default([]),
  wantsSesAlta: z.boolean().default(false),
});
export type PropertyInput = z.infer<typeof propertyInputSchema>;

const taxId = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{8,10}$/, "El NIF, NIE o CIF no tiene un formato válido.");

export const ownerInputSchema = z.object({
  kind: z.enum(["particular", "empresa"]),
  legalName: trimmed(2, 160, "Indica el nombre completo o la razón social."),
  taxId,
  contactName: trimmed(2, 120, "Indica una persona de contacto."),
  email: z.string().trim().toLowerCase().email("El correo no es válido.").max(160),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s]{9,16}$/, "Indica un teléfono válido."),
  billingAddress: trimmed(6, 240, "Indica la dirección de facturación."),
});
export type OwnerInput = z.infer<typeof ownerInputSchema>;

export const engagementSchema = z.object({
  planCode: z.enum(PLAN_CODES),
  properties: z.array(propertyInputSchema).min(1, "Añade al menos una vivienda.").max(20),
  reservationCredits: z.coerce.number().int().min(0).max(200),
  historicalReview: z.boolean().default(false),
  historicalNotes: z.string().trim().max(1500).optional().default(""),
  owner: ownerInputSchema,
  password: z.string().max(128).optional().default(""),
  acceptTerms: z.literal(true, { message: "Tienes que aceptar las condiciones del servicio." }),
  acceptPrivacy: z.literal(true, {
    message: "Tienes que aceptar el tratamiento de datos y el encargo.",
  }),
  acceptMandate: z.literal(true, {
    message: "Tienes que aceptar la autorización de representación.",
  }),
  marketingOptIn: z.boolean().default(false),
});
export type EngagementInput = z.infer<typeof engagementSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida.");
const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Fecha y hora no válidas.");

export const reservationReportSchema = z
  .object({
    propertyId: z.string().uuid(),
    externalRef: z.string().trim().max(60).optional().default(""),
    channel: z.enum(["booking", "airbnb", "vrbo", "directa", "otra"]),
    bookedAt: isoDateTime,
    checkIn: isoDate,
    checkOut: isoDate,
    travellers: z.coerce.number().int().min(1).max(60),
  })
  .refine((v) => v.checkOut > v.checkIn, {
    message: "La salida debe ser posterior a la entrada.",
    path: ["checkOut"],
  });
export type ReservationReportInput = z.infer<typeof reservationReportSchema>;

/** Datos de cada viajero que exige el RD 933/2021 (Anexo I, hospedaje). */
export const travellerSchema = z.object({
  firstName: trimmed(1, 60, "Nombre obligatorio."),
  surname1: trimmed(1, 60, "Primer apellido obligatorio."),
  surname2: z.string().trim().max(60).optional().default(""),
  sex: z.enum(["H", "M", "O"]),
  docType: z.enum(["DNI", "NIE", "PAS", "OTRO", "NINGUNO"]),
  docNumber: z.string().trim().max(30).optional().default(""),
  docSupport: z.string().trim().max(30).optional().default(""),
  nationality: trimmed(2, 60, "Nacionalidad obligatoria."),
  birthDate: isoDate,
  address: trimmed(3, 160, "Dirección de residencia obligatoria."),
  city: trimmed(2, 80, "Localidad obligatoria."),
  country: trimmed(2, 60, "País de residencia obligatorio."),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().max(160).optional().default(""),
  kinship: z.string().trim().max(40).optional().default(""),
});
export type TravellerData = z.infer<typeof travellerSchema>;

export const travellerBundleSchema = z.object({
  travellers: z.array(travellerSchema).min(1).max(60),
  paymentType: z.enum(["tarjeta", "transferencia", "efectivo", "plataforma", "otro"]),
  paymentDate: isoDate.optional(),
});
export type TravellerBundle = z.infer<typeof travellerBundleSchema>;

export const documentKindSchema = z.enum(DOCUMENT_KINDS);
