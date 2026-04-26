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
  SHIFT_VOLUNTEER,
  CURRENT_SHIFT,
  FUTURE_SHIFT,
  ROLE_SUPER_ADMIN_ID,
  ROLE_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

test.describe("Check-In", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(SHIFT_VOLUNTEER);
    await assignRole(SHIFT_VOLUNTEER.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);

    // Create a current (active) shift and a future shift
    await insertFullShift(CURRENT_SHIFT);
    await insertFullShift(FUTURE_SHIFT);

    // Add volunteer to the current shift (noshow="X" means not yet checked in)
    await insertVolunteerShift(
      SHIFT_VOLUNTEER.shiftboardId,
      CURRENT_SHIFT.timePositionId,
      "X"
    );

    // Add volunteer to the future shift
    await insertVolunteerShift(
      SHIFT_VOLUNTEER.shiftboardId,
      FUTURE_SHIFT.timePositionId,
      "X"
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should check in a volunteer during an active shift", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${CURRENT_SHIFT.shiftTimesId}/volunteers`
    );

    // Wait for volunteer list to load
    await expect(page.getByText("E2E Shifty")).toBeVisible({
      timeout: 15_000,
    });

    // Find the check-in switch (MUI Switch has role="switch")
    const row = page.getByRole("row").filter({ hasText: "E2E Shifty" });
    const checkInSwitch = row.getByRole("switch");

    // The switch should be enabled during an active shift
    await expect(checkInSwitch).toBeEnabled();

    // Toggle check-in
    await checkInSwitch.click();

    // Verify the snackbar confirms check-in
    await expect(
      page.getByText(/has checked in/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should check out a previously checked-in volunteer", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${CURRENT_SHIFT.shiftTimesId}/volunteers`
    );

    await expect(page.getByText("E2E Shifty")).toBeVisible({
      timeout: 15_000,
    });

    const row = page.getByRole("row").filter({ hasText: "E2E Shifty" });
    const checkInSwitch = row.getByRole("switch");

    // Toggle check-out
    await checkInSwitch.click();

    // Verify the snackbar confirms check-out
    await expect(
      page.getByText(/has checked out/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("check-in should be disabled for future shifts", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`
    );

    await expect(page.getByText("E2E Shifty")).toBeVisible({
      timeout: 15_000,
    });

    const row = page.getByRole("row").filter({ hasText: "E2E Shifty" });
    const checkInSwitch = row.getByRole("switch");

    // Check-in switch should be disabled for future shifts
    await expect(checkInSwitch).toBeDisabled();
  });

  test("volunteer can see their shifts on account page", async ({
    page,
  }) => {
    // Sign in as the volunteer
    await signInAs(page, SHIFT_VOLUNTEER);

    // Should be on the account page showing shifts section
    await expect(page.getByRole("heading", { name: "Shifts" })).toBeVisible({
      timeout: 10_000,
    });

    // Look for the current shift position in the volunteer's shift list
    await expect(page.getByText("E2E Tester Position")).toBeVisible({
      timeout: 10_000,
    });
  });
});
