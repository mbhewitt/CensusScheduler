import { test, expect } from "@playwright/test";
import {
  insertFullShift,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import { FUTURE_SHIFT, signInAsBuiltinAdmin } from "../fixtures/test-data";

test.describe("Shift Browsing", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertFullShift(FUTURE_SHIFT);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should load shifts page", async ({ page }) => {
    await page.goto("/shifts");

    // /shifts is now an agenda/card view (no <table>). Its toolbar always
    // renders the Filter control, so use that as the "page loaded" signal.
    await expect(
      page.getByRole("button", { name: "Filter" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display test shift in the list", async ({ page }) => {
    await page.goto("/shifts");

    // Wait for the agenda toolbar to render
    await expect(
      page.getByRole("button", { name: "Filter" })
    ).toBeVisible({ timeout: 10_000 });

    // Each shift renders as a card whose heading is the shift name
    await expect(
      page.getByText("E2E Future Shift").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show shift details on volunteer page", async ({ page }) => {
    // The shift-volunteers page + its /api/shifts/{id}/volunteers feed require
    // a session (401 otherwise), so sign in before viewing details.
    await signInAsBuiltinAdmin(page);
    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    // Should show the shift name somewhere on the page
    await expect(
      page.getByText("E2E Future Shift").first()
    ).toBeVisible({ timeout: 10_000 });

    // Should show position info
    await expect(
      page.getByText("E2E Future Position").first()
    ).toBeVisible();
  });

  test("should show slot availability", async ({ page }) => {
    await signInAsBuiltinAdmin(page);
    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    // Should show slots like "0 / 3" (0 filled, 3 total)
    await expect(
      page.getByText(/0\s*\/\s*3/)
    ).toBeVisible({ timeout: 10_000 });
  });
});
