import { test, expect } from "@playwright/test";
import {
  assignRole,
  cleanupAllTestData,
  closePool,
  insertVolunteer,
} from "../helpers/db";
import {
  IDS,
  makeTestVolunteer,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAs,
} from "../fixtures/test-data";

const volunteer = makeTestVolunteer({
  shiftboardId: IDS.navVolunteer,
  playaName: "E2E NavUser",
  worldName: "Nav Tester",
  email: "e2e-nav@test.local",
  passcode: "2468",
});

test.describe("Avatar menu + profile pop-ups (#814, #631)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(volunteer);
    // on-playa build redirects volunteers without this role to the BS page
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("signed out: Sign in button, same drawer, June banner on Home", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Sign in" }).first()
    ).toBeVisible();
    await expect(
      page.getByText(/shifts will be released in June/)
    ).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation");
    for (const name of ["Home", "Training", "Reports", "Help", "Contact"]) {
      await expect(nav.getByRole("link", { name })).toBeVisible();
    }
    await expect(nav.getByText("Sign in")).toBeVisible();
  });

  test("signed in: avatar initial, Home is the checklist, profile + settings pop-ups", async ({
    page,
  }) => {
    await signInAs(page, volunteer);

    // own /info lands on Home, which is the checklist page
    await page.goto(`/volunteers/${volunteer.shiftboardId}/info`);
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByText(/Pre-playa Checklist/)).toBeVisible();
    await expect(
      page.getByText(/shifts will be released in June/)
    ).toBeVisible();

    const avatar = page.getByRole("button", { name: "Account menu" });
    await expect(avatar).toHaveText("E");

    // My profile opens over the current page
    await page.goto("/training");
    await avatar.click();
    await page.getByRole("menuitem", { name: "My profile" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("My profile")).toBeVisible();
    await expect(dialog.getByText("Nav Tester")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Update passcode" })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/training#profile$/);
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/training$/);

    await avatar.click();
    await page.getByRole("menuitem", { name: "App settings" }).click();
    await expect(
      page.getByRole("dialog").getByText("Receive emails from Census")
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close" })
      .click();

    // old account links open the profile pop-up
    await page.goto(`/volunteers/${volunteer.shiftboardId}/account`);
    await expect(
      page.getByRole("dialog").getByText("My profile")
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close" })
      .click();

    // drawer is the same signed in: Home stays, Sign out at the bottom
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Account" })).toHaveCount(0);
    await expect(nav.getByText("Sign out")).toBeVisible();
    await page.keyboard.press("Escape");

    await avatar.click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/sign-in/);
  });
});
