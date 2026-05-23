// On-playa walk-up volunteers need to see /shifts without a session.
// Off-playa keeps it gated by the hotfix #288 middleware.
// The test dev server runs with NEXT_PUBLIC_PIN_ENABLED="true" (on-playa
// default in client/e2e/playwright.config.ts), so this exercises the
// on-playa branch of the conditional allowlist.

import { test, expect, request } from "@playwright/test";

test.describe("On-playa: /shifts is reachable without a session", () => {
  test("GET /shifts returns 200, no redirect to /sign-in", async () => {
    const ctx = await request.newContext({
      baseURL: "http://localhost:3000",
    });
    const res = await ctx.fetch("/shifts", { maxRedirects: 0 });
    await ctx.dispose();

    // Middleware would 307-redirect to /sign-in if it were gating this path.
    expect(res.status()).toBe(200);
  });

  test("GET /api/shifts returns 200 (not 401)", async ({ request: req }) => {
    const res = await req.get("/api/shifts");

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/shifts returns no duplicate shift_times_ids", async ({
    request: req,
  }) => {
    // Regression for the 2026-05-23 dedupe bug in getShiftList: the
    // previous linear "is the last pushed item the same?" check broke
    // when two shifts shared (date, start_time_text) and the SQL ORDER BY
    // interleaved their position rows. Re-check that each shift appears
    // exactly once in the response.
    const res = await req.get("/api/shifts");
    expect(res.status()).toBe(200);
    const body = await res.json();

    const ids = body.map((s: { id: number }) => s.id);
    const seen = new Set<number>();
    const dupes: number[] = [];
    for (const id of ids) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
  });
});
