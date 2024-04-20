import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IReqShiftTypeInfoItem,
  IReqShiftTypePositionItem,
  IResShiftCategoryDropdownItem,
  IResShiftNameDropdownItem,
  IResShiftTypeInfoItem,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { generateId } from "src/utils/generateId";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftTypeId } = req.query;

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
        ORDER BY pt.position`
      );
      const resPositionList: IResShiftTypePositionItem[] = dbPositionList.map(
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
      // get current information
      const [dbShiftTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sc.shift_category,
          sn.core,
          sn.off_playa,
          sn.shift_details,
          sn.shift_name
        FROM op_shift_name AS sn
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        WHERE sn.shift_name_id=?`,
        [shiftTypeId]
      );
      const [resShiftTypeItem]: IResShiftTypeInfoItem[] = dbShiftTypeList.map(
        ({ core, off_playa, shift_category, shift_details, shift_name }) => ({
          category: shift_category ?? "",
          details: shift_details,
          isCore: Boolean(core),
          isOffPlaya: Boolean(off_playa),
          name: shift_name,
        })
      );
      // get all current positions
      const [dbPositionCurrentList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.critical,
          pt.end_time_offset,
          pt.lead,
          pt.position_details,
          pt.position_type_id,
          pt.position,
          pt.start_time_offset,
          r.role,
          sc.shift_category,
          sp.total_slots,
          sp.wap_points
        FROM op_shift_position AS sp
        LEFT JOIN op_position_type AS pt
        ON pt.position_type_id=sp.position_type_id
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        WHERE sp.shift_name_id=?
        ORDER BY pt.position`,
        [shiftTypeId]
      );
      const resPositionCurrentList: IResShiftTypePositionItem[] =
        dbPositionCurrentList.map(
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
            total_slots,
            wap_points,
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
            totalSlots: total_slots,
            wapPoints: wap_points,
          })
        );
      // get all times
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          date,
          end_time,
          notes,
          shift_instance,
          shift_times_id,
          start_time
        FROM op_shift_times
        WHERE shift_name_id=?
        ORDER BY start_time`,
        [shiftTypeId]
      );
      const resTimeList: IResShiftTypeTimeItem[] = dbTimeList.map(
        ({
          date,
          end_time,
          notes,
          shift_instance,
          shift_times_id,
          start_time,
        }) => ({
          date,
          endTime: end_time,
          instance: shift_instance,
          notes: notes ?? "",
          shiftTimesId: shift_times_id,
          startTime: start_time,
        })
      );

      return res.status(200).json({
        information: resShiftTypeItem,
        positionCurrentList: resPositionCurrentList,
        positionList: resPositionList,
        shiftCategoryList: resShiftCategoryList,
        shiftNameList: resShiftNameList,
        timeList: resTimeList,
      });
    }

    // patch
    // --------------------
    case "PATCH": {
      // update shift type
      const {
        information: { shiftCategoryId, details, isCore, isOffPlaya, name },
        positionList,
        timeList,
      }: {
        information: IReqShiftTypeInfoItem;
        positionList: IReqShiftTypePositionItem[];
        timeList: IResShiftTypeTimeItem[];
      } = JSON.parse(req.body);
      let shiftPositionIdNew = 0;
      let shiftTimesIdNew = 0;

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

      // update shift type information row
      await pool.query(
        `UPDATE op_shift_name
        SET
          core=?,
          update_shift=true,
          off_playa=?,
          shift_category_id=?,
          shift_details=?,
          shift_name=?
        WHERE shift_name_id=?`,
        [isCore, isOffPlaya, shiftCategoryId, details, name, shiftTypeId]
      );

      // update shift type position rows
      positionList.forEach(async ({ positionId, totalSlots, wapPoints }) => {
        const [dbPositionList] = await pool.query<RowDataPacket[]>(
          `SELECT shift_position_id
          FROM op_shift_position
          WHERE shift_name_id=?
          AND shift_position_id=?`,
          [shiftTypeId, positionId]
        );
        const dbPositionFirst = dbPositionList[0];

        // if shift type position row exists
        // then update shift type position row
        if (dbPositionFirst) {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_position
            SET
              total_slots=?,
              update_shift_position=true,
              wap_points=?
            WHERE shift_position_id=?`,
            [totalSlots, wapPoints, positionId]
          );
          // else insert new shift type position row
        } else {
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
            [positionId, shiftTypeId, shiftPositionIdNew, totalSlots, wapPoints]
          );
        }
      });

      // update shift type time rows
      timeList.forEach(
        async ({ date, endTime, instance, notes, shiftTimesId, startTime }) => {
          const [dbShiftTimeList] = await pool.query<RowDataPacket[]>(
            `SELECT shift_times_id
            FROM op_shift_times
            WHERE shift_times_id=?`,
            [shiftTimesId]
          );
          const dbShiftTimeFirst = dbShiftTimeList[0];

          // if shift type time row exists
          // then update shift type time row
          if (dbShiftTimeFirst) {
            await pool.query<RowDataPacket[]>(
              `UPDATE op_shift_times
              SET
                date=?,
                end_time=?,
                notes=?,
                update_shift_time=true,
                shift_instance=?,
                start_time=?,
                year=?
              WHERE shift_times_id=?`,
              [
                date,
                endTime,
                notes,
                instance,
                startTime,
                date.split("-")[0],
                shiftTimesId,
              ]
            );
            // else insert new shift type time row
          } else {
            generateShiftTimesId();
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
                shiftTypeId,
                shiftTimesIdNew,
                startTime,
                date.split("-")[0],
              ]
            );
          }
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
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
