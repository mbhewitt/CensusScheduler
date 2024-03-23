import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId } = req.query;

  switch (req.method) {
    // patch
    // --------------------
    case "PATCH": {
      // reset volunteer passcode
      const { passcode } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET passcode=?
        WHERE shiftboard_id=?`,
        [passcode, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // --------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default volunteers;
