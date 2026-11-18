import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, DEMO_MODE } from "@/lib/env";

/**
 * Autenticación de propietarios clientes (#176).
 *
 * Producción: Supabase Auth (email + contraseña, verificación de email,
 * recuperación). Necesita la clave publicable en el build
 * (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) para que la sesión viaje en cookies
 * y las lecturas del portal pasen por RLS con la identidad del usuario.
 *
 * Modo demo (sin Supabase): almacén en memoria con contraseñas scrypt y una
 * cookie firmada. Sirve para preview, CI y pruebas E2E; nunca se activa en
 * producción con base de datos real.
 *
 * Estas cuentas NO tienen acceso al panel: el panel exige una fila en
 * `admin_users` (#65), que el registro de propietarios nunca crea.
 */

export type OwnerAuthMode = "supabase" | "demo" | "disabled";

export function ownerAuthMode(): OwnerAuthMode {
  if (env.supabaseConfigured) return env.supabaseBrowserConfigured ? "supabase" : "disabled";
  return DEMO_MODE ? "demo" : "disabled";
}

export interface OwnerSession {
  userId: string;
  email: string;
  emailVerified: boolean;
}

export type AuthResult =
  | {
      ok: true;
      userId: string;
      needsVerification: boolean;
      demoVerifyToken?: string;
      existing?: boolean;
    }
  | { ok: false; error: string };

const GENERIC_LOGIN_ERROR =
  "El correo o la contraseña no son correctos, o la cuenta aún no está verificada.";

// ----------------------------------------------------------------- demo ----

interface DemoUser {
  id: string;
  email: string;
  salt: string;
  hash: string;
  verified: boolean;
  verifyToken: string | null;
  resetToken: string | null;
  sessionsValidFrom: number;
}

const g = globalThis as unknown as { __pvOwnerUsers?: Map<string, DemoUser> };
const demoUsers = () => (g.__pvOwnerUsers ??= new Map());

/** Solo para tests. */
export function __resetDemoOwners(): void {
  g.__pvOwnerUsers = new Map();
}

const COOKIE = "pv_owner";
const MAX_AGE = 60 * 60 * 12;

function secret(): string {
  return `owner:${env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || "insecure-dev-secret"}`;
}
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

function findDemoByEmail(email: string): DemoUser | undefined {
  const e = email.trim().toLowerCase();
  return [...demoUsers().values()].find((u) => u.email === e);
}

async function setDemoCookie(userId: string): Promise<void> {
  const issued = Date.now().toString();
  const payload = `${userId}.${issued}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

async function demoSession(): Promise<OwnerSession | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, issued, mac] = parts as [string, string, string];
  const expected = sign(`${userId}.${issued}`);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected)))
    return null;
  const age = (Date.now() - Number(issued)) / 1000;
  if (!(age >= 0 && age < MAX_AGE)) return null;
  const u = demoUsers().get(userId);
  if (!u || Number(issued) < u.sessionsValidFrom) return null;
  return { userId: u.id, email: u.email, emailVerified: u.verified };
}

/** Modo demo: verifica el email con el token del enlace. */
export async function verifyDemoToken(token: string): Promise<boolean> {
  if (ownerAuthMode() !== "demo") return false;
  const u = [...demoUsers().values()].find((x) => x.verifyToken && x.verifyToken === token);
  if (!u) return false;
  u.verified = true;
  u.verifyToken = null;
  await setDemoCookie(u.id);
  return true;
}

// -------------------------------------------------------------- supabase ----

async function sb() {
  const { supabaseServer } = await import("@/lib/supabase/server");
  return supabaseServer();
}

// ----------------------------------------------------------------- API ----

export async function getOwnerSession(): Promise<OwnerSession | null> {
  const mode = ownerAuthMode();
  if (mode === "demo") return demoSession();
  if (mode === "supabase") {
    try {
      const { data } = await (await sb()).auth.getUser();
      const u = data.user;
      if (!u?.email) return null;
      return { userId: u.id, email: u.email, emailVerified: !!u.email_confirmed_at };
    } catch {
      return null;
    }
  }
  return null;
}

export async function signUpOwner(
  email: string,
  password: string,
  redirectTo: string,
): Promise<AuthResult> {
  const mode = ownerAuthMode();
  const e = email.trim().toLowerCase();
  if (mode === "demo") {
    if (findDemoByEmail(e))
      return { ok: true, userId: "", needsVerification: true, existing: true };
    const salt = randomBytes(16).toString("hex");
    const user: DemoUser = {
      id: randomUUID(),
      email: e,
      salt,
      hash: hashPassword(password, salt),
      verified: false,
      verifyToken: randomBytes(24).toString("base64url"),
      resetToken: null,
      sessionsValidFrom: 0,
    };
    demoUsers().set(user.id, user);
    return {
      ok: true,
      userId: user.id,
      needsVerification: true,
      demoVerifyToken: user.verifyToken!,
    };
  }
  if (mode === "supabase") {
    const { data, error } = await (
      await sb()
    ).auth.signUp({
      email: e,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    // Con la confirmación de email activada, Supabase devuelve un usuario sin
    // identidades si el correo ya existía: no revelamos si la cuenta existe.
    if (!data.user) return { ok: false, error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
    // Correo ya registrado: Supabase devuelve un usuario sin identidades. No
    // creamos nada a su nombre (nadie puede «colgar» datos en la cuenta de otro)
    // y respondemos igual que en un alta normal para no revelar si existe.
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0)
      return { ok: true, userId: "", needsVerification: true, existing: true };
    return { ok: true, userId: data.user.id, needsVerification: !data.user.email_confirmed_at };
  }
  return { ok: false, error: "El acceso de clientes no está disponible en este momento." };
}

export async function signInOwner(email: string, password: string): Promise<AuthResult> {
  const mode = ownerAuthMode();
  const e = email.trim().toLowerCase();
  if (mode === "demo") {
    const u = findDemoByEmail(e);
    if (!u) return { ok: false, error: GENERIC_LOGIN_ERROR };
    const candidate = hashPassword(password, u.salt);
    if (!timingSafeEqual(Buffer.from(candidate), Buffer.from(u.hash)) || !u.verified)
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    await setDemoCookie(u.id);
    return { ok: true, userId: u.id, needsVerification: false };
  }
  if (mode === "supabase") {
    const { data, error } = await (await sb()).auth.signInWithPassword({ email: e, password });
    if (error || !data.user) return { ok: false, error: GENERIC_LOGIN_ERROR };
    return { ok: true, userId: data.user.id, needsVerification: !data.user.email_confirmed_at };
  }
  return { ok: false, error: "El acceso de clientes no está disponible en este momento." };
}

export async function signOutOwner(): Promise<void> {
  const mode = ownerAuthMode();
  if (mode === "demo") {
    (await cookies()).delete(COOKIE);
    return;
  }
  if (mode === "supabase") await (await sb()).auth.signOut().catch(() => undefined);
}

/** Cierra las sesiones abiertas en otros dispositivos. */
export async function revokeOwnerSessions(userId: string): Promise<void> {
  const mode = ownerAuthMode();
  if (mode === "demo") {
    const u = demoUsers().get(userId);
    if (u) u.sessionsValidFrom = Date.now();
    (await cookies()).delete(COOKIE);
    return;
  }
  if (mode === "supabase")
    await (await sb()).auth.signOut({ scope: "global" }).catch(() => undefined);
}

export async function requestOwnerPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ demoResetToken?: string }> {
  const mode = ownerAuthMode();
  if (mode === "demo") {
    const u = findDemoByEmail(email);
    if (u) {
      u.resetToken = randomBytes(24).toString("base64url");
      return { demoResetToken: u.resetToken };
    }
    return {};
  }
  if (mode === "supabase") {
    await (
      await sb()
    ).auth
      .resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
      .catch(() => undefined);
  }
  return {};
}

/** Cambia la contraseña: con sesión de recuperación (Supabase) o con token (demo). */
export async function setOwnerPassword(
  newPassword: string,
  demoToken?: string,
): Promise<{ ok: boolean; error?: string }> {
  const mode = ownerAuthMode();
  if (mode === "demo") {
    const u = demoToken
      ? [...demoUsers().values()].find((x) => x.resetToken === demoToken)
      : undefined;
    if (!u) return { ok: false, error: "El enlace no es válido o ha caducado." };
    u.salt = randomBytes(16).toString("hex");
    u.hash = hashPassword(newPassword, u.salt);
    u.resetToken = null;
    u.verified = true;
    u.sessionsValidFrom = Date.now();
    await setDemoCookie(u.id);
    return { ok: true };
  }
  if (mode === "supabase") {
    const { error } = await (await sb()).auth.updateUser({ password: newPassword });
    return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
  }
  return { ok: false, error: "No disponible." };
}

/** Intercambia el código del enlace de verificación/recuperación (Supabase PKCE). */
export async function exchangeOwnerCode(code: string): Promise<boolean> {
  if (ownerAuthMode() !== "supabase") return false;
  const { error } = await (await sb()).auth.exchangeCodeForSession(code);
  return !error;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (password.length > 128) return "La contraseña es demasiado larga.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Usa letras y al menos un número.";
  return null;
}

function friendlyAuthError(message: string): string {
  if (/password/i.test(message)) return "La contraseña no cumple los requisitos de seguridad.";
  if (/rate|too many/i.test(message)) return "Demasiados intentos. Espera unos minutos.";
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
