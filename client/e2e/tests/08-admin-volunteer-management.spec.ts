import { test, expect } from "@playwright/test";
import {
  insertVolunteer,
  insertFullShift,
  insertVolunteerShift,
  assignRole,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  CURRENT_SHIFT,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  makeTestVolunteer,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

const managedVolunteer = makeTestVolunteer({
  shiftboardId: IDS.adminMgmtVolunteer,
  playaName: "E2E Managed",
  worldName: "Managed Tester",
  email: "e2e-managed@test.local",
  passcode: "5555",
});

test.describe("Admin Volunteer Management", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertVolunteer(managedVolunteer);
    await assignRole(managedVolunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
    await insertFullShift(CURRENT_SHIFT);
    await insertVolunteerShift(
      managedVolunteer.shiftboardId,
      CURRENT_SHIFT.timePositionId,
      ""
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("admin should see volunteer list page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    // The volunteer list renders a mui-datatables grid. Assert against a
    // stable column header from the current component (Volunteers.tsx) rather
    // than a bare `table` match — on desktop, resizableColumns renders an
    // extra hidden helper `<table>` that `.first()` can grab and that never
    // becomes visible.
    await expect(
      page.getByRole("columnheader", { name: /Playa name/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin should see test volunteer in the list", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    await expect(
      page.getByText("E2E Managed")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin should navigate to volunteer account page", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    // /account is a legacy URL that server-side redirects to the canonical
    // /info page (per @mbhewitt 2026-05-23). The info page shows the
    // volunteer's playa/world name as read-only text, not editable fields.
    await page.goto(
      `/volunteers/${managedVolunteer.shiftboardId}/account`
    );
    await page.waitForURL(
      new RegExp(`/volunteers/${managedVolunteer.shiftboardId}/info`),
      { timeout: 10_000 }
    );

    await expect(page.getByText("E2E Managed").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Managed Tester").first()).toBeVisible();
  });

  test("admin should see volunteer shift counts", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto("/volunteers");

    const row = page
      .getByRole("row")
      .filter({ hasText: "E2E Managed" });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  });

  test("non-admin should not access volunteer management", async ({
    page,
  }) => {
    await signInAs(page, managedVolunteer);

    await page.goto("/volunteers");

    // A logged-in non-admin keeps the URL but AuthGate renders a
    // permission-denied fallback instead of the volunteer list/table.
    await expect(
      page.getByText(/have permission to view this page/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("table")).toHaveCount(0);
  });
});
