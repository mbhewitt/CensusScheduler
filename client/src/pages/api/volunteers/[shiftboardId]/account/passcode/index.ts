import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqPasscode } from "@/components/types/volunteers";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";

const volunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    // Self-only reveal. An admin can SET someone else's passcode (PATCH
    // below — not gated; see #350 for the broader tightening), but
    // nobody — including admins — can READ an existing one through this
    // endpoint. Per Mew 2026-05-25.
    case "GET": {
      const requestId = Number(shiftboardId);
      if (!session || session.shiftboardId !== requestId) {
        return res.status(403).json({
          statusCode: 403,
          message: "Forbidden",
        });
      }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT passcode
        FROM op_volunteers
        WHERE shiftboard_id=?
        LIMIT 1`,
        [requestId]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }
      return res.status(200).json({
        statusCode: 200,
        passcode: rows[0].passcode ?? "",
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update volunteer passcode
      const { passcode }: IReqPasscode = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET
          passcode=?,
          update_volunteer=true
        WHERE shiftboard_id=?`,
        [passcode, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // ------------------------------------------------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(volunteers);
