// /volunteers/[id]/account is the legacy URL; canonical is now /info.
// This test asserts the server-side redirect chain.
//
// Note: middleware gates /volunteers/* by default (hotfix #288), so an
// unauthenticated request to /account first redirects to /sign-in (with
// returnTo=/volunteers/X/account). We follow that and assert the chain
// ends at /sign-in for the unauth case — the redirect-to-/info path runs
// post-auth, which the existing sign-in test covers via the okta callback.

import { test, expect, request } from "@playwright/test";

test.describe("/volunteers/[id]/account redirects to /info", () => {
  test("unauth hit goes through /sign-in (middleware) before any redirect", async () => {
    const ctx = await request.newContext({
      baseURL: "http://localhost:3000",
    });
    const res = await ctx.fetch("/volunteers/9999999/account", {
      maxRedirects: 0,
    });
    await ctx.dispose();

    // Middleware sends 307 to /sign-in with returnTo preserving the
    // ORIGINAL /account URL (so post-auth landing still hits the page,
    // which then issues the /account → /info redirect).
    expect(res.status()).toBe(307);
    const location = res.headers()["location"]!;
    expect(location).toContain("/sign-in");
    expect(location).toContain("returnTo=");
    expect(decodeURIComponent(location)).toContain(
      "/volunteers/9999999/account"
    );
  });
});
