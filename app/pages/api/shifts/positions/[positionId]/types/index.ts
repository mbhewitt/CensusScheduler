import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const shiftPositionTypes = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { positionId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all active types for position
      const [dbTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sn.shift_name,
          sn.shift_name_id
        FROM op_shift_name AS sn
        JOIN op_shift_position AS sp
        ON sp.shift_name_id=sn.shift_name_id
        AND sn.delete_shift=false
        WHERE sp.position_type_id=?
        ORDER BY sn.shift_name`,
        [positionId]
      );
      const resTypeList = dbTypeList.map(({ shift_name, shift_name_id }) => {
        return {
          id: shift_name_id,
          name: shift_name,
        };
      });

      return res.status(200).json(resTypeList);
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

export default shiftPositionTypes;
