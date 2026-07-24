import { test, expect, type Page } from "@playwright/test";

// #533 regression: adding a position in the shift-type editor must reach the
// save. Drives the real editor, adds a position, and asserts the added position
// is in the PATCH payload. (Set REAL_SAVE=1 to let the save hit the DB instead
// of being mocked — confirms end-to-end persistence.)
const TYPE_ID = 3; // "Gate Sampling" — has a category set + 10 times/positions

// Log in as the built-in super-admin ("Admin"/123456). Inlined (not the shared
// signInAsBuiltinAdmin fixture) with generous timeouts, because Next dev
// compiles routes on-demand and the first hit can exceed the fixture's 10s wait.
// NOTE: post-login lands on /volunteers/{id}/info (default since 2026-05-25);
// the shared fixture still waits for /account and is stale.
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

test.describe("Shift-type editor: adding a position (#533)", () => {
  test.setTimeout(120_000);

  test("an added position is present in the save (PATCH) payload", async ({
    page,
  }) => {
    await signIn(page);

    let patchBody: { timeList?: { positionList?: { name: string }[] }[] } | null =
      null;
    const realSave = process.env.REAL_SAVE === "1";
    await page.route(`**/api/shifts/types/${TYPE_ID}`, async (route) => {
      if (route.request().method() === "PATCH") {
        patchBody = route.request().postDataJSON();
        if (realSave) {
          await route.continue(); // hit the real backend to verify persistence
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "{}",
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.goto(`/shifts/types/update/${TYPE_ID}`);

    await expect(
      page.getByRole("button", { name: "Add position" }).first()
    ).toBeVisible({ timeout: 30_000 });

    // open the add-position dialog
    await page.getByRole("button", { name: "Add position" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Add position" })
    ).toBeVisible();

    // select the first available position + capture its name (selecting a
    // position auto-fills its Alias, so the add passes the dialog's validation)
    await dialog.getByRole("combobox", { name: /Position/ }).click();
    const firstOption = page.getByRole("option").first();
    const positionName = ((await firstOption.textContent()) ?? "").trim();
    await firstOption.click();

    await dialog.getByLabel("Slots").fill("2");
    await dialog.getByLabel("SAP points").fill("4");

    // add it to the form (dialog's own "Add position" submit button)
    await dialog.getByRole("button", { name: "Add position" }).click();
    await expect(page.getByText(/position has been added/i)).toBeVisible({
      timeout: 10_000,
    });

    // save
    await page.getByRole("button", { name: "Update shift type" }).last().click();
    await expect.poll(() => patchBody, { timeout: 15_000 }).not.toBeNull();

    // the added position must be in at least one time's positionList
    const names = new Set<string>();
    for (const t of patchBody!.timeList ?? []) {
      for (const p of t.positionList ?? []) names.add(p.name);
    }
    expect(
      [...names],
      `added position "${positionName}" should be in the save payload`
    ).toContain(positionName);
  });
});
