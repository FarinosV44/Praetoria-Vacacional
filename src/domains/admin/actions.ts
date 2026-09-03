"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated, createAdminSession, destroyAdminSession, verifyPassword } from "./auth";
import { env } from "@/lib/env";
import { getRepository, PropertyUnavailableError } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { isIsoDate } from "@/lib/dates";
import { getRateConfig } from "@/content/rates";
import { rateConfigSchema } from "@/domains/pricing/schema";
import { assertCapability } from "./roles";
import { logAction } from "./audit";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Supabase Auth path (issue #65) — used when ADMIN_SUPABASE_AUTH is on and the
  // form supplied an email. Per-user accounts, MFA, revocable sessions.
  if (env.adminSupabaseAuth && email) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { ok: false, error: "Credenciales incorrectas" };
    }
    const repo = getRepository();
    const row =
      (await repo.getAdminUserById(data.user.id).catch(() => null)) ??
      (await repo.getAdminUserByEmail(email).catch(() => null));
    if (!row || (!row.active && !row.inviteTokenHash)) {
      await supabase.auth.signOut();
      return { ok: false, error: "Esta cuenta no tiene acceso al panel" };
    }
    return { ok: true };
  }

  // Password-cookie path (DEMO, or single-login deployments).
  if (!verifyPassword(password)) return { ok: false, error: "Contraseña incorrecta" };
  await createAdminSession();
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  if (env.adminSupabaseAuth) {
    try {
      const { supabaseServer } = await import("@/lib/supabase/server");
      await (await supabaseServer()).auth.signOut();
    } catch {
      /* best effort */
    }
  }
}

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const blockSchema = z.object({
  propertySlug: z.string(),
  startDate: z.string().refine(isIsoDate),
  endDate: z.string().refine(isIsoDate),
  summary: z.string().max(200).optional(),
});

export async function createBlockAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = blockSchema.safeParse({
    propertySlug: formData.get("propertySlug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    summary: formData.get("summary") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Datos del bloqueo no válidos" };
  if (parsed.data.startDate >= parsed.data.endDate)
    return { ok: false, error: "La fecha de fin debe ser posterior al inicio" };

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  try {
    await getRepository().createBlock({
      propertyId: property.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      source: "manual",
      summary: parsed.data.summary ?? "Bloqueo manual",
    });
  } catch (err) {
    if (err instanceof PropertyUnavailableError)
      return { ok: false, error: "Esas fechas se solapan con una reserva o bloqueo existente" };
    return { ok: false, error: "No se pudo crear el bloqueo" };
  }
  revalidatePath("/admin/calendario");
  revalidatePath(`/${property.slug}`);
  return { ok: true };
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().deleteBlock(id);
  revalidatePath("/admin/calendario");
}

const num = (fd: FormData, key: string) => Number(fd.get(key));

export async function updateRatesAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const slug = String(formData.get("propertySlug") ?? "");
  const property = getPropertyBySlug(slug);
  const current = getRateConfig(slug);
  if (!property || !current) return { ok: false, error: "Alojamiento no encontrado" };

  let seasons = current.seasons;
  let discounts = current.discounts;
  try {
    const rawSeasons = String(formData.get("seasons") ?? "").trim();
    const rawDiscounts = String(formData.get("discounts") ?? "").trim();
    if (rawSeasons) seasons = JSON.parse(rawSeasons);
    if (rawDiscounts) discounts = JSON.parse(rawDiscounts);
  } catch {
    return { ok: false, error: "El JSON de temporadas o descuentos no es válido" };
  }

  // Optional per-stay charges (issue #58). One row per `fee_<i>_*` group.
  const feeCount = Math.min(20, Math.max(0, num(formData, "feeCount") || 0));
  const fees = Array.from({ length: feeCount }, (_, i) => {
    const key = String(formData.get(`fee_${i}_key`) ?? "").trim();
    const label = String(formData.get(`fee_${i}_label`) ?? "").trim();
    const description = String(formData.get(`fee_${i}_description`) ?? "").trim();
    return {
      key,
      label: label || key,
      enabled: formData.get(`fee_${i}_enabled`) != null,
      amountCents: Math.max(0, Math.round(num(formData, `fee_${i}_amount`) || 0)),
      ...(description ? { description } : {}),
    };
  }).filter((f) => f.key);

  const candidate = {
    ...current,
    propertySlug: slug,
    currency: "EUR" as const,
    baseNightlyCents: num(formData, "baseNightlyCents"),
    weekendNightlyCents: num(formData, "weekendNightlyCents") || undefined,
    minNights: num(formData, "minNights"),
    maxNights: num(formData, "maxNights"),
    sellExactGaps: formData.get("sellExactGaps") != null,
    cleaningFeeCents: 0, // superseded by `fees`
    fees,
    includedGuests: num(formData, "includedGuests"),
    extraGuestNightlyCents: num(formData, "extraGuestNightlyCents"),
    maxGuests: num(formData, "maxGuests"),
    taxPercent: num(formData, "taxPercent"),
    bookingWindowDays: num(formData, "bookingWindowDays"),
    leadTimeDays: num(formData, "leadTimeDays"),
    seasons,
    discounts,
  };

  const parsed = rateConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: "Valores no válidos: " + parsed.error.issues[0]?.message };
  }

  await getRepository().setRateOverride(property.id, parsed.data);
  revalidatePath(`/${slug}`);
  revalidatePath(`/en/${slug}`);
  revalidatePath("/admin/precios");
  return { ok: true };
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("reservations.write");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Cancelada desde administración");
  if (id) {
    await getRepository().cancelReservation(id, reason);
    // Retire any pending guest lifecycle messages (issue #69).
    await getRepository().cancelReservationMessages(id).catch(() => undefined);
    await logAction("reservation.cancel", { entity: "reservation", entityId: id, meta: { reason } });
  }
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
}

const couponFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
    kind: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().positive(),
    propertySlug: z.string().optional(),
    startsOn: z.string().optional(),
    endsOn: z.string().optional(),
    minNights: z.coerce.number().int().min(0).default(0),
    minTotalEuros: z.coerce.number().min(0).default(0),
    maxUses: z.string().optional(),
    maxUsesPerEmail: z.string().optional(),
    active: z.coerce.boolean().default(true),
    description: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.kind !== "percent" || (v.value >= 1 && v.value <= 100), {
    message: "El porcentaje debe estar entre 1 y 100",
    path: ["value"],
  });

export async function saveCouponAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = couponFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const d = parsed.data;
  const input = {
    code: d.code,
    kind: d.kind,
    value: d.kind === "fixed" ? Math.round(d.value * 100) : d.value,
    propertySlug: d.propertySlug && d.propertySlug !== "all" ? d.propertySlug : null,
    startsOn: d.startsOn || null,
    endsOn: d.endsOn || null,
    minNights: d.minNights,
    minTotalCents: Math.round(d.minTotalEuros * 100),
    maxUses: d.maxUses ? Number(d.maxUses) : null,
    maxUsesPerEmail: d.maxUsesPerEmail ? Number(d.maxUsesPerEmail) : null,
    autoApply: false,
    active: d.active,
    description: d.description || null,
  };

  try {
    if (d.id) await getRepository().updateCoupon(d.id, input);
    else await getRepository().createCoupon(input);
  } catch (err) {
    if (err instanceof Error && err.message === "COUPON_CODE_TAKEN") {
      return { ok: false, error: "Ya existe un código con ese nombre" };
    }
    return { ok: false, error: "No se pudo guardar la promoción" };
  }
  revalidatePath("/admin/promociones");
  return { ok: true };
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (id) await getRepository().updateCoupon(id, { active: !active });
  revalidatePath("/admin/promociones");
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("promotions.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().deleteCoupon(id);
    await logAction("coupon.delete", { entity: "coupon", entityId: id });
  }
  revalidatePath("/admin/promociones");
}

const feedSchema = z.object({
  propertySlug: z.string(),
  channel: z.enum(["booking", "airbnb"]).default("booking"),
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => u.startsWith("https://"), "La URL debe empezar por https://")
    .or(z.literal("")),
});

export async function setImportFeedUrlAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  await assertCapability("settings.write");
  const parsed = feedSchema.safeParse({
    propertySlug: formData.get("propertySlug"),
    channel: formData.get("channel") || "booking",
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "URL no válida" };
  }

  const property = getPropertyBySlug(parsed.data.propertySlug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  try {
    await getRepository().setImportFeedUrl(
      property.id,
      parsed.data.channel,
      parsed.data.url || null,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    if (msg.includes("PERSISTENCE_UNAVAILABLE")) {
      return {
        ok: false,
        error:
          "No se pudo guardar: esta instancia no tiene base de datos persistente. Configura Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) para que la URL sobreviva a un refresco.",
      };
    }
    if (/relation .*channel_feeds.* does not exist|channel_feeds/i.test(msg)) {
      return {
        ok: false,
        error:
          "No se pudo guardar: falta la tabla channel_feeds. Aplica las migraciones de Supabase (supabase/migrations/20260830090000_channel_feeds.sql).",
      };
    }
    return { ok: false, error: msg };
  }

  await logAction(parsed.data.url ? "feed.set" : "feed.clear", {
    entity: "channel_feed",
    entityId: `${property.slug}:${parsed.data.channel}`,
  });
  revalidatePath("/admin/sincronizacion");
  return { ok: true };
}

// --- Durable jobs (issue #76) ---------------------------------------------

export async function retryJobAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("settings.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().retryJob(id);
    await logAction("job.retry", { entity: "job", entityId: id });
  }
  revalidatePath("/admin/procesos");
}

export async function cancelJobAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("settings.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().cancelJob(id);
    await logAction("job.cancel", { entity: "job", entityId: id });
  }
  revalidatePath("/admin/procesos");
}

export async function runJobsNowAction(): Promise<void> {
  await assertAdmin();
  await assertCapability("settings.write");
  const { runDueJobs } = await import("@/domains/jobs/runner");
  await runDueJobs({ worker: "admin", batch: 25 });
  revalidatePath("/admin/procesos");
}
