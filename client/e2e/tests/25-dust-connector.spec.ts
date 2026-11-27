// Dust integration (#798): the connect hop must only ever hand a token to
// dust.events, and the shift endpoint must refuse anything but a Dust token —
// in particular a census-session cookie value replayed as a Bearer token.

import { test, expect } from "@playwright/test";

import { buildSessionCookieValue } from "../helpers/session";

test.describe("Dust connector", () => {
  test("rejects a non-dust.events redirect", async ({ request }) => {
    for (const bad of [
      "https://evil.example/x",
      "https://dust.events.evil.example/x",
      "http://dust.events/x",
      "",
    ]) {
      const res = await request.get(
        `/api/dust?dust_redirect=${encodeURIComponent(bad)}`,
        { maxRedirects: 0 }
      );
      expect(res.status(), bad).toBe(400);
    }
  });

  test("signed out: sends the volunteer to Okta, then back here", async ({
    request,
  }) => {
    const res = await request.get(
      `/api/dust?dust_redirect=${encodeURIComponent("https://dust.events/volunteeripate0.5")}`,
      { maxRedirects: 0 }
    );
    expect(res.status()).toBe(307);
    const location = res.headers()["location"];
    expect(location).toContain("/api/auth/okta?returnTo=");
    expect(decodeURIComponent(location)).toContain("/api/dust?dust_redirect=");
  });

  test("signed in: redirects to dust.events with a token that works once there", async ({
    request,
  }) => {
    const res = await request.get(
      `/api/dust?dust_redirect=${encodeURIComponent("https://dust.events/volunteeripate0.5")}`,
      {
        maxRedirects: 0,
        headers: {
          cookie: `census-session=${buildSessionCookieValue(999999001)}`,
        },
      }
    );
    expect(res.status()).toBe(307);
    const location = new URL(res.headers()["location"]);
    expect(location.origin).toBe("https://dust.events");
    // Dust parses `url.split("?")[1].split("=")`, so token must be the only
    // query param and contain no "=".
    expect(location.search.startsWith("?token=")).toBe(true);
    const token = location.searchParams.get("token") ?? "";
    expect(token).not.toContain("=");

    const data = await request.post("/api/dust/shift_data.json", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(data.status()).toBe(200);
    expect(Array.isArray(await data.json())).toBe(true);
  });

  test("shift_data refuses a missing token or a session cookie value", async ({
    request,
  }) => {
    for (const auth of [
      undefined,
      "Bearer nonsense",
      `Bearer ${buildSessionCookieValue(999999001)}`,
    ]) {
      const res = await request.post("/api/dust/shift_data.json", {
        headers: auth ? { Authorization: auth } : {},
      });
      expect(res.status()).toBe(200);
      expect(await res.json()).toHaveProperty("error");
    }
  });
});
