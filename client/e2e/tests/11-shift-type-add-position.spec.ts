import { test, expect, type Page } from "@playwright/test";

// Repro for #533: adding a position in the shift-type editor silently fails to
// persist. The backend is fine (#528) — the client drops the added position
// from the PATCH payload. This test intercepts the save request and asserts the
// added position is actually in it. FAILS on the bug; passes once fixed.
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
    page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
    page.on("console", (m) => {
      const t = m.text();
      if (t.startsWith("NATIVE_SUBMIT") || t.startsWith("DBG_"))
        console.log("BROWSER:", t);
    });
    page.on("request", (r) => {
      if (r.method() === "PATCH") console.log("REQ PATCH:", r.url());
    });

    await signIn(page);

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

    // watch the native form submit event to distinguish "click didn't submit"
    // from "submitted but validation/handler dropped it"
    await page.evaluate(() => {
      document.querySelector("form")?.addEventListener(
        "submit",
        () => console.log("NATIVE_SUBMIT_FIRED"),
        { capture: true }
      );
    });

    // save
    const submitBtn = page
      .getByRole("button", { name: "Update shift type" })
      .last();
    console.log(
      "DBG count=",
      await page.getByRole("button", { name: "Update shift type" }).count(),
      "disabled=",
      await submitBtn.isDisabled(),
      "type=",
      await submitBtn.getAttribute("type"),
      "forms=",
      await page.locator("form").count()
    );
    await submitBtn.click();
    await page.waitForTimeout(2500);
    console.log("DBG after click, patchBody null?", patchBody === null);

    // isolate HTML5 constraint validation: which required field blocks submit?
    if (patchBody === null) {
      const report = await page.evaluate(() => {
        const f = document.querySelector("form") as HTMLFormElement | null;
        if (!f) return "no form";
        const valid = f.checkValidity();
        const invalids = Array.from(
          f.querySelectorAll(":invalid")
        ).map((el) => {
          const e = el as HTMLInputElement;
          return `${e.name || e.getAttribute("name") || e.tagName}[req=${e.required},disabled=${e.disabled},val="${e.value}"]`;
        });
        return `checkValidity=${valid} invalid=[${invalids.join(", ")}]`;
      });
      console.log("DBG_CONSTRAINT", report);
    }

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
