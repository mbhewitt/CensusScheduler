import { test, expect, type APIRequestContext } from "@playwright/test";

import {
  cleanupAllTestData,
  closePool,
  getPool,
  insertFullShift,
  insertVolunteer,
} from "../helpers/db";
import { buildSessionCookieHeader } from "../helpers/session";
import { FUTURE_SHIFT, makeTestVolunteer } from "../fixtures/test-data";

// #869: shifts on/after a release row's embargo_from are hidden from
// non-admins and refused for sign-up until release_at; admins see them
// flagged; off-playa meetings are exempt.
const MEETING = {
  ...FUTURE_SHIFT,
  categoryId: 9_000_500,
  categoryName: "E2E Release Meeting Category",
  shiftNameId: 9_000_501,
  shiftName: "E2E Release Meeting",
  shiftTimesId: 9_000_502,
  positionTypeId: 9_000_503,
  positionName: "E2E Release Attendee",
  timePositionId: 9_000_504,
  offPlaya: true,
};
const volunteer = makeTestVolunteer({
  shiftboardId: 9_000_505,
  playaName: "E2E ReleaseViewer",
  worldName: "Release Viewer",
  email: "e2e-release-viewer@test.local",
  passcode: "5050",
});
const ADMIN = 1; // builtin SuperAdmin
const shiftDate = FUTURE_SHIFT.startTime.slice(0, 10);

const as = (id: number) => ({ cookie: buildSessionCookieHeader(id) });
const shifts = async (request: APIRequestContext, id: number) =>
  (await (
    await request.get("/api/shifts?filter=all", { headers: as(id) })
  ).json()) as { id: number; embargoedUntil: string | null }[];
const setRelease = async (releaseAt: string) => {
  await getPool().execute("DELETE FROM op_shift_release");
  await getPool().execute(
    "INSERT INTO op_shift_release (embargo_from, release_at, announced_at) VALUES (?, ?, NOW())",
    [shiftDate, releaseAt]
  );
};

test.describe("shift release embargo (#869)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertFullShift(FUTURE_SHIFT);
    await insertFullShift(MEETING);
    await insertVolunteer(volunteer);
  });

  test.afterAll(async () => {
    await getPool().execute("DELETE FROM op_shift_release");
    await cleanupAllTestData();
    await closePool();
  });

  test("before release: hidden from volunteers, flagged for admins, sign-up refused", async ({
    request,
  }) => {
    await setRelease("2099-12-31 09:00:00");
    const mine = await shifts(request, volunteer.shiftboardId);
    expect(mine.find((s) => s.id === FUTURE_SHIFT.shiftTimesId)).toBeUndefined();
    expect(mine.find((s) => s.id === MEETING.shiftTimesId)).toBeTruthy();

    const admins = await shifts(request, ADMIN);
    expect(
      admins.find((s) => s.id === FUTURE_SHIFT.shiftTimesId)?.embargoedUntil
    ).toMatch(/^2099-12-31 09:00/);

    const pre = await request.post(
      `/api/shifts/${FUTURE_SHIFT.shiftTimesId}/volunteers/preflight`,
      {
        headers: as(volunteer.shiftboardId),
        data: JSON.stringify({
          shiftboardId: volunteer.shiftboardId,
          timePositionId: FUTURE_SHIFT.timePositionId,
        }),
      }
    );
    const { blockers } = await pre.json();
    expect(blockers.map((b: { code: string }) => b.code)).toContain(
      "embargoed"
    );
  });

  test("after release: visible to volunteers", async ({ request }) => {
    await setRelease("2001-01-01 09:00:00");
    const mine = await shifts(request, volunteer.shiftboardId);
    expect(
      mine.find((s) => s.id === FUTURE_SHIFT.shiftTimesId)?.embargoedUntil
    ).toBeNull();
  });

  test("only SuperAdmins add releases", async ({ request }) => {
    const data = JSON.stringify({
      embargoFrom: "2099-01-01",
      releaseAt: "2099-06-01T09:00",
    });
    expect(
      (
        await request.post("/api/shift-release", {
          headers: as(volunteer.shiftboardId),
          data,
        })
      ).status()
    ).toBe(403);
    expect(
      (await request.post("/api/shift-release", { headers: as(ADMIN), data }))
        .status()
    ).toBe(201);
  });
});
