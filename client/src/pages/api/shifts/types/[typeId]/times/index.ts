import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqShiftTypeTimePositionItem } from "@/components/types/shifts/types";
import { ensureDateId, isDate, isDupEntry, isTime } from "@/lib/shiftTimes";
import { withWriteGuard } from "@/lib/withWriteGuard";
import { handleTimeListAdd } from "@/pages/api/shifts/types";
import { pool } from "lib/database";

// POST /api/shifts/types/{typeId}/times — add ONE time to a shift type (Mew
// 2026-11-28: Pumpkin creates shifts). The form save sends the whole type with
// every time, which a bot shouldn't build; this takes just the new time.
//
// Body: { date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
//         notes?, dateName?, positionList?: [{ positionId, slots, sapPoints, alias? }] }
// The date row is created if missing. Without positionList, the positions
// (slots, CSP) are copied from the type's latest time. Returns the new
// timeId and its positions, so a follow-up add-volunteer can target one.
const addShiftTime = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const typeId = Number(req.query.typeId);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
  }
  const { date, dateName, endTime, notes = "", positionList, startTime } = body;
  if (
    !Number.isInteger(typeId) ||
    typeId <= 0 ||
    !isDate(date) ||
    !isTime(startTime) ||
    !isTime(endTime) ||
    endTime <= startTime ||
    typeof notes !== "string" ||
    notes.length > 2000 ||
    (dateName !== undefined &&
      (typeof dateName !== "string" || dateName.length > 64))
  ) {
    return res.status(400).json({
      statusCode: 400,
      message:
        "Need date YYYY-MM-DD and startTime/endTime HH:mm, end after start, same day.",
    });
  }

  const [types] = await pool.query<RowDataPacket[]>(
    "SELECT shift_name FROM op_shift_name WHERE shift_name_id = ? AND delete_shift = false",
    [typeId]
  );
  if (!types[0]) {
    return res
      .status(404)
      .json({ statusCode: 404, message: "Unknown shift type." });
  }

  let positions: IReqShiftTypeTimePositionItem[];
  if (positionList === undefined) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT position_type_id, position_alias, slots, sap_points
       FROM op_shift_time_position
       WHERE remove_time_position = false
         AND shift_times_id = (
           SELECT shift_times_id FROM op_shift_times
           WHERE shift_name_id = ? AND remove_shift_time = false
           ORDER BY start_time DESC LIMIT 1)`,
      [typeId]
    );
    positions = rows.map((r) => ({
      alias: r.position_alias ?? "",
      name: "",
      positionId: r.position_type_id,
      sapPoints: r.sap_points,
      slots: r.slots,
      timePositionId: 0,
    }));
  } else {
    const ok =
      Array.isArray(positionList) &&
      positionList.every(
        (p) =>
          Number.isInteger(p?.positionId) &&
          p.positionId > 0 &&
          Number.isInteger(p.slots) &&
          p.slots >= 1 &&
          p.slots <= 1000 &&
          Number.isInteger(p.sapPoints) &&
          p.sapPoints >= 0 &&
          p.sapPoints <= 100 &&
          (p.alias === undefined ||
            (typeof p.alias === "string" && p.alias.length <= 64))
      );
    if (!ok) {
      return res.status(400).json({
        statusCode: 400,
        message:
          "positionList items need positionId, slots (1–1000), sapPoints (0–100), optional alias.",
      });
    }
    const ids = positionList.map((p) => p.positionId);
    const [known] = await pool.query<RowDataPacket[]>(
      "SELECT position_type_id FROM op_position_type WHERE delete_position = false AND position_type_id IN (?)",
      [ids]
    );
    if (known.length !== new Set(ids).size) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Unknown position." });
    }
    positions = positionList.map((p) => ({
      alias: p.alias ?? "",
      name: "",
      positionId: p.positionId,
      sapPoints: p.sapPoints,
      slots: p.slots,
      timePositionId: 0,
    }));
  }
  if (positions.length === 0) {
    return res.status(400).json({
      statusCode: 400,
      message: "This shift type has no positions to copy; pass positionList.",
    });
  }

  let timeId: number;
  try {
    await ensureDateId(date, dateName as string | undefined);
    [timeId] = await handleTimeListAdd({
      timeList: [
        {
          canceled: false,
          endTime: `${date} ${endTime}`,
          // shift_instance is UNIQUE; name it like the meeting backfills did
          instance: `${types[0].shift_name} ${date} ${startTime}`.slice(0, 64),
          meal: "",
          notes,
          positionList: positions,
          startTime: `${date} ${startTime}`,
          timeId: 0,
        },
      ],
      typeId,
    });
  } catch (err) {
    if (isDupEntry(err)) {
      return res.status(409).json({
        statusCode: 409,
        message:
          "That shift time already exists, or dateName is taken by another date.",
      });
    }
    throw err;
  }

  const [created] = await pool.query<RowDataPacket[]>(
    "SELECT time_position_id, position_type_id FROM op_shift_time_position WHERE shift_times_id = ?",
    [timeId]
  );
  return res.status(201).json({
    statusCode: 201,
    timeId,
    positionList: created.map((r) => ({
      positionId: r.position_type_id,
      timePositionId: r.time_position_id,
    })),
  });
};

// ponytail: same level as the Shift Types form (SuperAdmin); "admin" here
// would let every Admin create shifts — Mew's call.
export default withWriteGuard(addShiftTime, "superadmin");
