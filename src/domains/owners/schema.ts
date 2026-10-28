import { z } from "zod";
import { OWNER_LICENCE, OWNER_LOCATIONS, OWNER_ZONES } from "./types";

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

/** Raw fields of the public "Propietarios" form (strings from FormData). */
export const ownerLeadFormSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre").max(120),
  phone: z
    .string()
    .trim()
    .min(6, "Indica un teléfono de contacto")
    .max(30)
    .regex(/^[+()\d\s.-]+$/, "El teléfono no es válido"),
  email: z.string().trim().email("El correo no es válido").max(200),
  zone: z.enum(values(OWNER_ZONES), { message: "Elige la zona" }),
  location: z.enum(values(OWNER_LOCATIONS), { message: "Elige la ubicación" }),
  bedrooms: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n >= 0 && n <= 20), "Número de dormitorios no válido"),
  licence: z.enum(values(OWNER_LICENCE), { message: "Indica si tiene licencia" }),
  onPlatforms: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  message: z.string().trim().max(2000).optional().default(""),
  consent: z.literal("on", { message: "Debes aceptar la política de privacidad" }),
  /** Honeypot — real people never fill it. */
  website: z.string().max(0).optional(),
});

export type OwnerLeadFormValues = z.infer<typeof ownerLeadFormSchema>;
