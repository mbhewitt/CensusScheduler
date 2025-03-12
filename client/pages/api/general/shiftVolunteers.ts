import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqSwitchValues } from "@/components/types";

// patch - shift volunteer check-in
export const shiftVolunteerCheckIn = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { isCheckedIn, shiftboardId, timePositionId }: IReqSwitchValues =
    JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET
      noshow=?,
      update_shift=true
    WHERE shiftboard_id=?
    AND time_position_id=?`,
    [isCheckedIn ? "" : "Yes", shiftboardId, timePositionId]
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
  const { shiftboardId, timePositionId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET
      add_shift=false,
      remove_shift=true
    WHERE shiftboard_id=?
    AND time_position_id=?`,
    [shiftboardId, timePositionId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
