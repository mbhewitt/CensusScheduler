import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftTypeItem,
  IReqShiftTypeTimeItem,
  IResShiftTypeRowItem,
} from "@/components/types/shifts/types";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

interface IHandleTimeListAdd {
  timeList: IReqShiftTypeTimeItem[];
  typeId: number;
}

export const handleTimeListAdd = async ({
  timeList,
  typeId,
}: IHandleTimeListAdd) => {
  // insert new shift time rows
  timeList.forEach(
    async ({ endTime, instance, notes, positionList, startTime }) => {
      const timeIdNew = generateId(
        `SELECT shift_times_id
        FROM op_shift_times`
      );

      await pool.query(
        `INSERT INTO op_shift_times (
          add_shift_time,
          end_time,
          notes,
          shift_instance,
          shift_name_id,
          shift_times_id,
          start_time
        )
        VALUES (true, ?, ?, ?, ?, ?, ?)`,
        [endTime, notes, instance, typeId, timeIdNew, startTime]
      );

      positionList.forEach(async ({ alias, positionId, sapPoints, slots }) => {
        const timePositionIdNew = generateId(
          `SELECT time_position_id
          FROM op_shift_time_position`
        );

        await pool.query(
          `INSERT INTO op_shift_time_position (
            add_time_position,
            position_alias,
            position_type_id,
            sap_points,
            shift_times_id,
            slots,
            time_position_id
          )
          VALUES (true, ?, ?, ?, ?, ?, ?)`,
          [alias, positionId, sapPoints, timeIdNew, slots, timePositionIdNew]
        );
      });
    }
  );
};

const shiftTypes = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
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
    // ------------------------------------------------------------
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
        timeList,
      }: IReqShiftTypeItem = JSON.parse(req.body);
      const typeIdNew = generateId(
        `SELECT shift_name_id
        FROM op_shift_name`
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

      // insert new shift time rows
      handleTimeListAdd({ timeList, typeId: typeIdNew });

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

export default shiftTypes;
