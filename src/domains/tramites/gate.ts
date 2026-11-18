import "server-only";
import { ownerAuthMode } from "./auth";

/**
 * Interruptor de lanzamiento (#173, #178): en producción la contratación online
 * NO se activa hasta el visto bueno legal y comercial. Mientras tanto la landing
 * ofrece una «prealta» (solicitud sin cobro) y WhatsApp.
 *
 *   TRAMITES_CONTRATACION=on   → alta online + pago + portal
 *   (ausente)                  → solo prealta
 *
 * También en modo demo hace falta activarlo a mano: la web pública puede estar
 * funcionando en demo, y ahí un alta con «pago simulado» parecería real.
 */
export function contratacionActiva(): boolean {
  if (ownerAuthMode() === "disabled") return false;
  return process.env.TRAMITES_CONTRATACION?.trim().toLowerCase() === "on";
}

/** El portal «Mi carpeta» funciona si hay método de acceso para propietarios. */
export function portalDisponible(): boolean {
  return ownerAuthMode() !== "disabled";
}
