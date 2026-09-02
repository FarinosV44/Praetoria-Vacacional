"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { addDays, isIsoDate } from "@/lib/dates";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

async function guard() {
  await assertCapability("calendar.write");
}

function selectedDates(formData: FormData): string[] {
  return [...new Set(formData.getAll("date").map(String).filter(isIsoDate))].sort();
}

async function propertyFromForm(formData: FormData) {
  const property = getPropertyBySlug(String(formData.get("propertySlug") ?? ""));
  if (!property) throw new Error("Alojamiento no encontrado");
  return property;
}

function revalidateFor(slug: string) {
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/precios");
  revalidatePath(`/${slug}`);
  revalidatePath(`/en/${slug}`);
}

/** Contiguous runs of sorted ISO dates → [start, endExclusive) ranges. */
function contiguousRanges(dates: string[]): [string, string][] {
  const ranges: [string, string][] = [];
  let start: string | null = null;
  let prev: string | null = null;
  for (const d of dates) {
    if (start === null) {
      start = d;
    } else if (prev !== null && addDays(prev, 1) !== d) {
      ranges.push([start, addDays(prev, 1)]);
      start = d;
    }
    prev = d;
  }
  if (start !== null && prev !== null) ranges.push([start, addDays(prev, 1)]);
  return ranges;
}

const priceSchema = z.coerce.number().min(0).max(100000);
const minNightsSchema = z.coerce.number().int().min(1).max(60);

export async function applyDayPriceAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (!dates.length) return { ok: false, error: "Selecciona al menos un día" };
  const parsed = priceSchema.safeParse(formData.get("priceEuros"));
  if (!parsed.success) return { ok: false, error: "Precio no válido" };
  await getRepository().setDailyRates(property.id, dates, {
    nightlyCents: Math.round(parsed.data * 100),
  });
  revalidateFor(property.slug);
  return { ok: true };
}

const percentSchema = z.coerce.number().min(-90).max(300);

/** Adjust the effective nightly price of the selected days by ±percent (issue #60 §4E). */
export async function applyDayPricePercentAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (!dates.length) return { ok: false, error: "Selecciona al menos un día" };
  const parsed = percentSchema.safeParse(formData.get("percent"));
  if (!parsed.success) return { ok: false, error: "Porcentaje no válido" };

  const { resolveRateConfig } = await import("@/domains/pricing/resolve");
  const { nightlyRateCents } = await import("@/domains/pricing/engine");
  const config = await resolveRateConfig(property.slug);
  if (!config) return { ok: false, error: "Sin tarifa configurada" };

  const factor = 1 + parsed.data / 100;
  const repo = getRepository();
  for (const date of dates) {
    const current = nightlyRateCents(config, date);
    await repo.setDailyRates(property.id, [date], {
      nightlyCents: Math.max(0, Math.round(current * factor)),
    });
  }
  await logAction("calendar.price_percent", {
    entity: "property",
    entityId: property.id,
    meta: { dates: dates.length, percent: parsed.data },
  });
  revalidateFor(property.slug);
  return { ok: true };
}

export async function applyDayMinNightsAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (!dates.length) return { ok: false, error: "Selecciona al menos un día" };
  const parsed = minNightsSchema.safeParse(formData.get("minNights"));
  if (!parsed.success) return { ok: false, error: "Estancia mínima no válida" };
  await getRepository().setDailyRates(property.id, dates, { minNights: parsed.data });
  revalidateFor(property.slug);
  return { ok: true };
}

export async function clearDayRatesAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (dates.length) await getRepository().clearDailyRates(property.id, dates);
  revalidateFor(property.slug);
}

export async function closeDatesAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (!dates.length) return { ok: false, error: "Selecciona al menos un día" };
  const repo = getRepository();
  const summary = String(formData.get("summary") || "Cerrado (calendario)");
  try {
    for (const [start, end] of contiguousRanges(dates)) {
      await repo.createBlock({
        propertyId: property.id,
        startDate: start,
        endDate: end,
        source: "manual",
        summary,
      });
    }
  } catch (err) {
    if (err instanceof PropertyUnavailableError) {
      return { ok: false, error: "Algunas fechas ya están reservadas o bloqueadas" };
    }
    throw err;
  }
  await logAction("calendar.close_dates", {
    entity: "property",
    entityId: property.id,
    meta: { dates: dates.length },
  });
  revalidateFor(property.slug);
  return { ok: true };
}

export async function openDatesAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await guard();
  const property = await propertyFromForm(formData);
  const dates = new Set(selectedDates(formData));
  const repo = getRepository();
  const blocks = await repo.listBlocks(property.id);
  for (const b of blocks) {
    if (b.source !== "manual") continue;
    // does this manual block cover any selected date?
    let covers = false;
    for (const d of dates) {
      if (d >= b.startDate && d < b.endDate) {
        covers = true;
        break;
      }
    }
    if (covers) await repo.deleteBlock(b.id);
  }
  revalidateFor(property.slug);
}
