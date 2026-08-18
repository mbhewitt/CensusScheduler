import { test, expect } from "@playwright/test";

import {
  assignRole,
  cleanupAllTestData,
  closePool,
  countQueuedOfflineLinks,
  deleteOfflineLinkEmails,
  insertVolunteer,
} from "../helpers/db";
import {
  makeTestVolunteer,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAs,
} from "../fixtures/test-data";

// #643 (folds in #630): on the offline on-playa build, external links become
// an "email this to me" action instead of a dead link. The dev server used by
// these tests runs with NEXT_PUBLIC_PIN_ENABLED="true" (see
// playwright.config.ts), i.e. the on-playa build — so OfflineLink renders its
// button + dialog rather than a plain <a>.

const volunteer = makeTestVolunteer({
  shiftboardId: 9_000_050,
  playaName: "E2E OfflineLink",
  worldName: "Link Tester",
  email: "e2e-offline-link@test.local",
  passcode: "5050",
});

test.describe("Offline link (email this to me)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await deleteOfflineLinkEmails(volunteer.email);
    await insertVolunteer(volunteer);
    // On-playa mode force-redirects volunteers who haven't signed behavioral
    // standards to the BS page, which would hide the /info GetInvolved links.
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await deleteOfflineLinkEmails(volunteer.email);
    await cleanupAllTestData();
    await closePool();
  });

  test("clicking an OfflineLink opens the offline popup", async ({ page }) => {
    await page.goto("/");

    // The Hive "Learn More" link renders as a button on the on-playa build.
    await page
      .getByRole("button", {
        name: /Black Rock City Census Community on Hive/i,
      })
      .first()
      .click();

    // #630: the popup must explain the tablets have no internet.
    await expect(
      page.getByText("These tablets have no internet")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Email this link to me/i })
    ).toBeVisible();
  });

  test("confirming queues an email for the signed-in volunteer", async ({
    page,
  }) => {
    await signInAs(page, volunteer);

    // GetInvolved sidebar on the account/info page carries the Hive link.
    await page.goto(`/volunteers/${volunteer.shiftboardId}/info`);

    await page
      .getByRole("button", { name: /Census Community on Hive/i })
      .first()
      .click();

    await expect(
      page.getByText("These tablets have no internet")
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Email this link to me/i })
      .click();

    // Success snackbar.
    await expect(page.getByText(/We'll email you/i)).toBeVisible();

    // The row landed in op_email_queue for this volunteer.
    await expect
      .poll(() => countQueuedOfflineLinks(volunteer.email), {
        timeout: 5_000,
      })
      .toBeGreaterThan(0);
  });
});
