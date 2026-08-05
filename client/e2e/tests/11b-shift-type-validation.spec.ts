import { test, expect, type Page } from "@playwright/test";

// #533 investigation — shift-type editor validation:
//  (FIX) Save silently no-op'd when a required field is empty, because native
//        HTML5 constraint validation blocked submit before RHF ran. Fixed with
//        noValidate so RHF surfaces the message. Verified by the first test.
//  (REGRESSION GUARD) The Add-time dialog was suspected of letting a blank/
//        duplicate Instance through (which would collide with shift_instance's
//        UNIQUE index on save). Verified it does NOT — the dialog correctly
//        blocks a blank Instance. Kept as a guard for that exact concern.

const TYPE_EMPTY_CATEGORY = 15; // "Setup" — has a blank category in the data
const TYPE_OK = 3; // "Gate Sampling" — has a category + times

async function signIn(page: Page) {
  await page.goto("/sign-in");
  const volunteerInput = page.getByRole("combobox", { name: "Volunteer" });
  await volunteerInput.click();
  await volunteerInput.fill("Admin");
  await page.getByRole("option", { name: /Admin/i }).first().click();
  await page.locator('input[name="passcode"]').fill("123456");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/volunteers\/\d+\/(info|account)/, { timeout: 60_000 });
}

test.describe("Shift-type editor validation (#533)", () => {
  test.setTimeout(120_000);

  // Path 2: an empty required field must surface an error on Save, not silently
  // do nothing.
  test("Save surfaces a required-field error instead of silently no-op'ing", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/shifts/types/update/${TYPE_EMPTY_CATEGORY}`);
    await expect(
      page.getByRole("button", { name: "Update shift type" }).last()
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Update shift type" }).last().click();

    // the required Category must now be called out (previously: nothing happened)
    await expect(page.getByText("Category is required")).toBeVisible({
      timeout: 10_000,
    });
  });

  // Path 1: the Add-time dialog must not let a blank Instance through. The bug
  // was a stale `errors` read that let the add proceed despite setError() — so
  // the dialog would CLOSE (time added with a bad instance). After the fix it
  // stays OPEN with the error shown. (Picker-free: a blank required field is
  // enough to exercise the same guard; Instance is the one that matters.)
  test("Add-time is blocked (dialog stays open) when Instance is blank", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/shifts/types/update/${TYPE_OK}`);
    await expect(
      page.getByRole("button", { name: "Add time" })
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Add time" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Add time" })).toBeVisible();

    // pick a Day so it's clearly the blank Instance driving the block
    await dialog.getByRole("combobox", { name: /Day/ }).click();
    await page.getByRole("option").first().click();

    // leave Instance blank, try to add
    await dialog.getByRole("button", { name: "Add time" }).click();

    // must be blocked: instance error shown AND the dialog is still open
    // (pre-fix, the stale-errors guard let it through and the dialog closed)
    await expect(dialog.getByText(/Instance is required/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(dialog.getByRole("heading", { name: "Add time" })).toBeVisible();
  });
});
