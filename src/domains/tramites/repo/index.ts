import "server-only";
import { DEMO_MODE } from "@/lib/env";
import { memoryTramites } from "./memory";
import { supabaseTramites } from "./supabase";
import type { TramitesStore } from "./types";

/**
 * - `serverStore()`: escrituras del servidor y panel interno. Usa la clave
 *   secreta: SOLO se llama después de comprobar la sesión y los permisos.
 * - `ownerReadStore()`: lecturas del portal con la sesión del propietario; en
 *   Supabase las políticas RLS (migración 20261118120000) limitan cada consulta
 *   a sus cuentas.
 */

let serverCached: TramitesStore | null = null;

export function serverStore(): TramitesStore {
  if (DEMO_MODE) return memoryTramites;
  return (serverCached ??= supabaseTramites(async () => {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    return supabaseAdmin();
  }));
}

export function ownerReadStore(): TramitesStore {
  if (DEMO_MODE) return memoryTramites;
  // Una instancia por petición: el cliente lleva las cookies de ESTA sesión.
  return supabaseTramites(async () => {
    const { supabaseServer } = await import("@/lib/supabase/server");
    return supabaseServer();
  });
}

export type { TramitesStore } from "./types";
