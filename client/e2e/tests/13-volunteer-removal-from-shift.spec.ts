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
  FUTURE_SHIFT,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  makeTestVolunteer,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

const removalVolunteer = makeTestVolunteer({
  shiftboardId: IDS.removalVolunteer,
  playaName: "E2E RemoveMe",
  worldName: "Removal Tester",
  email: "e2e-remove@test.local",
  passcode: "7777",
});

test.describe("Volunteer Removal from Shift", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertVolunteer(removalVolunteer);
    await insertFullShift(FUTURE_SHIFT);
    await insertVolunteerShift(
      removalVolunteer.shiftboardId,
      FUTURE_SHIFT.timePositionId,
      "X"
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("volunteer should be visible in shift before removal", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`
    );

    await expect(page.getByText("E2E RemoveMe")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("admin should remove volunteer from shift", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`
    );

    await expect(page.getByText("E2E RemoveMe")).toBeVisible({
      timeout: 10_000,
    });

    // Find the volunteer's row
    const row = page
      .getByRole("row")
      .filter({ hasText: "E2E RemoveMe" });

    // Click the MoreMenu (Admin actions) button - last button in the row
    const menuButton = row.getByRole("button").last();
    await menuButton.click();

    // Click "Remove volunteer" in the menu
    await page.getByRole("menuitem", { name: /remove volunteer/i }).click();

    // Confirm in the removal dialog
    await expect(
      page.getByRole("heading", { name: /remove volunteer/i })
    ).toBeVisible();

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /remove volunteer/i })
      .click();

    // Verify success notification
    await expect(
      page.getByText(/has been removed/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("removed volunteer should not appear in shift list", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`
    );

    // Wait for the page to load
    await expect(page.getByRole("heading", { name: "Volunteers" })).toBeVisible({
      timeout: 10_000,
    });

    // Volunteer should no longer be in the list
    await expect(page.getByText("E2E RemoveMe")).not.toBeVisible();
  });
});
