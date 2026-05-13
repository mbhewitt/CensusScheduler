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

test.describe("Admin Shift Types", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertFullShift(FUTURE_SHIFT);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("super admin should load shift types page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/types");

    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display existing shift types", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/types");

    await expect(
      page.getByText("E2E Future Shift")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("super admin should navigate to create shift type", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/types");

    await page.getByRole("button", { name: /create/i }).click();

    await page.waitForURL(/\/shifts\/types\/create/, { timeout: 10_000 });
  });

  test("super admin should navigate to update shift type", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/types");

    // Find the row with our test shift type
    const row = page
      .getByRole("row")
      .filter({ hasText: "E2E Future Shift" });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });

    // Click the MoreMenu (actions) button in the row
    const menuButton = row.getByRole("button").last();
    await menuButton.click();

    // Click "Update shift type" in the menu
    await page.getByRole("menuitem", { name: /update shift type/i }).click();

    // Should navigate to update page
    await page.waitForURL(/\/shifts\/types\/update\/\d+/, {
      timeout: 10_000,
    });
  });
});
