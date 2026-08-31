import { env, DEMO_MODE } from "@/lib/env";

/**
 * Fail-closed production check (issue #63). Returns the list of blocking
 * problems when `PRODUCTION_STRICT` is on in a production build — empty
 * otherwise. Pure (reads only `env`), so it is unit-testable and shared by
 * `instrumentation.ts` and `/api/health`.
 */
export function strictProductionBlockers(): string[] {
  if (env.NODE_ENV !== "production" || !env.PRODUCTION_STRICT) return [];

  const problems: string[] = [];
  if (DEMO_MODE) {
    problems.push(
      "Supabase no configurado — la web funcionaría en modo demostración (los datos no persisten).",
    );
  }
  if (!env.stripeConfigured) {
    problems.push("Stripe no configurado — no se pueden cobrar reservas reales.");
  }
  if (!env.stripeWebhookConfigured) {
    problems.push("STRIPE_WEBHOOK_SECRET no configurado — las reservas no se confirmarían.");
  }
  if (!env.CRON_SECRET) {
    problems.push("CRON_SECRET no configurado — las tareas programadas quedarían sin proteger.");
  }
  if (!env.ADMIN_SESSION_SECRET && !env.ADMIN_PASSWORD) {
    problems.push("Sin ADMIN_PASSWORD ni ADMIN_SESSION_SECRET — el panel no tendría acceso seguro.");
  }
  return problems;
}
