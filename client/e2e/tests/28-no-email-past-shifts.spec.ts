import { test, expect } from "@playwright/test";
import type { RowDataPacket } from "mysql2";

import {
  assignRole,
  cleanupAllTestData,
  closePool,
  getPool,
  insertFullShift,
  insertVolunteer,
} from "../helpers/db";
import {
  FUTURE_SHIFT,
  makeTestVolunteer,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";

// #768 (Mew 2026-10-01): adding someone to a shift whose date has passed
// (recording meeting attendance after the fact) emails nobody.
const volunteer = makeTestVolunteer({
  shiftboardId: 9_000_410,
  playaName: "E2E PastShift",
  worldName: "Past Tester",
  email: "e2e-past-shift@test.local",
  passcode: "4100",
});
const PAST_DATE_ID = 9_000_425;
const PAST_SHIFT = {
  ...FUTURE_SHIFT,
  categoryId: 9_000_420,
  shiftNameId: 9_000_421,
  shiftName: "E2E Past Meeting",
  shiftTimesId: 9_000_422,
  positionTypeId: 9_000_423,
  timePositionId: 9_000_424,
  startTime: "2001-01-01 10:00",
  endTime: "2001-01-01 11:00",
};

const assignmentEmails = async () => {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM op_email_queue WHERE category = 'assignment' AND `to` = ?",
    [volunteer.email]
  );
  return Number(rows[0].n);
};

test.describe("No emails for past shifts (#768)", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    const db = getPool();
    await db.execute("DELETE FROM op_email_queue WHERE `to` = ?", [
      volunteer.email,
    ]);
    await db.execute("DELETE FROM op_dates WHERE date_id = ?", [PAST_DATE_ID]);
    await insertVolunteer(volunteer);
    await assignRole(volunteer.shiftboardId, ROLE_BEHAVIORAL_STANDARDS_ID);
    await insertFullShift(FUTURE_SHIFT);
    await insertFullShift(PAST_SHIFT);
    await db.execute(
      "INSERT INTO op_dates (date_id, date, datename) VALUES (?, '2001-01-01', 'E2E Past')",
      [PAST_DATE_ID]
    );
    await db.execute(
      "UPDATE op_shift_times SET start_date_id = ?, end_date_id = ? WHERE shift_times_id = ?",
      [PAST_DATE_ID, PAST_DATE_ID, PAST_SHIFT.shiftTimesId]
    );
  });

  test.afterAll(async () => {
    const db = getPool();
    await db.execute("DELETE FROM op_email_queue WHERE `to` = ?", [
      volunteer.email,
    ]);
    await cleanupAllTestData();
    await db.execute("DELETE FROM op_dates WHERE date_id = ?", [PAST_DATE_ID]);
    await closePool();
  });

  test("past shift: no assignment email; future shift: one", async ({
    page,
  }) => {
    await signInAsBuiltinAdmin(page);
    const add = (shift: typeof FUTURE_SHIFT) =>
      page.request.post(`/api/shifts/${shift.shiftTimesId}/volunteers`, {
        data: JSON.stringify({
          shiftboardId: volunteer.shiftboardId,
          timePositionId: shift.timePositionId,
        }),
      });

    expect((await add(PAST_SHIFT)).status()).toBe(201);
    expect(await assignmentEmails()).toBe(0);

    // control: the same add on a current shift does email
    expect((await add(FUTURE_SHIFT)).status()).toBe(201);
    await expect.poll(assignmentEmails).toBe(1);
  });
});
