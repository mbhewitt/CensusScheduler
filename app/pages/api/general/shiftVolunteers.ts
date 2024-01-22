import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

// shift volunteer add
export const shiftVolunteerAdd = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { noShow, shiftboardId, shiftPositionId } = JSON.parse(req.body);
  const [shiftVolunteer] = await pool.query<RowDataPacket[]>(
    `SELECT EXISTS (
      SELECT *
      FROM op_volunteer_shifts
      WHERE shift_position_id=? AND shiftboard_id=?
    )`,
    [shiftPositionId, shiftboardId]
  );

  // if volunteer exists in shift already
  // then update add_shift and delete_shift fields
  if (Object.values(shiftVolunteer[0])[0]) {
    await pool.query<RowDataPacket[]>(
      `UPDATE op_volunteer_shifts
      SET noshow=?, add_shift=true, delete_shift=false
      WHERE shift_position_id=? AND shiftboard_id=?`,
      [noShow, shiftPositionId, shiftboardId]
    );
  } else {
    // else insert them into the table
    await pool.query<RowDataPacket[]>(
      `INSERT INTO op_volunteer_shifts (shift_position_id, shiftboard_id, noshow, add_shift)
      VALUES (?, ?, ?, 1)`,
      [shiftPositionId, shiftboardId, noShow]
    );
  }

  await pool.query<RowDataPacket[]>(
    `UPDATE op_shifts
    SET free_slots=free_slots-1
    WHERE shift_position_id=?`,
    [shiftPositionId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "Success",
  });
};
// shift volunteer check-in
export const shiftVolunteerCheckIn = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { checked, shiftboardId, shiftPositionId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET noshow=?, update_shift=1
    WHERE shift_position_id=?
    AND shiftboard_id=?`,
    [checked ? "" : "Yes", shiftPositionId, shiftboardId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "Success",
  });
};
// shift volunteer remove
export const shiftVolunteerRemove = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { shiftboardId, shiftPositionId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET add_shift=false, delete_shift=true
    WHERE shift_position_id=?
    AND shiftboard_id=?`,
    [shiftPositionId, shiftboardId]
  );
  await pool.query<RowDataPacket[]>(
    `UPDATE op_shifts
    SET free_slots=free_slots+1
    WHERE shift_position_id=?`,
    [shiftPositionId]
  );

  return res.status(200).json({
    statusCode: 200,
    message: "Success",
  });
};
