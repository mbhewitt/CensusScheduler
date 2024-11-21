import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftTypeItem,
  IResShiftTypeRowItem,
} from "@/components/types/shifts/types";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

const shiftTypes = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all types
      const [dbTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sc.shift_category,
          sn.shift_name,
          sn.shift_name_id
        FROM op_shift_name as sn
        LEFT JOIN op_shift_category as sc
        ON sc.shift_category_id=sn.shift_category_id
        WHERE delete_shift=false
        ORDER BY shift_name`
      );
      const resTypeList = dbTypeList.map(
        ({ shift_category, shift_name, shift_name_id }) => {
          const resTypeItem: IResShiftTypeRowItem = {
            category: { name: shift_category ?? "" },
            id: shift_name_id,
            name: shift_name,
          };

          return resTypeItem;
        }
      );

      return res.status(200).json(resTypeList);
    }

    // post
    // --------------------
    case "POST": {
      // create type
      const {
        information: {
          category: { id },
          details,
          isCore,
          isOffPlaya,
          name,
        },
        positionList,
        timeList,
      }: IReqShiftTypeItem = JSON.parse(req.body);
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
        [isCore, isOffPlaya, id, details, name, typeIdNew]
      );
      // insert new shift position rows
      positionList.forEach(async ({ positionId, totalSlots, wapPoints }) => {
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
          [positionId, typeIdNew, shiftPositionIdNew, totalSlots, wapPoints]
        );
      });
      // insert new shift time rows
      timeList.forEach(async ({ endTime, instance, notes, startTime }) => {
        const timeIdNew = generateId(
          `SELECT shift_times_id
            FROM op_shift_times
            WHERE shift_times_id=?`
        );

        await pool.query(
          `INSERT INTO op_shift_times (
              add_shift_time,
              end_time_lt,
              notes,
              shift_instance,
              shift_name_id,
              shift_times_id,
              start_time_lt
            )
            VALUES (true, ?, ?, ?, ?, ?, ?)`,
          [endTime, notes, instance, typeIdNew, timeIdNew, startTime]
        );
      });

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
