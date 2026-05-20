import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

test.describe("Admin Shift Categories", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("super admin should load categories page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/categories");

    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("super admin should create a new category", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/categories");

    // Wait for page to load
    await expect(
      page.getByRole("button", { name: /create shift category/i })
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /create shift category/i }).click();

    // Wait for the dialog
    await expect(
      page.getByRole("heading", { name: "Create shift category" })
    ).toBeVisible();

    // Fill in category name
    await page
      .getByRole("dialog")
      .getByLabel("Name")
      .fill("E2E Test Category");

    // Department is an MUI Select (combobox) - click to open and select first option
    const departmentSelect = page
      .getByRole("dialog")
      .getByRole("combobox", { name: "Department" });
    await departmentSelect.click();
    await page.getByRole("option").first().click();

    // Submit
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /create shift category/i })
      .click();

    // Verify success
    await expect(
      page.getByText(/has been created/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should display existing categories", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/shifts/categories");

    // Wait for the table to load and show data
    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });

    // The pagination should show records exist
    await expect(page.getByText(/of \d+/)).toBeVisible({ timeout: 5_000 });
  });
});
