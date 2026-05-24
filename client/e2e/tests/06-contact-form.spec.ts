import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  assignRole,
  deleteTestMessages,
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
  shiftboardId: IDS.volunteer2,
  playaName: "E2E Contacter",
  worldName: "Contact Tester",
  email: "e2e-contact@test.local",
  passcode: "3333",
});

test.describe("Contact Form", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(volunteer);
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await deleteTestMessages("E2E Test Sender");
    await deleteTestMessages('E2E Contacter "Contact Tester"');
    await cleanupAllTestData();
    await closePool();
  });

  test("should load the contact page", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByText("Off-playa contact form")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should submit a contact message as unauthenticated user", async ({
    page,
  }) => {
    await page.goto("/contact");

    await page.getByLabel("Name").fill("E2E Test Sender");
    await page.getByLabel("Email").fill("e2e-sender@test.local");

    // MUI Select: click the combobox trigger to open the dropdown
    await page.getByRole("combobox", { name: /^To/i }).click();
    await page.getByRole("option", { name: "Send me a reminder" }).click();

    await page.getByLabel("Message").fill("This is an automated E2E test message.");

    await page.getByRole("button", { name: "Send message" }).click();

    await expect(
      page.getByText(/has been recorded/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("should pre-fill name and email for authenticated user", async ({
    page,
  }) => {
    await signInAs(page, volunteer);

    await page.goto("/contact");

    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 10_000 });

    const nameField = page.getByLabel("Name");
    await expect(nameField).toHaveValue(/E2E Contacter/);

    const emailField = page.getByLabel("Email");
    await expect(emailField).toHaveValue("e2e-contact@test.local");
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/contact");

    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page).toHaveURL(/\/contact/);
  });

  test("should allow checking wants reply checkbox", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel("Name").fill("E2E Test Sender");
    await page.getByLabel("Email").fill("e2e-reply@test.local");

    // MUI Select: click the combobox trigger to open the dropdown
    await page.getByRole("combobox", { name: /^To/i }).click();
    await page.getByRole("option", { name: "Send me a reminder" }).click();

    // Check the reply checkbox
    const replyCheckbox = page.getByLabel(/Reply wanted/i);
    if (await replyCheckbox.isVisible()) {
      await replyCheckbox.check();
      await expect(replyCheckbox).toBeChecked();
    }

    await page.getByLabel("Message").fill("E2E test with reply wanted.");

    await page.getByRole("button", { name: "Send message" }).click();

    await expect(
      page.getByText(/has been recorded/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
