import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type {
  IReqShiftPositionItem,
  IResShiftPositionItem,
} from "src/components/types/shifts/positions";

const shiftPositions = async (req: NextApiRequest, res: NextApiResponse) => {
  const { positionId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get position
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.critical,
          pt.end_time_offset,
          pt.lead,
          pt.position_details,
          pt.position_type_id,
          pt.position,
          pt.start_time_offset,
          r.role,
          sc.shift_category
        FROM op_position_type AS pt
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        WHERE pt.position_type_id=?`,
        [positionId]
      );
      const [resShiftPositionFirst] = dbShiftPositionList.map(
        ({
          critical,
          end_time_offset,
          lead,
          position_details,
          position,
          start_time_offset,
          role,
          shift_category,
        }: RowDataPacket) => {
          const resShiftPositionItem: IResShiftPositionItem = {
            critical: Boolean(critical),
            endTimeOffset: end_time_offset,
            lead: Boolean(lead),
            details: position_details,
            name: position,
            prerequisite: {
              name: shift_category ?? "",
            },
            startTimeOffset: start_time_offset,
            role: {
              name: role ?? "",
            },
          };

          return resShiftPositionItem;
        }
      );

      return res.status(200).json(resShiftPositionFirst);
    }

    // patch
    // --------------------
    case "PATCH": {
      // update position
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

      await pool.query<RowDataPacket[]>(
        // must use backticks for "lead" keyword
        "UPDATE op_position_type SET critical=?, end_time_offset=?, `lead`=?, position_details=?, position=?, prerequisite_id=?, role_id=?, start_time_offset=?, update_position=true WHERE position_type_id=?",
        [
          critical,
          endTimeOffset,
          lead,
          details,
          positionName,
          prerequisiteId,
          roleId,
          startTimeOffset,
          positionId,
        ]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // --------------------
    case "DELETE": {
      // delete position
      await pool.query<RowDataPacket[]>(
        `UPDATE op_position_type
        SET delete_position=true
        WHERE position_type_id=?`,
        [positionId]
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

export default shiftPositions;
