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
  SHIFT_VOLUNTEER,
  FUTURE_SHIFT,
  ROLE_SUPER_ADMIN_ID,
  ROLE_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

test.describe("Shift Signup", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(SHIFT_VOLUNTEER);
    await assignRole(SHIFT_VOLUNTEER.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertFullShift(FUTURE_SHIFT);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should browse shifts and see available shift", async ({ page }) => {
    await page.goto("/shifts");

    // The shifts page should load and show our test shift
    await expect(
      page.getByText("E2E Future Shift")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin should add a volunteer to a shift", async ({ page }) => {
    // Sign in as admin
    await signInAsBuiltinAdmin(page);

    // Navigate to the shift's volunteer page
    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    // Wait for the page to load
    await expect(page.getByRole("button", { name: "Add volunteer" })).toBeVisible({
      timeout: 10_000,
    });

    // Click "Add volunteer"
    await page.getByRole("button", { name: "Add volunteer" }).click();

    // Wait for the dialog to open
    await expect(
      page.getByRole("heading", { name: "Add volunteer" })
    ).toBeVisible();

    // Select the test volunteer from the autocomplete
    const volunteerInput = page
      .getByRole("dialog")
      .getByRole("combobox", { name: "Volunteer" });
    await volunteerInput.click();
    await volunteerInput.fill("E2E Shifty");

    const option = page.getByRole("option", { name: /E2E Shifty/i });
    await option.first().click();

    // Select position using the MUI Select combobox
    const positionSelect = page
      .getByRole("dialog")
      .getByRole("combobox", { name: "Position" });
    await positionSelect.click();
    const positionOption = page.getByRole("option", {
      name: /E2E Future Position/i,
    });
    await positionOption.click();

    // Submit
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add volunteer" })
      .click();

    // Verify volunteer appears in the shift volunteer list
    await expect(page.getByText("E2E Shifty")).toBeVisible({ timeout: 10_000 });
  });

  test("non-authenticated user should not see add volunteer button", async ({
    page,
  }) => {
    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    // The "Add volunteer" button should not be visible for unauthenticated users
    const addButton = page.getByRole("button", { name: "Add volunteer" });

    // Either the button is not present or it's disabled
    const count = await addButton.count();
    if (count > 0) {
      await expect(addButton).toBeDisabled();
    }
  });
});
