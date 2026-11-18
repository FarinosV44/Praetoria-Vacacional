import "server-only";
import { DEMO_MODE } from "@/lib/env";
import { ownerAuthMode } from "./auth";

/**
 * Interruptor de lanzamiento (#173, #178): en producción la contratación online
 * NO se activa hasta el visto bueno legal y comercial. Mientras tanto la landing
 * ofrece una «prealta» (solicitud sin cobro) y WhatsApp.
 *
 *   TRAMITES_CONTRATACION=on   → alta online + pago + portal
 *   (ausente)                  → solo prealta (salvo modo demo/preview)
 */
export function contratacionActiva(): boolean {
  if (ownerAuthMode() === "disabled") return false;
  if (DEMO_MODE) return true;
  return process.env.TRAMITES_CONTRATACION?.trim().toLowerCase() === "on";
}

/** El portal «Mi carpeta» funciona si hay método de acceso para propietarios. */
export function portalDisponible(): boolean {
  return ownerAuthMode() !== "disabled";
}
