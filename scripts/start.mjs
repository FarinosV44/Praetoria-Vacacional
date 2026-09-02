/**
 * Production start wrapper. Its only job beyond `next start` is to print an
 * unmistakable line to stdout so we can tell, from the host's runtime logs,
 * whether `npm start` is being invoked at all and on which port.
 */
import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOSTNAME || "0.0.0.0";

console.log(
  `### PRAETORIA start.mjs invoked @ ${new Date().toISOString()} · PORT=${port} · HOSTNAME=${host} · node=${process.version} ###`,
);

// `next start` respects PORT/HOSTNAME env vars; pass them explicitly too.
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", host],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  console.error(`### next start exited · code=${code} · signal=${signal} ###`);
  process.exit(code ?? 1);
});
