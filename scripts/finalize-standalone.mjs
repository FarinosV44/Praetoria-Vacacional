/**
 * `next build` with `output: "standalone"` emits `.next/standalone/` but does
 * NOT copy the static assets or `public/` into it — that last step is left to
 * the deployer (see the Next.js "Automatically Copying Traced Files" docs).
 *
 * Hostinger's managed preset does this itself on deploy. This script does the
 * same for local / CI runs so `npm start` serves a complete site, and it drops
 * a `server.js` at the repo root so the start command is identical to the one
 * Hostinger runs on its flattened standalone runtime (`node server.js`).
 */
import { cpSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const standalone = resolve(root, ".next/standalone");

if (!existsSync(standalone)) {
  console.error("finalize-standalone: .next/standalone missing — is `output: \"standalone\"` set?");
  process.exit(1);
}

const copies = [
  [resolve(root, ".next/static"), resolve(standalone, ".next/static")],
  [resolve(root, "public"), resolve(standalone, "public")],
];
for (const [from, to] of copies) {
  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
    console.log(`finalize-standalone: copied ${from} → ${to}`);
  }
}

// Root entry point, mirroring Hostinger's runtime layout. Runs against the full
// build tree (full .next / node_modules / public), which is a superset of what
// the standalone server needs.
copyFileSync(resolve(standalone, "server.js"), resolve(root, "server.js"));
console.log("finalize-standalone: wrote ./server.js");
