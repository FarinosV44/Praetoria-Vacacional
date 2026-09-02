/**
 * `output: "standalone"` produces `.next/standalone/server.js` but does NOT
 * copy `public/` or `.next/static/` into it. Most managed hosts do that in
 * their pipeline; this makes it work even if they don't. Portable (no `cp`),
 * idempotent, and a no-op when there's no standalone build.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const std = ".next/standalone";
if (!existsSync(std)) {
  console.log("postbuild: no standalone output, skipping");
  process.exit(0);
}

if (existsSync("public")) {
  cpSync("public", join(std, "public"), { recursive: true });
}
mkdirSync(join(std, ".next"), { recursive: true });
if (existsSync(".next/static")) {
  cpSync(".next/static", join(std, ".next/static"), { recursive: true });
}
console.log("postbuild: copied public/ and .next/static/ into .next/standalone/");
