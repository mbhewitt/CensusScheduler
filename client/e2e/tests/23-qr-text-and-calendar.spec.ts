import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  ADMIN_VOLUNTEER,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

// #661 (plain-text QR type) + #662 (calendar plain-text location + description).
test.describe("QR codes: text type + calendar fields", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("editor exposes a Text type with a text payload input (#661)", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);
    await page.goto("/qr-codes");

    await page.getByRole("button", { name: /new qr code/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Switch to the Text type and enter arbitrary (non-URL) text.
    await dialog.getByRole("button", { name: "Text", exact: true }).click();
    const textField = dialog.getByLabel("Text", { exact: true });
    await expect(textField).toBeVisible();
    await textField.fill("Census Lab at 6:30 & A");
    await expect(textField).toHaveValue("Census Lab at 6:30 & A");
  });

  test("calendar accepts a plain-text location and a description (#662)", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);
    await page.goto("/qr-codes");

    await page.getByRole("button", { name: /new qr code/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Calendar is the default type; the location field takes plain text now.
    const location = dialog.getByLabel(/location/i);
    await location.fill("Census Lab at 6:30 & A");
    await expect(location).toHaveValue("Census Lab at 6:30 & A");

    const description = dialog.getByLabel("Description");
    await expect(description).toBeVisible();
    await description.fill("Come find us: https://census.burningman.org");
    await expect(description).toHaveValue(
      "Come find us: https://census.burningman.org"
    );
  });
});
