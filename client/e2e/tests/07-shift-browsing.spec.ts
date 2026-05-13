import { test, expect } from "@playwright/test";
import {
  insertFullShift,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import { FUTURE_SHIFT } from "../fixtures/test-data";

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

    // The page should load with a table/list of shifts
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display test shift in the list", async ({ page }) => {
    await page.goto("/shifts");

    // Wait for table to load
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });

    // The shift name appears as a Chip in the "Type" column
    // It may also appear as text in filters; use broad search
    await expect(
      page.getByText("E2E Future Shift").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show shift details on volunteer page", async ({ page }) => {
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
    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    // Should show slots like "0 / 3" (0 filled, 3 total)
    await expect(
      page.getByText(/0\s*\/\s*3/)
    ).toBeVisible({ timeout: 10_000 });
  });
});
