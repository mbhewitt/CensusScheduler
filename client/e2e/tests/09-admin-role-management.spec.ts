import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  assignRole,
  deleteRoleByName,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  makeTestVolunteer,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

const roleVolunteer = makeTestVolunteer({
  shiftboardId: IDS.roleVolunteer,
  playaName: "E2E RoleVol",
  worldName: "Role Tester",
  email: "e2e-role@test.local",
  passcode: "6666",
});

test.describe("Admin Role Management", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    // Clean up any leftover UI-created role from previous runs
    await deleteRoleByName("E2E Test Role");
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertVolunteer(roleVolunteer);
    await assignRole(roleVolunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await deleteRoleByName("E2E Test Role");
    await cleanupAllTestData();
    await closePool();
  });

  test("admin should load roles page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/roles");

    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("admin should see system roles in the table", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/roles");

    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.locator("td").filter({ hasText: "SuperAdmin" }).first()
    ).toBeVisible();
  });

  test("admin should create a new role", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/roles");

    // Wait for page to fully load
    await expect(page.getByRole("button", { name: "Create role" })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Create role" }).click();

    await expect(
      page.getByRole("heading", { name: "Create role" })
    ).toBeVisible();

    await page
      .getByRole("dialog")
      .getByLabel("Name")
      .fill("E2E Test Role");

    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create role" })
      .click();

    await expect(
      page.getByText(/has been created/i)
    ).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("E2E Test Role")).toBeVisible();
  });

  test("admin should toggle role display", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/roles");

    const row = page
      .getByRole("row")
      .filter({ hasText: "E2E Test Role" });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });

    // Role display toggle uses MUI Switch (role="switch")
    const toggle = row.getByRole("switch");
    if (await toggle.isVisible()) {
      await toggle.click();

      await expect(
        page.getByText(/updated/i)
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("non-admin should not access roles page", async ({ page }) => {
    await signInAs(page, roleVolunteer);

    await page.goto("/roles");

    await expect(page).not.toHaveURL(/\/roles$/);
  });
});
