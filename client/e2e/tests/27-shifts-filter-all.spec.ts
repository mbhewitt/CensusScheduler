import { test, expect } from "@playwright/test";

import { cleanupAllTestData, closePool, insertFullShift } from "../helpers/db";
import { FUTURE_SHIFT } from "../fixtures/test-data";

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

test.describe("GET /api/shifts?filter=all (C-914)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertFullShift(FUTURE_SHIFT);
    await insertFullShift(MEETING);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("filter=all includes off-playa shifts; the plain call does not", async ({
    request,
  }) => {
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
});
