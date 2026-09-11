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
  ADMIN_VOLUNTEER,
  SHIFT_VOLUNTEER,
  FUTURE_SHIFT,
  ROLE_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

// Regression for the 2026-09-02 Data Entry Lead report (issue #749): a lead
// couldn't enter review comments on the tablet, so they ended up on paper. Root
// cause — the review/comment control was wrapped in `isCheckInAvailable &&`, so
// it was hidden whenever the check-in window was closed (after the shift, or
// when the clock was stale/frozen, #739). Reviews must be available to
// admins/leads AT ANY TIME, independent of the check-in clock. This test uses a
// FUTURE shift, where the check-in switch is intentionally NOT rendered, and
// asserts the review control still is — and that a comment saves end-to-end.
test.describe("Shift review (comments)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();

    await insertVolunteer(SHIFT_VOLUNTEER);
    await assignRole(SHIFT_VOLUNTEER.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);

    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);

    await insertFullShift(FUTURE_SHIFT);
    await insertVolunteerShift(
      SHIFT_VOLUNTEER.shiftboardId,
      FUTURE_SHIFT.timePositionId,
      "X"
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("admin can review a volunteer even when check-in is unavailable (future shift)", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(`/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers`);

    await expect(page.getByText("E2E Shifty")).toBeVisible({
      timeout: 15_000,
    });

    const row = page.getByRole("row").filter({ hasText: "E2E Shifty" });

    // Sanity: this is a FUTURE shift, so the check-in switch is NOT rendered
    // (mirrors 04-check-in "check-in should be unavailable for future shifts").
    await expect(row.getByRole("switch")).toHaveCount(0);

    // The regression: the review control must still be present even though
    // check-in isn't. It was previously hidden alongside the check-in switch.
    const reviewButton = row.locator('button:has([data-testid="ChatIcon"])');
    await expect(reviewButton).toBeVisible({ timeout: 10_000 });
    await reviewButton.click();

    // The review dialog opens.
    await expect(page.getByText("Update review")).toBeVisible({
      timeout: 10_000,
    });

    // Enter a comment and save it.
    await page
      .getByLabel("Notes")
      .fill("E2E regression: comment entered outside the check-in window");
    await page.getByRole("button", { name: "Update review" }).click();

    // Success snackbar confirms the review was saved server-side.
    await expect(page.getByText(/has been updated/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
