# Lessons learned — Praetoria Vacacional

What bit THIS project, recorded as it happened. Prevention traps for the project class live
in the Keel skill's `references/anti-patterns.md`.

## L-001 — `git push` is blocked by the Claude Code auto-mode classifier
**When:** 2026-08-27, first session.
Even with `.claude/settings.local.json` set to `acceptEdits` and automatic mode
chosen, the harness classifier denies `git push` (and writing `bypassPermissions`
into settings). Commits land locally fine. **How to apply:** don't retry pushes in
a loop — record unpushed commits in PROGRESS.md "Unpushed commits" and let the user
run `git push` or approve it. A `.claude/settings.json` Bash allow-rule for
`git push` would remove the friction if the user wants it.

## L-002 — `page.tsx` files must only export Next's known fields
**When:** 2026-08-27. Exporting a shared `StatusBadge` component from
`admin/(panel)/page.tsx` failed the typed-routes check
(`does not satisfy the constraint '{ [x: string]: never; }'`). Shared components
live in `src/components/**`, never exported from route files. **How to apply:**
if two routes need the same helper, it goes in `src/components/`.

## L-004 — Playwright `reuseExistingServer` can attach to a foreign dev server
**When:** 2026-08-28 (issue #53). `playwright.config.ts` has
`reuseExistingServer: !CI`. On this machine an unrelated app ("PatrimonIA")
was serving `http://localhost:3000`, so Playwright reused it and every test
returned 404 / "Página no encontrada" — nothing to do with the code change.
**How to apply:** run our own build on a free port and pass `E2E_BASE_URL`:
`npx next start -p 3100`, then
`E2E_BASE_URL=http://localhost:3100 npx playwright test --project=chromium`
(setting `E2E_BASE_URL` also disables the config's `webServer`).

## L-006 — `new Date(y,m,d).toISOString()` shifts the day in Spain
**When:** 2026-08-30. The public availability calendar generated cell dates with
`new Date(year, month, day).toISOString().slice(0,10)`. The Date is built at
LOCAL midnight; `toISOString()` formats in UTC. On this project's timezone
(Europe/Madrid, UTC+1/+2) that turned day 1 into the previous month's last day —
the June grid opened with "31 May". **How to apply:** never round-trip a
locally-constructed calendar date through `toISOString()`. Build `YYYY-MM-DD`
from the numbers directly (`src/lib/calendar-cells.ts`) or use the UTC helpers in
`src/lib/dates.ts`. `toISOString()` is only safe on a real instant (`new Date()`).

## L-005 — The full e2e suite needs `--workers=1` against one DEMO server
**When:** 2026-08-30 (issue #57). Running the whole Playwright suite against a
single `next start` DEMO server with the default 2 workers fails a different
test each run (`booking-flow` gets a 409 on a hold another spec just made,
`admin-ical-feeds` sees stale feed state). Every spec passes in isolation.
**How to apply:** for a full-suite run use a **freshly started** server (new
process → fresh in-memory store) and `--workers=1`:
`npx next start -p <port>` then
`E2E_BASE_URL=… npx playwright test --project=chromium --workers=1`.
Deleting `.data/` under a running server does *not* reset it — the store lives in
`globalThis.__pvStore`; restart the process.

## L-003 — Pricing/availability tests must pin `now`
**When:** 2026-08-27. `buildQuote` rejects past check-in dates via `leadTimeDays`,
so fixture dates silently became invalid as real "today" moved. All time-sensitive
pure-logic tests pass an explicit `now` argument (`NOW = "2026-04-01"`).
