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

    // The account page should show the volunteer's info in form fields
    await expect(page.getByLabel("Playa / preferred name")).toHaveValue(
      "E2E UpdateMe",
      { timeout: 10_000 }
    );
  });

  test("should update playa name", async ({ page }) => {
    await signInAs(page, volunteer);

    const playaNameField = page.getByLabel("Playa / preferred name");
    await expect(playaNameField).toBeVisible({ timeout: 10_000 });
    await playaNameField.clear();
    await playaNameField.fill("E2E Updated Name");

    await page
      .getByRole("button", { name: /update profile/i })
      .click();

    await expect(
      page.getByText(/updated/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should update location field", async ({ page }) => {
    await signInAs(page, volunteer);

    const locationField = page.getByLabel("Location");
    await expect(locationField).toBeVisible({ timeout: 10_000 });
    await locationField.clear();
    await locationField.fill("New Camp at 7:00 & G");

    await page
      .getByRole("button", { name: /update profile/i })
      .click();

    await expect(
      page.getByText(/updated/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should update emergency contact field", async ({ page }) => {
    await signInAs(page, volunteer);

    const emergencyField = page.getByLabel("Emergency contact");
    await expect(emergencyField).toBeVisible({ timeout: 10_000 });
    await emergencyField.clear();
    await emergencyField.fill("Dad 555-1111");

    await page
      .getByRole("button", { name: /update profile/i })
      .click();

    await expect(
      page.getByText(/updated/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
