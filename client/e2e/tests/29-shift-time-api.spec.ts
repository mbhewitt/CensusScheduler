import { test, expect, request, type APIRequestContext } from "@playwright/test";
import type { RowDataPacket } from "mysql2";

import {
  cleanupAllTestData,
  closePool,
  getPool,
  insertFullShift,
  insertVolunteer,
} from "../helpers/db";
import { buildSessionCookieHeader } from "../helpers/session";
import { FUTURE_SHIFT, makeTestVolunteer } from "../fixtures/test-data";

// Mew 2026-11-28: Pumpkin creates and modifies shifts through
// POST /api/shifts/types/{typeId}/times and PATCH …/times/{timeId}.
const MEETING = {
  ...FUTURE_SHIFT,
  categoryId: 9_000_430,
  categoryName: "E2E API Meeting Category",
  shiftNameId: 9_000_431,
  shiftName: "E2E API Meeting",
  shiftTimesId: 9_000_432,
  positionTypeId: 9_000_433,
  positionName: "E2E API Attendee",
  timePositionId: 9_000_434,
  offPlaya: true,
};
const volunteer = makeTestVolunteer({
  shiftboardId: 9_000_435,
  playaName: "E2E NotSuper",
  worldName: "Not Super",
  email: "e2e-not-super@test.local",
  passcode: "4350",
});
const DATE = "2099-01-07";
const SUPERADMIN_ID = 1; // reference seed: roles SuperAdmin + Admin

const asUser = (baseURL: string, shiftboardId: number) =>
  request.newContext({
    baseURL,
    extraHTTPHeaders: { cookie: buildSessionCookieHeader(shiftboardId) },
  });
const send = (
  ctx: APIRequestContext,
  method: "POST" | "PATCH",
  path: string,
  body: object
) => ctx.fetch(path, { method, data: JSON.stringify(body) });

const cleanupCreated = async () => {
  const db = getPool();
  const [times] = await db.query<RowDataPacket[]>(
    "SELECT shift_times_id FROM op_shift_times WHERE shift_name_id = ?",
    [MEETING.shiftNameId]
  );
  for (const { shift_times_id: id } of times) {
    await db.execute("DELETE FROM op_shift_time_position WHERE shift_times_id = ?", [id]);
    await db.execute("DELETE FROM op_shift_times WHERE shift_times_id = ?", [id]);
  }
  await db.execute("DELETE FROM op_dates WHERE date = ? AND datename = ?", [DATE, DATE]);
};

test.describe("Single shift-time API (Pumpkin)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await cleanupCreated();
    await insertFullShift(MEETING);
    await insertVolunteer(volunteer);
  });

  test.afterAll(async () => {
    await cleanupCreated();
    await cleanupAllTestData();
    await closePool();
  });

  test("SuperAdmin adds a time (positions copied), edits it, cancels it", async ({
    baseURL,
  }) => {
    const ctx = await asUser(baseURL!, SUPERADMIN_ID);
    const path = `/api/shifts/types/${MEETING.shiftNameId}/times`;

    const add = await send(ctx, "POST", path, {
      date: DATE,
      startTime: "17:00",
      endTime: "18:00",
      notes: "E2E meeting",
    });
    expect(add.status()).toBe(201);
    const { timeId, positionList } = await add.json();
    expect(positionList).toEqual([
      { positionId: MEETING.positionTypeId, timePositionId: expect.any(Number) },
    ]);

    const all = await (await ctx.get("/api/shifts?filter=all")).json();
    expect(all.find((s: { id: number }) => s.id === timeId)).toMatchObject({
      isOffPlaya: true,
      startTime: `${DATE} 17:00`,
    });

    // the same time again is a conflict, not a duplicate row
    expect(
      (await send(ctx, "POST", path, { date: DATE, startTime: "17:00", endTime: "18:00" })).status()
    ).toBe(409);
    expect(
      (await send(ctx, "POST", path, { date: DATE, startTime: "18:00", endTime: "17:00" })).status()
    ).toBe(400);

    const patch = await send(ctx, "PATCH", `${path}/${timeId}`, {
      startTime: "17:30",
      canceled: true,
      positionList: [{ timePositionId: positionList[0].timePositionId, slots: 5 }],
    });
    expect(patch.status()).toBe(200);
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT st.canceled, st.start_time, st.start_time_text, stp.slots
       FROM op_shift_times st
       JOIN op_shift_time_position stp ON stp.shift_times_id = st.shift_times_id
       WHERE st.shift_times_id = ?`,
      [timeId]
    );
    expect(rows[0]).toMatchObject({
      canceled: 1,
      start_time: `${DATE} 17:30`,
      start_time_text: "17:30",
      slots: 5,
    });
    await ctx.dispose();
  });

  test("non-SuperAdmin is refused", async ({ baseURL }) => {
    const ctx = await asUser(baseURL!, volunteer.shiftboardId);
    const path = `/api/shifts/types/${MEETING.shiftNameId}/times`;
    expect(
      (await send(ctx, "POST", path, { date: DATE, startTime: "09:00", endTime: "10:00" })).status()
    ).toBe(403);
    expect(
      (await send(ctx, "PATCH", `${path}/${MEETING.shiftTimesId}`, { canceled: true })).status()
    ).toBe(403);
    await ctx.dispose();
  });
});
