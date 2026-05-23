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
});
