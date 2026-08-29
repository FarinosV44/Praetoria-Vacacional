import { z } from "zod";
import type { RateConfig } from "./types";

const mmdd = z.string().regex(/^\d{2}-\d{2}$/, "Formato MM-DD");

export const seasonSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  start: mmdd,
  end: mmdd,
  nightlyCents: z.number().int().nonnegative(),
  weekendNightlyCents: z.number().int().nonnegative().optional(),
  minNights: z.number().int().positive().optional(),
});

export const discountSchema = z.object({
  minNights: z.number().int().positive(),
  percent: z.number().min(0).max(90),
  label: z.string().min(1),
});

export const dayRateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  nightlyCents: z.number().int().nonnegative().optional(),
  minNights: z.number().int().positive().optional(),
});

export const rateConfigSchema: z.ZodType<RateConfig> = z.object({
  propertySlug: z.string().min(1),
  currency: z.literal("EUR"),
  baseNightlyCents: z.number().int().positive(),
  weekendNightlyCents: z.number().int().positive().optional(),
  minNights: z.number().int().positive(),
  maxNights: z.number().int().nonnegative(),
  cleaningFeeCents: z.number().int().nonnegative(),
  includedGuests: z.number().int().positive(),
  extraGuestNightlyCents: z.number().int().nonnegative(),
  maxGuests: z.number().int().positive(),
  seasons: z.array(seasonSchema),
  discounts: z.array(discountSchema),
  dayRates: z.array(dayRateSchema).optional(),
  taxPercent: z.number().min(0).max(30),
  bookingWindowDays: z.number().int().nonnegative(),
  leadTimeDays: z.number().int().nonnegative(),
});

/** Returns a validated RateConfig or null if the stored value is malformed. */
export function safeRateConfig(value: unknown): RateConfig | null {
  const parsed = rateConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
