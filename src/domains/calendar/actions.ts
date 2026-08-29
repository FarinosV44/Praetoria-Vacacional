"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { addDays, isIsoDate } from "@/lib/dates";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
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

export async function applyDayMinNightsAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
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
  const property = await propertyFromForm(formData);
  const dates = selectedDates(formData);
  if (dates.length) await getRepository().clearDailyRates(property.id, dates);
  revalidateFor(property.slug);
}

export async function closeDatesAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
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
  revalidateFor(property.slug);
  return { ok: true };
}

export async function openDatesAction(formData: FormData): Promise<void> {
  await assertAdmin();
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
