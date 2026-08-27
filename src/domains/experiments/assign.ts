import "server-only";
import { cookies } from "next/headers";
import {
  controlOf,
  experiments,
  isEnabled,
  type ExperimentKey,
} from "./config";

const COOKIE = "pv_exp";
const MAX_AGE = 60 * 60 * 24 * 90;

type Assignments = Partial<Record<ExperimentKey, string>>;

function parse(raw: string | undefined): Assignments {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as Assignments;
  } catch {
    return {};
  }
}

function hashToVariant(seed: string, variants: readonly string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return variants[Math.abs(h) % variants.length]!;
}

/**
 * The visitor's variant for an experiment. Returns the control while the
 * experiment is disabled. Assignment is sticky via the `pv_exp` cookie; the
 * cookie is only written from a Server Action / Route Handler context, so in a
 * pure RSC render a first-time visitor gets a deterministic pseudo-random
 * variant that is persisted on their next mutating request.
 */
export async function getVariant(key: ExperimentKey): Promise<string> {
  if (!isEnabled(key)) return controlOf(key);

  const store = await cookies();
  const current = parse(store.get(COOKIE)?.value);
  if (current[key]) return current[key]!;

  const anon = store.get("pv_anon")?.value ?? crypto.randomUUID();
  const variant = hashToVariant(`${key}:${anon}`, experiments[key].variants);

  try {
    store.set(
      COOKIE,
      encodeURIComponent(JSON.stringify({ ...current, [key]: variant })),
      { httpOnly: false, sameSite: "lax", path: "/", maxAge: MAX_AGE },
    );
    if (!store.get("pv_anon")) {
      store.set("pv_anon", anon, { httpOnly: false, sameSite: "lax", path: "/", maxAge: MAX_AGE });
    }
  } catch {
    // RSC render — cannot set cookies here; the variant is still stable for this
    // request and will be persisted by middleware/next mutation.
  }
  return variant;
}

export async function getAllVariants(): Promise<Assignments> {
  const out: Assignments = {};
  for (const key of Object.keys(experiments) as ExperimentKey[]) {
    if (isEnabled(key)) out[key] = await getVariant(key);
  }
  return out;
}
