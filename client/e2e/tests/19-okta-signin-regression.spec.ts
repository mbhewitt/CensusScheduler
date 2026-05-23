// Regression net for the sign-in path. Motivated by the 2026-05-13 prod
// outage where `/sign-in` rendered the generic ErrorAlert because
// `/api/volunteers/dropdown` returned 500 (wedged mysql2 pool), so the
// Okta button never appeared. These tests assert the pieces that would
// catch that class of failure before merge.
//
// See issue #294 for scope.

import { test, expect, request } from "@playwright/test";

import { closePool, cleanupAllTestData, insertVolunteer } from "../helpers/db";
import { IDS, makeTestVolunteer } from "../fixtures/test-data";

const seedVolunteer = makeTestVolunteer({
  shiftboardId: IDS.volunteer1,
  playaName: "E2E OktaProbe",
  worldName: "Okta Probe",
  email: "e2e-okta@test.local",
  passcode: "0000",
});

test.describe("Sign-in regression net", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(seedVolunteer);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("/sign-in renders the Okta button wired to /api/auth/okta", async ({
    page,
  }) => {
    // Generous overall budget: Next.js dev server JIT-compiles the route on
    // first hit, which can take 20s+ on a cold CI runner.
    test.setTimeout(60_000);

    await page.goto("/sign-in", { waitUntil: "networkidle", timeout: 45_000 });

    const oktaButton = page.getByRole("link", {
      name: /Sign in with Burning Man/i,
    });
    await expect(oktaButton).toBeVisible({ timeout: 15_000 });

    const href = await oktaButton.getAttribute("href");
    expect(href).toBe("/api/auth/okta");
  });

  test("/api/volunteers/dropdown returns a non-empty array", async ({
    request: req,
  }) => {
    const res = await req.get("/api/volunteers/dropdown");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("/sign-in forwards returnTo into the Okta button href", async ({
    page,
  }) => {
    // Regression for the 2026-05-23 bug where the Okta button hard-coded
    // /api/auth/okta and dropped the middleware-supplied returnTo, so
    // clicking a Hive training link landed users on /info instead of the
    // training-confirmation page.
    test.setTimeout(60_000);

    const target = "/training/confirmation/XQDDG";
    await page.goto(`/sign-in?returnTo=${encodeURIComponent(target)}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });

    const oktaButton = page.getByRole("link", {
      name: /Sign in with Burning Man/i,
    });
    await expect(oktaButton).toBeVisible({ timeout: 15_000 });

    const href = await oktaButton.getAttribute("href");
    expect(href).toBe(`/api/auth/okta?returnTo=${encodeURIComponent(target)}`);
  });

  test("/api/auth/okta returns a well-formed 302 to an authorize endpoint", async () => {
    // own request context with redirect-following disabled so we can inspect
    // the 302 itself
    const ctx = await request.newContext({
      baseURL: "http://localhost:3000",
    });
    const res = await ctx.fetch("/api/auth/okta", {
      maxRedirects: 0,
    });
    await ctx.dispose();

    expect(res.status()).toBe(302);

    const location = res.headers()["location"];
    expect(location).toBeTruthy();

    // Shape check — don't pin the issuer value, since it differs between
    // local .env.local, CI defaults, and real prod. Just assert the URL is
    // well-formed and the OIDC params we control are all present.
    const url = new URL(location!);
    expect(url.protocol).toMatch(/^https?:$/);
    expect(url.host).not.toBe("");
    expect(url.pathname).toMatch(/\/v1\/authorize$/);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBeTruthy();
    expect(url.searchParams.get("redirect_uri")).toBeTruthy();
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("state")).toBeTruthy();

    // CSRF state cookie should be set on the response
    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("oauth_state=");
  });
});
