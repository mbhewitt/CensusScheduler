import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  insertFullShift,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  FUTURE_SHIFT,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

test.describe("Admin Shift Positions", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    // Insert a shift to ensure position types exist
    await insertFullShift(FUTURE_SHIFT);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("super admin should load positions page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/positions");

    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("super admin should navigate to create position", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/positions");

    await page.getByRole("button", { name: /create/i }).click();

    await page.waitForURL(/\/shifts\/positions\/create/, {
      timeout: 10_000,
    });
  });

  test("should display position creation form fields", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/positions/create");

    await expect(page.getByLabel(/position name|name/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display existing positions", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/positions");

    // Wait for the table to load
    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });

    // The pagination should show records exist
    await expect(page.getByText(/of \d+/)).toBeVisible({ timeout: 5_000 });
  });
});
