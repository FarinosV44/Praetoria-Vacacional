import { DEMO_MODE } from "@/lib/env";
import { memoryRepository } from "./memory";
import { supabaseRepository } from "./supabase";
import type { Repository } from "./types";

/**
 * The rest of the app talks to `getRepository()`, never to Supabase or the
 * in-memory store directly. DEMO mode (no Supabase configured) transparently
 * swaps in the in-memory implementation so every flow is exercisable locally.
 */
export function getRepository(): Repository {
  return DEMO_MODE ? memoryRepository : supabaseRepository;
}

export type { Repository } from "./types";
export { PropertyUnavailableError } from "./types";
