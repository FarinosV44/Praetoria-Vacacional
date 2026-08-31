import { afterEach, describe, expect, it, vi } from "vitest";

/** Load `strictProductionBlockers` with a specific env shape. */
async function withEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  const prev = { ...process.env };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const mod = await import("./strict");
  process.env = prev;
  return mod.strictProductionBlockers;
}

afterEach(() => vi.resetModules());

describe("strictProductionBlockers (issue #63)", () => {
  it("is empty when PRODUCTION_STRICT is off, whatever else is missing", async () => {
    const fn = await withEnv({ NODE_ENV: "production", PRODUCTION_STRICT: undefined });
    expect(fn()).toEqual([]);
  });

  it("is empty outside production even when strict", async () => {
    const fn = await withEnv({ NODE_ENV: "development", PRODUCTION_STRICT: "true" });
    expect(fn()).toEqual([]);
  });

  it("blocks a strict production boot with DEMO mode / no Stripe / no CRON_SECRET", async () => {
    const fn = await withEnv({
      NODE_ENV: "production",
      PRODUCTION_STRICT: "true",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      CRON_SECRET: undefined,
      ADMIN_PASSWORD: undefined,
      ADMIN_SESSION_SECRET: undefined,
    });
    const blockers = fn();
    expect(blockers.length).toBeGreaterThanOrEqual(4);
    expect(blockers.join(" ")).toMatch(/demostración/i);
    expect(blockers.join(" ")).toMatch(/Stripe/);
    expect(blockers.join(" ")).toMatch(/CRON_SECRET/);
  });

  it("passes a strict production boot when everything critical is set", async () => {
    const fn = await withEnv({
      NODE_ENV: "production",
      PRODUCTION_STRICT: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
      SUPABASE_SECRET_KEY: "sb_secret_x",
      STRIPE_SECRET_KEY: "sk_live_x",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_x",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      CRON_SECRET: "a-long-random-cron-secret",
      ADMIN_PASSWORD: "a-real-admin-password",
      ADMIN_SESSION_SECRET: "a-real-session-secret",
    });
    expect(fn()).toEqual([]);
  });
});
