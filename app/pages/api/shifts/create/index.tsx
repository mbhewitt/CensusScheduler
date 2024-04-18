import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IResCreateShiftPositionDropdownItem,
  IResShiftCategoryDropdownItem,
  IResShiftNameDropdownItem,
} from "src/components/types";
import { generateId } from "src/utils/generateId";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift names
      const [dbShiftNameList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_name, shift_name_id
        FROM op_shift_name
        ORDER BY shift_name`
      );
      const resShiftNameList: IResShiftNameDropdownItem[] = dbShiftNameList.map(
        ({ shift_name, shift_name_id }) => ({
          shiftNameId: shift_name_id,
          shiftNameText: shift_name,
        })
      );
      // get all shift categories
      const [dbShiftCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_category, shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resShiftCategoryList: IResShiftCategoryDropdownItem[] =
        dbShiftCategoryList.map(({ shift_category, shift_category_id }) => ({
          shiftCategoryId: shift_category_id,
          shiftCategoryName: shift_category,
        }));
      // get all positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
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
        ORDER BY position`
      );
      const resPositionList: IResCreateShiftPositionDropdownItem[] =
        dbPositionList.map(
          ({
            critical,
            end_time_offset,
            lead,
            position,
            position_details,
            position_type_id,
            role,
            shift_category,
            start_time_offset,
          }) => ({
            critical: Boolean(critical),
            endTimeOffset: end_time_offset,
            lead: Boolean(lead),
            positionDetails: position_details,
            role: role ?? "",
            positionId: position_type_id,
            positionName: position,
            prerequisiteShift: shift_category ?? "",
            startTimeOffset: start_time_offset,
          })
        );

      return res.status(200).json({
        positionList: resPositionList,
        shiftCategoryList: resShiftCategoryList,
        shiftNameList: resShiftNameList,
      });
    }
    // post
    // --------------------
    case "POST": {
      // create shift
      const {
        information: { shiftCategoryId, details, isCore, isOffPlaya, name },
        positionList,
        timeList,
      } = JSON.parse(req.body);
      let shiftNameIdNew = 0;
      let shiftPositionIdNew = 0;
      let shiftTimesIdNew = 0;

      // generate new shift name ID
      const generateShiftNameId = async () => {
        shiftNameIdNew = generateId();
        const [dbShiftNameIdList] = await pool.query<RowDataPacket[]>(
          `SELECT shift_name_id
          FROM op_shift_name
          WHERE shift_name_id=?`,
          [shiftNameIdNew]
        );
        const dbShiftNameIdFirst = dbShiftNameIdList[0];

        // if shift name ID exists already
        // then execute function recursively
        if (dbShiftNameIdFirst) {
          generateShiftNameId();
        }
      };
      // generate new shift position ID
      const generateShiftPositionId = async () => {
        shiftPositionIdNew = generateId();
        const [dbShiftPositionIdList] = await pool.query<RowDataPacket[]>(
          `SELECT shift_position_id
          FROM op_shift_position
          WHERE shift_position_id=?`,
          [shiftPositionIdNew]
        );
        const dbShiftPositionIdFirst = dbShiftPositionIdList[0];

        // if shift position ID exists already
        // then execute function recursively
        if (dbShiftPositionIdFirst) {
          generateShiftPositionId();
        }
      };
      // generate new shift times ID
      const generateShiftTimesId = async () => {
        shiftTimesIdNew = generateId();
        const [dbShiftTimesIdList] = await pool.query<RowDataPacket[]>(
          `SELECT shift_times_id
          FROM op_shift_times
          WHERE shift_times_id=?`,
          [shiftTimesIdNew]
        );
        const dbShiftTimesIdFirst = dbShiftTimesIdList[0];

        // if shift position ID exists already
        // then execute function recursively
        if (dbShiftTimesIdFirst) {
          generateShiftTimesId();
        }
      };

      // insert new shift name row
      generateShiftNameId();
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
        [isCore, isOffPlaya, shiftCategoryId, details, name, shiftNameIdNew]
      );
      // insert new shift position rows
      positionList.forEach(
        async ({
          positionId,
          totalSlots,
          wapPoints,
        }: {
          positionId: number;
          totalSlots: number;
          wapPoints: number;
        }) => {
          generateShiftPositionId();
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
              positionId,
              shiftNameIdNew,
              shiftPositionIdNew,
              totalSlots,
              wapPoints,
            ]
          );
        }
      );
      // insert new shift time rows
      generateShiftTimesId();
      timeList.forEach(
        async ({
          date,
          endTime,
          instance,
          notes,
          startTime,
          year,
        }: {
          date: string;
          endTime: string;
          instance: string;
          notes: string;
          startTime: string;
          year: string;
        }) => {
          generateShiftPositionId();
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
              shiftNameIdNew,
              shiftTimesIdNew,
              startTime,
              year,
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
    // send error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default shifts;
