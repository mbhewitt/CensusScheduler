import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

// shift volunteer add
export const shiftVolunteerAdd = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { noShow, shiftboardId, shiftPositionId, shiftTimesId } = JSON.parse(
    req.body
  );
  const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
    `SELECT *
    FROM op_volunteer_shifts
    WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
    [shiftPositionId, shiftTimesId, shiftboardId]
  );
  const dbShiftVolunteerFirst = dbShiftVolunteerList[0];

  // if volunteer exists in shift already
  // then update add_shift and remove_shift fields
  if (dbShiftVolunteerFirst) {
    await pool.query<RowDataPacket[]>(
      `UPDATE op_volunteer_shifts
      SET noshow=?, add_shift=true, remove_shift=false
      WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
      [noShow, shiftPositionId, shiftTimesId, shiftboardId]
    );
  } else {
    // else insert them into the table
    await pool.query<RowDataPacket[]>(
      `INSERT INTO op_volunteer_shifts (add_shift, noshow, shift_position_id, shift_times_id, shiftboard_id)
      VALUES (true, ?, ?, ?, ?)`,
      [noShow, shiftPositionId, shiftTimesId, shiftboardId]
    );
  }

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
// shift volunteer check-in
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
    WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
    [checked ? "" : "Yes", shiftPositionId, shiftTimesId, shiftboardId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
// shift volunteer remove
export const shiftVolunteerRemove = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { shiftboardId, shiftPositionId, shiftTimesId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET add_shift=false, remove_shift=true
    WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
    [shiftPositionId, shiftTimesId, shiftboardId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
