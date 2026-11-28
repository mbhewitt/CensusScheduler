import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { notifyCancelFlip } from "@/components/api/assignmentNotify";
import { ensureDateId, isDate, isDupEntry, isTime } from "@/lib/shiftTimes";
import { withWriteGuard } from "@/lib/withWriteGuard";
import { pool } from "lib/database";

// PATCH /api/shifts/types/{typeId}/times/{timeId} — change ONE shift time
// (Mew 2026-11-28: Pumpkin modifies shifts). Every field is optional:
// { date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm", notes,
//   canceled, dateName, positionList: [{ timePositionId, slots?, sapPoints? }] }
// Canceling or restoring emails the volunteers on it (notifyCancelFlip), the
// same as the Shift Types form. Like the form, a date/time change sends no email.
const updateShiftTime = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "PATCH") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const typeId = Number(req.query.typeId);
  const timeId = Number(req.query.timeId);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
  }
  const { canceled, date, dateName, endTime, notes, positionList, startTime } =
    body;
  const positionsOk =
    positionList === undefined ||
    (Array.isArray(positionList) &&
      positionList.every(
        (p) =>
          Number.isInteger(p?.timePositionId) &&
          (p.slots === undefined ||
            (Number.isInteger(p.slots) && p.slots >= 1 && p.slots <= 1000)) &&
          (p.sapPoints === undefined ||
            (Number.isInteger(p.sapPoints) &&
              p.sapPoints >= 0 &&
              p.sapPoints <= 100))
      ));
  if (
    !Number.isInteger(typeId) ||
    !Number.isInteger(timeId) ||
    (date !== undefined && !isDate(date)) ||
    (startTime !== undefined && !isTime(startTime)) ||
    (endTime !== undefined && !isTime(endTime)) ||
    (notes !== undefined &&
      (typeof notes !== "string" || notes.length > 2000)) ||
    (canceled !== undefined && typeof canceled !== "boolean") ||
    (dateName !== undefined &&
      (typeof dateName !== "string" || dateName.length > 64)) ||
    !positionsOk
  ) {
    return res.status(400).json({ statusCode: 400, message: "Bad fields." });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT start_time, end_time, canceled, notes
     FROM op_shift_times
     WHERE shift_times_id = ? AND shift_name_id = ? AND remove_shift_time = false`,
    [timeId, typeId]
  );
  const current = rows[0];
  if (!current) {
    return res
      .status(404)
      .json({ statusCode: 404, message: "Unknown shift time." });
  }
  // start_time / end_time hold "YYYY-MM-DD HH:mm"
  const [curDate, curStart] = String(current.start_time).split(" ");
  const curEnd = String(current.end_time).split(" ")[1];
  const newDate = (date as string | undefined) ?? curDate;
  const newStart = ((startTime as string | undefined) ?? curStart).slice(0, 5);
  const newEnd = ((endTime as string | undefined) ?? curEnd).slice(0, 5);
  if (!isDate(newDate) || !isTime(newStart) || !isTime(newEnd)) {
    return res.status(409).json({
      statusCode: 409,
      message:
        "This shift time's stored date/time can't be parsed; edit it in the Shift Types form.",
    });
  }
  if (newEnd <= newStart) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "End must be after start." });
  }

  try {
    await ensureDateId(newDate, dateName as string | undefined);
  } catch (err) {
    if (isDupEntry(err)) {
      return res.status(409).json({
        statusCode: 409,
        message: "dateName is taken by another date.",
      });
    }
    throw err;
  }
  const isCanceled =
    canceled === undefined ? Boolean(current.canceled) : canceled;
  const startValue = `${newDate} ${newStart}`;
  const endValue = `${newDate} ${newEnd}`;
  await pool.query(
    `UPDATE op_shift_times
     SET
       canceled = ?,
       end_date_id = (SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
       end_time = ?,
       end_time_text = ?,
       notes = ?,
       start_date_id = (SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
       start_time = ?,
       start_time_text = ?,
       update_shift_time = true
     WHERE shift_times_id = ?`,
    [
      isCanceled,
      endValue,
      endValue,
      newEnd,
      (notes as string | undefined) ?? current.notes ?? "",
      startValue,
      startValue,
      newStart,
      timeId,
    ]
  );
  for (const p of (positionList ?? []) as {
    sapPoints?: number;
    slots?: number;
    timePositionId: number;
  }[]) {
    await pool.query(
      `UPDATE op_shift_time_position
       SET
         sap_points = COALESCE(?, sap_points),
         slots = COALESCE(?, slots),
         update_time_position = true
       WHERE time_position_id = ? AND shift_times_id = ?`,
      [p.sapPoints ?? null, p.slots ?? null, p.timePositionId, timeId]
    );
  }
  if (isCanceled !== Boolean(current.canceled)) {
    await notifyCancelFlip(pool, timeId, isCanceled);
  }

  return res.status(200).json({ statusCode: 200, message: "OK" });
};

// ponytail: same level as the Shift Types form (SuperAdmin); see times/index.ts.
export default withWriteGuard(updateShiftTime, "superadmin");
