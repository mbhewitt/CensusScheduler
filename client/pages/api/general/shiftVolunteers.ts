import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqCheckboxValues, IReqReviewValues } from "@/components/types";
import { UPDATE_TYPE_CHECK_IN, UPDATE_TYPE_REVIEW } from "@/constants";

export const shiftVolunteerUpdate = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { updateType } = JSON.parse(req.body);

  switch (updateType) {
    // patch - shift volunteer check-in
    case UPDATE_TYPE_CHECK_IN: {
      const { isCheckedIn, shiftboardId, timePositionId }: IReqCheckboxValues =
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
    }

    // patch - shift volunteer review
    case UPDATE_TYPE_REVIEW: {
      const { notes, rating, shiftboardId, timePositionId }: IReqReviewValues =
        JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_shifts
        SET
          notes=?,
          rating=?,
          update_shift=true
        WHERE shiftboard_id=?
        AND time_position_id=?`,
        [notes, rating, shiftboardId, timePositionId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
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
