import { test, expect } from "@playwright/test";

import {
  assignRole,
  cleanupAllTestData,
  closePool,
  insertFullShift,
  insertVolunteer,
} from "../helpers/db";
import { buildSessionCookieValue } from "../helpers/session";
import {
  FUTURE_SHIFT,
  makeTestVolunteer,
  ROLE_BEHAVIORAL_STANDARDS_ID,
} from "../fixtures/test-data";

// C-914: GET /api/shifts?filter=all also returns off-playa shift types
// (meetings), flagged isOffPlaya; the plain call stays playa-only.
const MEETING = {
  ...FUTURE_SHIFT,
  categoryId: 9_000_400,
  categoryName: "E2E Meeting Category",
  shiftNameId: 9_000_401,
  shiftName: "E2E Off-playa Meeting",
  shiftTimesId: 9_000_402,
  positionTypeId: 9_000_403,
  positionName: "E2E Meeting Attendee",
  timePositionId: 9_000_404,
  offPlaya: true,
};

const volunteer = makeTestVolunteer({
  shiftboardId: 9_000_405,
  playaName: "E2E MeetingViewer",
  worldName: "Meeting Viewer",
  email: "e2e-meeting-viewer@test.local",
  passcode: "4050",
});

test.describe("GET /api/shifts?filter=all (C-914)", () => {
  // the web build only serves /shifts and /api/shifts to signed-in people
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
      {
        name: "census-session",
        value: buildSessionCookieValue(volunteer.shiftboardId),
        url: baseURL!,
      },
    ]);
  });

  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertFullShift(FUTURE_SHIFT);
    await insertFullShift(MEETING);
    await insertVolunteer(volunteer);
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("filter=all includes off-playa shifts; the plain call does not", async ({
    page,
  }) => {
    const { request } = page;
    const plain = await (await request.get("/api/shifts")).json();
    const all = await (await request.get("/api/shifts?filter=all")).json();
    const find = (list: { id: number }[], id: number) =>
      list.find((row) => row.id === id);

    expect(find(plain, MEETING.shiftTimesId)).toBeUndefined();
    expect(find(plain, FUTURE_SHIFT.shiftTimesId)).toBeTruthy();
    expect(find(all, MEETING.shiftTimesId)).toMatchObject({
      isOffPlaya: true,
    });
    expect(find(all, FUTURE_SHIFT.shiftTimesId)).toMatchObject({
      isOffPlaya: false,
    });
  });

  // Mew 2026-11-28 "a": the web app's Shifts page lists meetings so people can
  // sign up; tablets (the default e2e build) stay playa-only. Run with
  // NEXT_PUBLIC_PIN_ENABLED=false to check the web side.
  test("Shifts page: meetings on the web app, not on tablets", async ({
    page,
  }) => {
    const isTabletBuild = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";
    await page.goto("/shifts");
    await expect(page.getByText("E2E Future Shift").first()).toBeVisible({
      timeout: 10_000,
    });
    const meeting = page.getByText("E2E Off-playa Meeting");
    if (isTabletBuild) await expect(meeting).toHaveCount(0);
    else await expect(meeting.first()).toBeVisible();
  });
});
