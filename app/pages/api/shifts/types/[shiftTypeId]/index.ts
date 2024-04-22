import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IReqShiftTypeInfoItem,
  IReqShiftTypePositionItem,
  IResShiftTypeInformation,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { checkIsIdExists, generateId } from "src/utils/generateId";

const shiftTypeUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftTypeId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get current information
      const [dbInformationList] = await pool.query<RowDataPacket[]>(
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
      const [resInformation]: IResShiftTypeInformation[] =
        dbInformationList.map(
          ({ core, off_playa, shift_category, shift_details, shift_name }) => ({
            category: shift_category ?? "",
            details: shift_details,
            isCore: Boolean(core),
            isOffPlaya: Boolean(off_playa),
            name: shift_name,
          })
        );
      // get all current positions
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
          total_slots,
          wap_points,
        }) => ({
          critical: Boolean(critical),
          details: position_details,
          endTimeOffset: end_time_offset,
          id: position_type_id,
          lead: Boolean(lead),
          name: position,
          prerequisiteShift: shift_category ?? "",
          role: role ?? "",
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
          startTime: start_time,
          timeId: shift_times_id,
        })
      );

      return res.status(200).json({
        information: resInformation,
        positionList: resPositionList,
        timeList: resTimeList,
      });
    }

    // patch
    // --------------------
    case "PATCH": {
      // update shift type
      const {
        information: { categoryId, details, isCore, isOffPlaya, name },
        positionList,
        timeList,
      }: {
        information: IReqShiftTypeInfoItem;
        positionList: IReqShiftTypePositionItem[];
        timeList: IResShiftTypeTimeItem[];
      } = JSON.parse(req.body);

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
        [isCore, isOffPlaya, categoryId, details, name, shiftTypeId]
      );

      // update shift type position rows
      positionList.forEach(
        async ({ id: positionId, totalSlots, wapPoints }) => {
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
                positionId,
                shiftTypeId,
                shiftPositionIdNew,
                totalSlots,
                wapPoints,
              ]
            );
          }
        }
      );

      // update shift type time rows
      timeList.forEach(
        async ({ date, endTime, instance, notes, startTime, timeId }) => {
          const timeIdQuery = `
            SELECT shift_times_id
            FROM op_shift_times
            WHERE shift_times_id=?
          `;
          const isTimeIdExist = await checkIsIdExists(timeIdQuery, timeId);

          // if shift type time row exists
          // then update shift type time row
          if (isTimeIdExist) {
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
                timeId,
              ]
            );
            // else insert new shift type time row
          } else {
            const timeIdNew = generateId(timeIdQuery);

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
                timeIdNew,
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

export default shiftTypeUpdate;
