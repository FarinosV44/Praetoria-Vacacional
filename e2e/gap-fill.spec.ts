import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Issue #60 §5 — a stay that EXACTLY fills the gap between two reservations can
 * be sold even below the season minimum stay. Valencia's summer season has a
 * 4-night minimum; a 2-night hole between two bookings must still be bookable.
 */

// A summer date next year (inside Valencia's 06-15…09-15 season): day 1 = 1 July,
// day 32 = 1 August. Using a day offset lets the search window cover two months.
function july(day: number): string {
  const y = new Date().getUTCFullYear() + 1;
  const d = new Date(Date.UTC(y, 6, day));
  return d.toISOString().slice(0, 10);
}

async function seedHold(request: APIRequestContext, checkIn: string, checkOut: string) {
  // /api/checkout is rate-limited (20/min per IP). Earlier specs in a serial run
  // can use up that budget, so honour Retry-After instead of treating a 429 as
  // "dates taken" — that silently skipped the seeds and made this test flaky.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await request.post("/api/checkout", {
      data: {
        property: "valencia",
        checkIn,
        checkOut,
        guests: 2,
        idempotencyKey: crypto.randomUUID(),
      },
    });
    if (res.status() !== 429) return res.ok();
    const wait = Number(res.headers()["retry-after"] ?? "5");
    await new Promise((r) => setTimeout(r, Math.min(Math.max(wait, 1), 65) * 1000));
  }
  return false;
}

async function quote(request: APIRequestContext, checkIn: string, checkOut: string) {
  const res = await request.post("/api/quote", {
    data: { property: "valencia", checkIn, checkOut, guests: 2 },
  });
  return res.json();
}

test("a stay that exactly fills a 2-night gap is bookable below the 4-night minimum", async ({
  request,
}) => {
  test.setTimeout(240_000);
  // Find a 10-night window that is completely free, then seed both 4-night holds
  // inside it. Windows never overlap, so holds left behind by an earlier run or a
  // retry (the in-memory repo keeps them) can never turn a half-seeded window into
  // a false "gap" — the cause of the intermittent CI failure.
  let base = -1;
  for (let candidate = 3; candidate + 10 <= 58; candidate += 11) {
    const window = await quote(request, july(candidate), july(candidate + 10));
    if (window.reason === "No disponible para estas fechas") continue;
    const a = await seedHold(request, july(candidate), july(candidate + 4)); // e.g. 3→7
    const b = await seedHold(request, july(candidate + 6), july(candidate + 10)); // e.g. 9→13
    if (a && b) {
      base = candidate;
      break;
    }
  }
  expect(base, "no free 10-night window in July–August to seed the gap").toBeGreaterThan(0);
  const gapIn = july(base + 4); // 7
  const gapOut = july(base + 6); // 9  → exactly the 2-night hole

  const filled = await quote(request, gapIn, gapOut);
  expect(filled.available, JSON.stringify(filled.reason)).toBe(true);
  expect(filled.quote.nights).toBe(2);

  // Control: a 1-night stay that leaves a free night is still rejected.
  const partial = await quote(request, gapIn, july(base + 5));
  expect(partial.available).toBe(false);
});
