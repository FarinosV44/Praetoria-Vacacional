/**
 * Production start wrapper. Two jobs beyond `next start`:
 *
 *  1. Print one unmistakable line to stdout so the host's runtime logs show
 *     whether `npm start` runs at all, and on which port.
 *  2. NEVER bind to $HOSTNAME. On most Linux hosts `HOSTNAME` is the
 *     machine/container name (e.g. "srv12345"), not a bind address. Passing
 *     `next start -H $HOSTNAME` makes Next listen on a single non-loopback IP,
 *     so a reverse proxy dialing 127.0.0.1:$PORT gets ECONNREFUSED -> 503.
 *     We pass NO `-H` (Next then listens on all interfaces — the safe default,
 *     same as the plain `next start` this project shipped with) unless an
 *     explicit `HOST` var is set.
 */
import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || ""; // explicit opt-in only; HOSTNAME is ignored

console.log(
  `### PRAETORIA start.mjs invoked @ ${new Date().toISOString()} · PORT=${port} · HOST=${host || "(all interfaces)"} · node=${process.version} ###`,
);

const args = ["node_modules/next/dist/bin/next", "start", "-p", String(port)];
if (host) args.push("-H", host);

const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });

child.on("exit", (code, signal) => {
  console.error(`### next start exited · code=${code} · signal=${signal} ###`);
  process.exit(code ?? 1);
});
