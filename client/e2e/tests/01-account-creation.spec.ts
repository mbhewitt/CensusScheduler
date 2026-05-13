import { test, expect } from "@playwright/test";
import { closePool, cleanupAllTestData } from "../helpers/db";

test.describe("Account Creation", () => {
  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should create an account with all required fields", async ({
    page,
  }) => {
    await page.goto("/volunteers/account/create");

    await page.getByLabel("Playa / preferred name").fill("E2E Sparkle");
    await page.getByLabel("Default world name").fill("Jane Doe");
    await page.getByLabel("Email").fill("e2e-sparkle@test.local");

    // Password fields need locator by name attribute (type=password has no textbox role)
    await page.locator('input[name="passcodeCreate"]').fill("5678");
    await page.locator('input[name="passcodeConfirm"]').fill("5678");

    await page.getByRole("button", { name: "Create account" }).click();

    // Verify the success snackbar confirms creation
    await expect(
      page.getByText(/has been created/i)
    ).toBeVisible({ timeout: 10_000 });

    // Should navigate away from the create page
    await expect(page).not.toHaveURL(/\/volunteers\/account\/create/);
  });

  test("should create an account with all fields including optional", async ({
    page,
  }) => {
    await page.goto("/volunteers/account/create");

    await page.getByLabel("Playa / preferred name").fill("E2E FullInfo");
    await page.getByLabel("Default world name").fill("John Smith");
    await page.getByLabel("Email").fill("e2e-fullinfo@test.local");
    await page.getByLabel("Phone").fill("555-0123");
    await page.getByLabel("Location").fill("Camp E2E at 3:00 & Esplanade");
    await page.getByLabel("Emergency contact").fill("Mom 555-0199");
    await page.locator('input[name="passcodeCreate"]').fill("9012");
    await page.locator('input[name="passcodeConfirm"]').fill("9012");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText(/has been created/i)
    ).toBeVisible({ timeout: 10_000 });

    await expect(page).not.toHaveURL(/\/volunteers\/account\/create/);
  });

  test("should show validation errors for empty required fields", async ({
    page,
  }) => {
    await page.goto("/volunteers/account/create");

    // Click create without filling anything
    await page.getByRole("button", { name: "Create account" }).click();

    // Should stay on the same page (not redirect)
    await expect(page).toHaveURL(/\/volunteers\/account\/create/);
  });

  test("should reject passcode that is not 4 digits", async ({ page }) => {
    await page.goto("/volunteers/account/create");

    await page.getByLabel("Playa / preferred name").fill("E2E BadPin");
    await page.getByLabel("Default world name").fill("Bad Pin");
    await page.getByLabel("Email").fill("e2e-badpin@test.local");

    // Try a 3-digit passcode
    const passcodeField = page.locator('input[name="passcodeCreate"]');
    await passcodeField.fill("123");
    await passcodeField.blur();

    // Try to submit - should fail validation
    await page.getByRole("button", { name: "Create account" }).click();

    // Should stay on create page
    await expect(page).toHaveURL(/\/volunteers\/account\/create/);
  });

  test("should reject mismatched passcode confirmation", async ({ page }) => {
    await page.goto("/volunteers/account/create");

    await page.getByLabel("Playa / preferred name").fill("E2E Mismatch");
    await page.getByLabel("Default world name").fill("Mismatch User");
    await page.getByLabel("Email").fill("e2e-mismatch@test.local");
    await page.locator('input[name="passcodeCreate"]').fill("1234");
    await page.locator('input[name="passcodeConfirm"]').fill("5678");

    // Submit
    await page.getByRole("button", { name: "Create account" }).click();

    // Should show mismatch error and stay on page
    await expect(page).toHaveURL(/\/volunteers\/account\/create/);
    await expect(
      page.getByText(/must match/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should navigate to create account from sign-in page", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/volunteers\/account\/create/);
  });
});
