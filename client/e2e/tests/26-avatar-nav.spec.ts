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

test.describe("Avatar menu + trimmed drawer (#814, #631)", () => {
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

  test("signed out: Sign in button, Home + Shifts in drawer", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation");
    for (const name of [
      "Home",
      "Shifts",
      "Training",
      "Reports",
      "Help",
      "Contact",
    ]) {
      await expect(nav.getByRole("link", { name })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Account" })).toHaveCount(0);
  });

  test("signed in: avatar menu, trimmed drawer, banner on Account", async ({
    page,
  }) => {
    await signInAs(page, volunteer);

    // banner moved from Home to the Account page
    await expect(
      page.getByText(/shifts will be released in June/)
    ).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(
      page.getByRole("menuitem", { name: "My account" })
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "My shifts" })
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Sign out" })
    ).toBeVisible();
    await page.getByRole("menuitem", { name: "My shifts" }).click();
    await page.waitForURL(/\/volunteers\/\d+\/schedule/);

    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Training" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Account" })).toHaveCount(0);
    await expect(nav.getByText("Sign out")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.goto("/");
    await expect(page.getByText(/shifts will be released in June/)).toHaveCount(
      0
    );

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/sign-in/);
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
