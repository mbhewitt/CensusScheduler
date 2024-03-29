import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

// patch - shift volunteer check-in
export const shiftVolunteerCheckIn = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { checked, shiftboardId, shiftPositionId, shiftTimesId } = JSON.parse(
    req.body
  );

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET noshow=?, update_shift=true
    WHERE shift_position_id=?
    AND shift_times_id=?
    AND shiftboard_id=?`,
    [checked ? "" : "Yes", shiftPositionId, shiftTimesId, shiftboardId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
// delete - shift volunteer remove
export const shiftVolunteerRemove = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { shiftboardId, shiftPositionId, shiftTimesId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET add_shift=false, remove_shift=true
    WHERE shift_position_id=?
    AND shift_times_id=?
    AND shiftboard_id=?`,
    [shiftPositionId, shiftTimesId, shiftboardId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
