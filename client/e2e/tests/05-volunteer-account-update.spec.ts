import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  makeTestVolunteer,
  signInAs,
} from "../fixtures/test-data";

// Sign-in now lands on /volunteers/{id}/info (the canonical VIP page); the
// legacy /account URL server-redirects there (see 21-account-redirects-to-info).
// In-app playa-name editing was removed with that move — name changes go to the
// external Burner Profile — so the old "update playa name" test is gone. Camping
// location is still editable inline (auto-saves on blur), so that test remains,
// retargeted to the current info-page UI.

const volunteer = makeTestVolunteer({
  shiftboardId: IDS.updateVolunteer,
  playaName: "E2E UpdateMe",
  worldName: "Update Tester",
  email: "e2e-update@test.local",
  passcode: "2222",
});

test.describe("Volunteer Account Update", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(volunteer);
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should display current account info after sign in", async ({
    page,
  }) => {
    await signInAs(page, volunteer);

    // The info page greets the signed-in volunteer by their playa name.
    await expect(
      page.getByRole("heading", { name: "Welcome, E2E UpdateMe!" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should update location field", async ({ page }) => {
    await signInAs(page, volunteer);

    // Camping location is an inline field on the info page (no label; targeted
    // by its placeholder). It auto-saves on blur — no submit button.
    const locationField = page.getByPlaceholder(/camp at/i);
    await expect(locationField).toBeVisible({ timeout: 10_000 });
    await locationField.fill("New Camp at 7:00 & G");
    await locationField.blur();

    await expect(
      page.getByText(/camping location.*updated/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
