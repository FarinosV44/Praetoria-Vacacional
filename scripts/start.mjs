/**
 * Production start wrapper. Two jobs beyond `next start`:
 *
 *  1. Print one unmistakable line to stdout so the host's runtime logs show
 *     whether `npm start` runs at all, and on which port.
 *  2. Bind to 0.0.0.0 explicitly and NEVER to $HOSTNAME. On most Linux hosts
 *     `HOSTNAME` is the machine/container name (e.g. "srv12345"), not a bind
 *     address. `next start -H $HOSTNAME` would then listen on a single
 *     non-loopback IP, so a reverse proxy dialing 127.0.0.1:$PORT gets a
 *     connection refused -> 503. A dedicated `HOST` var still wins if set.
 */
import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

console.log(
  `### PRAETORIA start.mjs invoked @ ${new Date().toISOString()} · PORT=${port} · HOST=${host} · node=${process.version} ###`,
);

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", host],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  console.error(`### next start exited · code=${code} · signal=${signal} ###`);
  process.exit(code ?? 1);
});
