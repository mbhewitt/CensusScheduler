import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type {
  IReqShiftTypePositionItem,
  IResShiftTypeItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { generateId } from "src/utils/generateId";

const shiftTypes = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift types
      const [dbShiftTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_name, shift_name_id
        FROM op_shift_name
        WHERE delete_shift=false
        ORDER BY shift_name`
      );
      const resShiftTypeList: IResShiftTypeItem[] = dbShiftTypeList.map(
        ({ shift_name, shift_name_id }) => {
          return { id: shift_name_id, name: shift_name };
        }
      );

      return res.status(200).json(resShiftTypeList);
    }

    // post
    // --------------------
    case "POST": {
      // create shift type
      const {
        information: { categoryId, details, isCore, isOffPlaya, name },
        positionList,
        timeList,
      } = JSON.parse(req.body);
      const typeIdNew = generateId(
        `SELECT shift_name_id
        FROM op_shift_name
        WHERE shift_name_id=?`
      );

      // insert new shift name row
      await pool.query(
        `INSERT INTO op_shift_name (
          core,
          create_shift,
          off_playa,
          shift_category_id,
          shift_details,
          shift_name,
          shift_name_id
        )
        VALUES (?, true, ?, ?, ?, ?, ?)`,
        [isCore, isOffPlaya, categoryId, details, name, typeIdNew]
      );
      // insert new shift position rows
      positionList.forEach(
        async ({
          positionTypeId,
          totalSlots,
          wapPoints,
        }: IReqShiftTypePositionItem) => {
          const shiftPositionIdNew = generateId(
            `SELECT shift_position_id
            FROM op_shift_position
            WHERE shift_position_id=?`
          );

          await pool.query(
            `INSERT INTO op_shift_position (
              add_shift_position,
              position_type_id,
              shift_name_id,
              shift_position_id,
              total_slots,
              wap_points
            )
            VALUES (true, ?, ?, ?, ?, ?)`,
            [
              positionTypeId,
              typeIdNew,
              shiftPositionIdNew,
              totalSlots,
              wapPoints,
            ]
          );
        }
      );
      // insert new shift time rows
      timeList.forEach(
        async ({
          date,
          endTime,
          instance,
          notes,
          startTime,
        }: IResShiftTypeTimeItem) => {
          const timeIdNew = generateId(
            `SELECT shift_times_id
            FROM op_shift_times
            WHERE shift_times_id=?`
          );

          await pool.query(
            `INSERT INTO op_shift_times (
              add_shift_time,
              date,
              end_time,
              notes,
              shift_instance,
              shift_name_id,
              shift_times_id,
              start_time,
              year
            )
            VALUES (true, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              date,
              endTime,
              notes,
              instance,
              typeIdNew,
              timeIdNew,
              startTime,
              date.split("-")[0],
            ]
          );
        }
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
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

export default shiftTypes;
