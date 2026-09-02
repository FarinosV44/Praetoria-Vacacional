"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getAdminContext } from "@/domains/admin/context";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { reportError } from "@/lib/observability/report";
import { extensionFor, isAllowedUpload } from "./types";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function guard() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("content.write");
}

export async function uploadMediaAction(_prev: unknown, formData: FormData): Promise<Result> {
  await guard();
  if (!env.supabaseConfigured) {
    return {
      ok: false,
      error:
        "La biblioteca de medios necesita Supabase Storage. Configura Supabase y crea el bucket privado «media».",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecciona un archivo" };

  const allowed = isAllowedUpload(file.type, file.size);
  if (!allowed.ok) return { ok: false, error: allowed.error! };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 300);
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  const path = `assets/${new Date().getFullYear()}/${randomUUID()}.${extensionFor(file.type)}`;

  try {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin()
      .storage.from("media")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) throw error;

    const ctx = await getAdminContext();
    const asset = await getRepository().createMediaAsset({
      path,
      filename: file.name.slice(0, 200),
      mime: file.type,
      sizeBytes: file.size,
      width,
      height,
      alt,
      tags,
      uploadedBy: ctx?.userId ?? null,
    });
    await logAction("media.upload", { entity: "media_asset", entityId: asset.id, meta: { filename: file.name } });
    revalidatePath("/admin/media");
    return { ok: true, id: asset.id };
  } catch (err) {
    reportError(err, { scope: "media/upload" });
    const msg = err instanceof Error ? err.message : "error";
    if (/bucket.*not.*found/i.test(msg)) {
      return { ok: false, error: "El bucket «media» no existe en Supabase Storage. Créalo (privado)." };
    }
    return { ok: false, error: "No se pudo subir el archivo" };
  }
}

const editSchema = z.object({
  id: z.string().min(1),
  alt: z.string().trim().max(300).optional(),
  focalX: z.coerce.number().min(0).max(1).optional(),
  focalY: z.coerce.number().min(0).max(1).optional(),
  tags: z.string().optional(),
});

export async function updateMediaAction(_prev: unknown, formData: FormData): Promise<Result> {
  await guard();
  const parsed = editSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Datos no válidos" };
  const { id, alt, focalX, focalY, tags } = parsed.data;
  await getRepository().updateMediaAsset(id, {
    ...(alt !== undefined ? { alt } : {}),
    ...(focalX !== undefined ? { focalX } : {}),
    ...(focalY !== undefined ? { focalY } : {}),
    ...(tags !== undefined
      ? { tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12) }
      : {}),
  });
  await logAction("media.update", { entity: "media_asset", entityId: id });
  revalidatePath("/admin/media");
  return { ok: true, id };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await getRepository().deleteMediaAsset(id);
    await logAction("media.delete", { entity: "media_asset", entityId: id });
  }
  revalidatePath("/admin/media");
}
