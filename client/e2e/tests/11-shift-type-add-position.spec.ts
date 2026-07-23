import { test, expect } from "@playwright/test";

import { buildSessionCookieValue } from "../helpers/session";

// Repro for #533: adding a position in the shift-type editor silently fails to
// persist. The backend is fine (#528) — the client drops the added position
// from the PATCH payload. This test intercepts the save request and asserts the
// added position is actually in it. FAILS on the bug; passes once fixed.
const TYPE_ID = 15; // "Setup" shift type (op_shift_name.shift_name_id) — has many times
const SUPERADMIN_SB = 3265; // super-admin (role_id 1) in the local census DB

test.describe("Shift-type editor: adding a position (#533)", () => {
  test("an added position is present in the save (PATCH) payload", async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: "census-session",
        value: buildSessionCookieValue(SUPERADMIN_SB),
        domain: "localhost",
        path: "/",
      },
    ]);

    // Intercept the save so we can inspect the payload without mutating local data.
    let patchBody: { timeList?: { positionList?: { name: string }[] }[] } | null =
      null;
    await page.route(`**/api/shifts/types/${TYPE_ID}`, async (route) => {
      if (route.request().method() === "PATCH") {
        patchBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "{}",
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/shifts/types/update/${TYPE_ID}`);

    // editor loaded (super-admin-gated by AuthGate)
    await expect(
      page.getByRole("button", { name: "Add position" })
    ).toBeVisible({ timeout: 15_000 });

    // open the add-position dialog
    await page.getByRole("button", { name: "Add position" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Add position" })
    ).toBeVisible();

    // select the first available position + capture its name
    await dialog.getByRole("combobox", { name: /Position/ }).click();
    const firstOption = page.getByRole("option").first();
    const positionName = ((await firstOption.textContent()) ?? "").trim();
    await firstOption.click();

    await dialog.getByLabel("Slots").fill("2");
    await dialog.getByLabel("SAP points").fill("4");

    // add it to the form
    await dialog.getByRole("button", { name: "Add position" }).click();
    await expect(page.getByText(/position has been added/i)).toBeVisible({
      timeout: 10_000,
    });

    // save
    await page
      .getByRole("button", { name: "Update shift type" })
      .last()
      .click();

    // wait for the intercepted PATCH
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
