import { z } from "zod";
import { addDays, isIsoDate, nightsBetween, todayIso } from "./dates";
import { propertySlugs } from "@/domains/properties/registry";

/**
 * Shared request schemas. Every API route and server action validates its input
 * with one of these before touching the domain layer (issue #21).
 */

const isoDate = z.string().refine(isIsoDate, "Fecha no válida (formato YYYY-MM-DD)");

export const dateRangeSchema = z
  .object({
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1).max(30),
  })
  .refine((v) => v.checkIn < v.checkOut, {
    message: "La salida debe ser posterior a la entrada",
    path: ["checkOut"],
  })
  .refine((v) => v.checkIn >= todayIso(), {
    message: "La entrada no puede ser una fecha pasada",
    path: ["checkIn"],
  })
  .refine((v) => nightsBetween(v.checkIn, v.checkOut) <= 60, {
    message: "La estancia máxima consultable es de 60 noches",
    path: ["checkOut"],
  })
  .refine((v) => v.checkIn <= addDays(todayIso(), 550), {
    message: "Solo se pueden consultar fechas dentro de los próximos 18 meses",
    path: ["checkIn"],
  });

export const propertySlugSchema = z.enum(propertySlugs() as [string, ...string[]]);

export const searchSchema = dateRangeSchema;

export const quoteSchema = z.object({
  property: propertySlugSchema,
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1).max(30),
});

export const startCheckoutSchema = z.object({
  property: propertySlugSchema,
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1).max(30),
  /** Client-supplied idempotency key (UUID) to make refresh/back safe. */
  idempotencyKey: z.string().uuid(),
});

export const guestDetailsSchema = z.object({
  reservationId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(30)
    .regex(/^[+()0-9\s-]+$/, "Teléfono no válido")
    .optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar las condiciones" }) }),
  notes: z.string().trim().max(500).optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;
export type GuestDetailsInput = z.infer<typeof guestDetailsSchema>;
