"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { addDays, todayIso } from "@/lib/dates";
import { quickCode } from "./quick-code";

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const schema = z.object({
  label: z.string().trim().min(1).max(120),
  kind: z.enum(["percent", "fixed"]).default("percent"),
  value: z.coerce.number().positive().default(10),
  propertySlug: z.string().optional(),
  perEmail: z.coerce.number().int().min(0).default(1),
  days: z.coerce.number().int().min(1).max(730).default(90),
  redirectTo: z.string().optional(),
});

/**
 * Create a promo code from a customer fiche or a segment (issue #56 §7).
 * Generates a readable code, defaults to both properties, one use per email,
 * a 90-day expiry, active. The admin can refine it afterwards in Promociones.
 */
export async function createQuickCouponAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/promociones");
  const d = parsed.data;
  const repo = getRepository();

  const property =
    d.propertySlug && d.propertySlug !== "all" ? getPropertyBySlug(d.propertySlug) : null;

  let code = quickCode(d.label);
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!(await repo.getCouponByCode(code))) break;
    code = quickCode(d.label);
  }

  await repo.createCoupon({
    code,
    kind: d.kind,
    value: d.kind === "fixed" ? Math.round(d.value * 100) : d.value,
    propertySlug: property?.slug ?? null,
    startsOn: todayIso(),
    endsOn: addDays(todayIso(), d.days),
    minNights: 0,
    minTotalCents: 0,
    maxUses: null,
    maxUsesPerEmail: d.perEmail > 0 ? d.perEmail : null,
    autoApply: false,
    active: true,
    description: d.label,
  });

  revalidatePath("/admin/promociones");
  if (d.redirectTo) revalidatePath(d.redirectTo);
  redirect(`/admin/promociones`);
}
