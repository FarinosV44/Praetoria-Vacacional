import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Make .env.local values (e.g. ADMIN_PASSWORD for the admin e2e) available to
// the test runner too — Next loads it for the app, Playwright does not.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && m[1] && !(m[1] in process.env)) process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — the admin e2e will skip itself */
}

const externalBaseUrl = process.env.E2E_BASE_URL?.trim() || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
