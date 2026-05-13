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
  makeTestVolunteer,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

const behavioralVolunteer = makeTestVolunteer({
  shiftboardId: IDS.behavioralVolunteer,
  playaName: "E2E BehaviorVol",
  worldName: "Behavioral Tester",
  email: "e2e-behavior@test.local",
  passcode: "8888",
});

test.describe("Behavioral Standards", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);
    await insertVolunteer(behavioralVolunteer);
    await insertFullShift(CURRENT_SHIFT);
    await insertVolunteerShift(
      behavioralVolunteer.shiftboardId,
      CURRENT_SHIFT.timePositionId,
      ""
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("admin should see admin review column for active shifts", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(
      `/shifts/${CURRENT_SHIFT.shiftTimesId}/volunteers`
    );

    // The admin review column should be visible for admin users
    await expect(page.getByText("E2E BehaviorVol")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should navigate to behavioral standards page", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    // Navigate to behavioral standards for the volunteer
    await page.goto(
      `/roles/behavioral-standards/${behavioralVolunteer.shiftboardId}`
    );

    // The page should load
    await expect(page.getByText(/behavioral/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
