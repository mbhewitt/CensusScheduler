import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import { IDS, makeTestVolunteer } from "../fixtures/test-data";

const volunteer = makeTestVolunteer({
  shiftboardId: IDS.volunteer1,
  playaName: "E2E SignInUser",
  worldName: "Sign In Tester",
  email: "e2e-signin@test.local",
  passcode: "4567",
});

test.describe("Sign In", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(volunteer);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should sign in with valid credentials", async ({ page }) => {
    await page.goto("/sign-in");

    // Select volunteer from autocomplete
    const volunteerInput = page.getByRole("combobox", { name: "Volunteer" });
    await volunteerInput.click();
    await volunteerInput.fill("E2E SignInUser");

    const option = page.getByRole("option", { name: /E2E SignInUser/i });
    await option.first().click();

    // Enter passcode
    await page.locator('input[name="passcode"]').fill("4567");

    // Submit
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to account page
    await page.waitForURL(/\/volunteers\/\d+\/account/, { timeout: 10_000 });

    // Verify volunteer info is displayed
    await expect(page.getByText("E2E SignInUser")).toBeVisible();
  });

  test("should show error for wrong passcode", async ({ page }) => {
    await page.goto("/sign-in");

    const volunteerInput = page.getByRole("combobox", { name: "Volunteer" });
    await volunteerInput.click();
    await volunteerInput.fill("E2E SignInUser");

    const option = page.getByRole("option", { name: /E2E SignInUser/i });
    await option.first().click();

    await page.locator('input[name="passcode"]').fill("0000");

    await page.getByRole("button", { name: "Sign in" }).click();

    // Should show error snackbar and stay on sign-in page
    await expect(
      page.getByText(/incorrect/i)
    ).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("should populate volunteer dropdown", async ({ page }) => {
    await page.goto("/sign-in");

    const volunteerInput = page.getByRole("combobox", { name: "Volunteer" });
    await volunteerInput.click();
    await volunteerInput.fill("E2E");

    // Should show at least our test volunteer in the dropdown
    await expect(
      page.getByRole("option", { name: /E2E SignInUser/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should require both fields to sign in", async ({ page }) => {
    await page.goto("/sign-in");

    // Try clicking sign in without filling anything
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should stay on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
