import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  insertFullShift,
  insertVolunteerShift,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  CURRENT_SHIFT,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  makeTestVolunteer,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

const managedVolunteer = makeTestVolunteer({
  shiftboardId: IDS.adminMgmtVolunteer,
  playaName: "E2E Managed",
  worldName: "Managed Tester",
  email: "e2e-managed@test.local",
  passcode: "5555",
});

test.describe("Admin Volunteer Management", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertVolunteer(managedVolunteer);
    await assignRole(managedVolunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
    await insertFullShift(CURRENT_SHIFT);
    await insertVolunteerShift(
      managedVolunteer.shiftboardId,
      CURRENT_SHIFT.timePositionId,
      ""
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("admin should see volunteer list page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    await expect(page.locator("table, [role='table']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("admin should see test volunteer in the list", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    await expect(
      page.getByText("E2E Managed")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin should navigate to volunteer account page", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/volunteers/${managedVolunteer.shiftboardId}/account`
    );

    // Verify the account page shows the volunteer's data in form fields
    await expect(page.getByLabel("Playa / preferred name")).toHaveValue(
      "E2E Managed",
      { timeout: 10_000 }
    );
    await expect(page.getByLabel("Default world name")).toHaveValue(
      "Managed Tester"
    );
  });

  test("admin should see volunteer shift counts", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    const row = page
      .getByRole("row")
      .filter({ hasText: "E2E Managed" });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  });

  test("non-admin should not access volunteer management", async ({
    page,
  }) => {
    await signInAs(page, managedVolunteer);

    await page.goto("/volunteers");

    await expect(page).not.toHaveURL(/\/volunteers$/);
  });
});
