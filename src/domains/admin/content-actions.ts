"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./auth";
import { getPropertyBySlug } from "@/domains/properties/registry";
import {
  propertyOverrideSchema,
  setPropertyOverride,
  type PropertyOverride,
} from "@/domains/properties/content";
import { guides as baseGuides } from "@/content/guides";
import { guideOverrideSchema, setGuideOverride } from "@/content/guides/overrides";
import { hubForPropertySlug } from "@/content/guides";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

function parseJsonField<T>(raw: string): T | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed) as T;
}

export async function savePropertyOverrideAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const slug = String(formData.get("slug") ?? "");
  const property = getPropertyBySlug(slug);
  if (!property) return { ok: false, error: "Alojamiento no encontrado" };

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || undefined;
  };

  let candidate: PropertyOverride;
  try {
    candidate = {
      metaTitle: str("metaTitle"),
      metaDescription: str("metaDescription"),
      h1: str("h1"),
      tagline: str("tagline"),
      shortIntro: str("shortIntro"),
      highlights: parseJsonField<PropertyOverride["highlights"]>(
        String(formData.get("highlights") ?? ""),
      ),
      nearby: parseJsonField<PropertyOverride["nearby"]>(String(formData.get("nearby") ?? "")),
      faq: parseJsonField<PropertyOverride["faq"]>(String(formData.get("faq") ?? "")),
    };
  } catch {
    return { ok: false, error: "El JSON de ventajas, distancias o FAQ no es válido" };
  }

  const parsed = propertyOverrideSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  // An all-empty document clears the override.
  const hasAny = Object.values(parsed.data).some(
    (v) => v !== undefined && (!Array.isArray(v) || v.length > 0),
  );
  await setPropertyOverride(slug, hasAny ? parsed.data : null);

  revalidatePath(`/${slug}`);
  revalidatePath(`/en/${slug}`);
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/admin/contenido");
  return { ok: true };
}

export async function saveGuideOverrideAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();
  const propertySlug = String(formData.get("propertySlug") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const base = baseGuides.find((g) => g.propertySlug === propertySlug && g.slug === slug);
  if (!base) return { ok: false, error: "Guía no encontrada" };

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || undefined;
  };
  const orderRaw = String(formData.get("order") ?? "").trim();

  const parsed = guideOverrideSchema.safeParse({
    title: str("title"),
    description: str("description"),
    lead: str("lead"),
    status: str("status"),
    order: orderRaw || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const hasAny = Object.values(parsed.data).some((v) => v !== undefined);
  await setGuideOverride(propertySlug, slug, hasAny ? parsed.data : null);

  const hub = hubForPropertySlug(propertySlug);
  revalidatePath(`/guias/${hub}/${slug}`);
  revalidatePath(`/guias/${hub}`);
  revalidatePath("/guias");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/contenido");
  return { ok: true };
}
