/**
 * Custom server entry point for hosts that run a startup .js file rather than
 * `next start` — cPanel / LiteSpeed (lsnode) / Passenger, which is how Hostinger
 * shared hosting runs Node.js apps.
 *
 * Point the hosting panel's "Application startup file" at this file.
 * Requires: a prior `npm run build` (the .next/ folder) and `next` in
 * dependencies (it is). ESM — the project's package.json is "type": "module".
 */
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import next from "next";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, dir: __dirname, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error("request handler error", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      });
    }).listen(port, () => {
      console.log(`▲ Praetoria Vacacional listening on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("failed to start Next.js server:", err);
    process.exit(1);
  });
