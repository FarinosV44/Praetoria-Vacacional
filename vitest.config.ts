import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws on import outside an RSC build; these tests run
      // server modules directly, so neutralise the marker (as Next.js does).
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
});
