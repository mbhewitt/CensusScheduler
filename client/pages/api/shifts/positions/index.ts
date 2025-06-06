import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftPositionItem,
  IResShiftPositionRowItem,
} from "@/components/types/shifts/positions";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

const shiftPositions = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all positions
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          position_type_id,
          position
        FROM op_position_type AS pt
        WHERE delete_position=false
        ORDER BY position COLLATE utf8mb4_general_ci`
      );
      const resShiftPositionList = dbShiftPositionList.map(
        ({ position_type_id, position }) => {
          const resShiftPositionItem: IResShiftPositionRowItem = {
            id: position_type_id,
            name: position,
          };

          return resShiftPositionItem;
        }
      );

      return res.status(200).json(resShiftPositionList);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // create shift position
      const {
        critical,
        details,
        endTimeOffset,
        lead,
        name: positionName,
        prerequisite: { id: prerequisiteId },
        role: { id: roleId },
        startTimeOffset,
      }: IReqShiftPositionItem = JSON.parse(req.body);
      const positionIdNew = generateId(
        `SELECT position_type_id
        FROM op_position_type
        WHERE position_type_id=?`
      );

      await pool.query(
        // must use backticks for "lead" keyword
        "INSERT INTO op_position_type (create_position, critical, end_time_offset, `lead`, position_details, position_type_id, position, prerequisite_id, role_id, start_time_offset) VALUES (true, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          critical,
          endTimeOffset,
          lead,
          details,
          positionIdNew,
          positionName,
          prerequisiteId,
          roleId,
          startTimeOffset,
        ]
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
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

export default shiftPositions;
