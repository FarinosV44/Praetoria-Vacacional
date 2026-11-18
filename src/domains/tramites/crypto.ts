import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env, DEMO_MODE } from "@/lib/env";

/**
 * Cifrado de los datos de viajeros (#176, #178): AES-256-GCM con una clave del
 * servidor (`TRAMITES_DATA_KEY`, 32 bytes en base64). Así un volcado de la base
 * de datos o un error de permisos no expone documentos de identidad en claro.
 *
 * Sin clave en producción no se guardan datos de viajeros (fallo cerrado). En
 * modo demo se deriva una clave de desarrollo para poder probar el flujo.
 */

const VERSION = "v1";

function key(): Buffer | null {
  const raw = process.env.TRAMITES_DATA_KEY?.trim();
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 32) return buf;
    return null;
  }
  if (DEMO_MODE || env.NODE_ENV !== "production") {
    return createHash("sha256")
      .update(`pv-tramites-dev:${env.ADMIN_SESSION_SECRET ?? env.ADMIN_PASSWORD ?? "dev"}`)
      .digest();
  }
  return null;
}

export function travellerEncryptionReady(): boolean {
  return key() !== null;
}

export function encryptJson(value: unknown): string {
  const k = key();
  if (!k)
    throw new Error("TRAMITES_DATA_KEY no configurada: no se pueden guardar datos de viajeros.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const plain = Buffer.from(JSON.stringify(value), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptJson<T>(payload: string): T {
  const k = key();
  if (!k) throw new Error("TRAMITES_DATA_KEY no configurada.");
  const [ver, ivB, tagB, encB] = payload.split(".");
  if (ver !== VERSION || !ivB || !tagB || !encB) throw new Error("Formato cifrado desconocido.");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(encB, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}

/** Hash no reversible (IP de aceptación, huellas) con sal del servidor. */
export function saltedHash(value: string): string {
  return createHash("sha256")
    .update(`${env.ADMIN_SESSION_SECRET ?? "pv"}:${value}`)
    .digest("hex")
    .slice(0, 32);
}
