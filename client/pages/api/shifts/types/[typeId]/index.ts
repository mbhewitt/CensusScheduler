import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  IReqShiftTypeItem,
  IResShiftTypeCurrent,
  IResShiftTypeInformation,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "@/components/types/shifts/types";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";
import { handleTimeListAdd } from "pages/api/shifts/types";

const shiftTypeUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { typeId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
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
        [typeId]
      );
      const [resInformation] = dbInformationList.map(
        ({
          core,
          off_playa,
          shift_category,
          shift_details,
          shift_name,
        }: RowDataPacket) => {
          const information: IResShiftTypeInformation = {
            category: { name: shift_category ?? "" },
            details: shift_details,
            isCore: Boolean(core),
            isOffPlaya: Boolean(off_playa),
            name: shift_name,
          };

          return information;
        }
      );
      // get current positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          pt.critical,
          pt.end_time_offset,
          pt.lead,
          pt.position_details,
          pt.position_type_id,
          pt.position,
          pt.start_time_offset,
          r.role,
          sc.shift_category
        FROM op_shift_times AS st
        LEFT JOIN op_shift_time_position AS stp
        ON stp.shift_times_id=st.shift_times_id
        LEFT JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        WHERE st.shift_name_id=?
        AND stp.remove_time_position=false
        ORDER BY pt.position COLLATE utf8mb4_general_ci`,
        [typeId]
      );
      const resPositionList = dbPositionList.map(
        ({
          critical,
          end_time_offset,
          lead,
          position,
          position_details,
          position_type_id,
          role,
          shift_category, // of prerequisite
          start_time_offset,
        }) => {
          const resPositionItem: IResShiftTypePositionItem = {
            critical: Boolean(critical),
            details: position_details,
            endTimeOffset: end_time_offset,
            lead: Boolean(lead),
            name: position,
            positionId: position_type_id,
            prerequisite: shift_category ?? "",
            role: role ?? "",
            startTimeOffset: start_time_offset,
          };

          return resPositionItem;
        }
      );
      // get current times and time positions
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.position,
          pt.position_type_id,
          st.end_time,
          st.meal,
          st.notes,
          st.shift_instance,
          st.shift_times_id,
          st.start_time,
          stp.position_alias,
          stp.sap_points,
          stp.slots,
          stp.time_position_id
        FROM op_shift_times AS st
        LEFT JOIN op_shift_time_position AS stp
        ON stp.shift_times_id=st.shift_times_id
        LEFT JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        WHERE st.shift_name_id=?
        AND st.remove_shift_time=false
        AND stp.remove_time_position=false
        ORDER BY
          st.start_time,
          pt.position COLLATE utf8mb4_general_ci`,
        [typeId]
      );

      const resTimeMap: { [key: string]: boolean } = {};
      const resTimeList: IResShiftTypeTimeItem[] = [];

      dbTimeList.forEach(
        ({
          end_time,
          meal,
          notes,
          position,
          position_alias,
          position_type_id,
          sap_points,
          shift_instance,
          shift_times_id,
          slots,
          start_time,
          time_position_id,
        }) => {
          if (resTimeMap[shift_times_id]) {
            const resTimeFound = resTimeList.find(
              (resTimeItem) => resTimeItem.timeId === shift_times_id
            );

            resTimeFound?.positionList.push({
              alias: position_alias,
              name: position,
              positionId: position_type_id,
              sapPoints: sap_points,
              slots,
              timePositionId: time_position_id,
            });
          } else {
            resTimeMap[shift_times_id] = true;
            resTimeList.push({
              endTime: end_time,
              instance: shift_instance,
              meal: meal === "" ? "None" : meal,
              notes: notes ?? "",
              positionList: [
                {
                  alias: position_alias,
                  name: position,
                  positionId: position_type_id,
                  sapPoints: sap_points,
                  slots,
                  timePositionId: time_position_id,
                },
              ],
              startTime: start_time,
              timeId: shift_times_id,
            });
          }
        }
      );

      const resShiftTypeCurrent: IResShiftTypeCurrent = {
        information: resInformation,
        positionList: resPositionList,
        timeList: resTimeList,
      };

      return res.status(200).json(resShiftTypeCurrent);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update shift type
      const {
        information: {
          category: { id: categoryId },
          details,
          isCore,
          isOffPlaya,
          name,
        },
        timeList,
      }: IReqShiftTypeItem = JSON.parse(req.body);
      let dbTimeIdExist = 0;

      // update information row
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
        [isCore, isOffPlaya, categoryId, details, name, typeId]
      );

      // update time rows
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_times_id
        FROM op_shift_times
        WHERE shift_name_id=?
        AND remove_shift_time=false`,
        [typeId]
      );
      const timeListUpdate = timeList.filter(({ timeId }) => {
        return dbTimeList.some(
          ({ shift_times_id }) => shift_times_id === timeId
        );
      });
      const timeListAdd = timeList.filter(({ timeId }) => {
        return !dbTimeList.some(
          ({ shift_times_id }) => shift_times_id === timeId
        );
      });
      const timeListRemove = dbTimeList.filter(({ shift_times_id }) => {
        return !timeList.some(({ timeId }) => timeId === shift_times_id);
      });

      timeListUpdate.forEach(
        async ({ endTime, timeId, instance, meal, notes, startTime }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_times
            SET
              end_time=?,
              meal=?,
              notes=?,
              update_shift_time=true,
              shift_instance=?,
              start_time=?
            WHERE shift_times_id=?`,
            [
              endTime,
              meal === "None" ? "" : meal,
              notes,
              instance,
              startTime,
              timeId,
            ]
          );
        }
      );
      timeListAdd.forEach(
        async ({ endTime, instance, meal, notes, startTime }) => {
          const [dbTime] = await pool.query<RowDataPacket[]>(
            `SELECT shift_times_id
            FROM op_shift_times
            WHERE end_time=?
            AND start_time=?`,
            [endTime, startTime]
          );
          const [dbTimeFirst] = dbTime;
          dbTimeIdExist = dbTimeFirst?.shift_times_id;

          if (dbTimeFirst) {
            await pool.query<RowDataPacket[]>(
              `UPDATE op_shift_times
              SET
                add_shift_time=true,
                meal=?,
                notes=?,
                remove_shift_time=false,
                shift_instance=?
              WHERE shift_times_id=?`,
              [meal === "None" ? "" : meal, notes, instance, dbTimeIdExist]
            );
          } else {
            // insert new shift time rows
            handleTimeListAdd({
              timeList: timeListAdd,
              typeId: Number(typeId),
            });
          }
        }
      );
      timeListRemove.forEach(async ({ shift_times_id }) => {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_shift_times
          SET
            add_shift_time=false,
            remove_shift_time=true,
            shift_instance=?
          WHERE shift_times_id=?`,
          ["", shift_times_id]
        );
      });

      // update time position rows
      const [dbTimePositionList] = await pool.query<RowDataPacket[]>(
        `SELECT time_position_id
        FROM op_shift_time_position
        WHERE shift_times_id IN (
          SELECT shift_times_id
          FROM op_shift_times
          WHERE shift_name_id=?
        )`,
        [typeId]
      );
      const timePositionList: {
        alias: string;
        name: string;
        positionId: number;
        sapPoints: number;
        slots: number;
        timeId: number;
        timePositionId: number;
      }[] = [];
      for (let i = 0; i < timeList.length; i += 1) {
        for (let j = 0; j < timeList[i].positionList.length; j += 1) {
          timePositionList.push({
            ...timeList[i].positionList[j],
            timeId: timeList[i].timeId,
          });
        }
      }
      // add new positions that are not associated with a new time
      // new positions that are associated with a new time are added in timeListAdd
      const timePositionListAdd = timePositionList.filter(
        ({ timeId, timePositionId }) => {
          return !(
            timeId === 0 ||
            dbTimePositionList.some(
              ({ time_position_id }) => time_position_id === timePositionId
            )
          );
        }
      );
      const timePositionListUpdate = timePositionList.filter(
        ({ timePositionId }) => {
          return dbTimePositionList.some(
            ({ time_position_id }) => time_position_id === timePositionId
          );
        }
      );
      const timePositionListRemove = dbTimePositionList.filter(
        ({ time_position_id }) => {
          return !timePositionList.some(
            ({ timePositionId }) => timePositionId === time_position_id
          );
        }
      );

      timePositionListUpdate.forEach(
        async ({ alias, sapPoints, slots, timePositionId }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_time_position
            SET
              position_alias=?,
              sap_points=?,
              slots=?,
              update_time_position=true
            WHERE time_position_id=?`,
            [alias, sapPoints, slots, timePositionId]
          );
        }
      );
      timePositionListAdd.forEach(
        async ({ alias, positionId, sapPoints, slots, timeId }) => {
          const [dbTimePosition] = await pool.query<RowDataPacket[]>(
            `SELECT time_position_id
            FROM op_shift_time_position
            WHERE shift_times_id=?
            AND position_type_id=?`,
            [dbTimeIdExist || timeId, positionId]
          );
          const [dbTimePositionFirst] = dbTimePosition;

          // if time position exists already
          // then update add_time_position and remove_time_position fields
          if (dbTimePositionFirst) {
            await pool.query<RowDataPacket[]>(
              `UPDATE op_shift_time_position
              SET
                add_time_position=true,
                position_alias=?,
                sap_points=?,
                slots=?,
                remove_time_position=false
              WHERE time_position_id=?`,
              [alias, sapPoints, slots, dbTimePositionFirst.time_position_id]
            );
            // else insert them into the table
          } else {
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
              [alias, positionId, sapPoints, timeId, slots, timePositionIdNew]
            );
          }
        }
      );
      timePositionListRemove.forEach(
        async ({ time_position_id: timePositionId }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_time_position
            SET
              add_time_position=false,
              remove_time_position=true
            WHERE time_position_id=?`,
            [timePositionId]
          );
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // ------------------------------------------------------------
    case "DELETE": {
      // delete shift type
      await pool.query<RowDataPacket[]>(
        `UPDATE op_shift_name
        SET delete_shift=true
        WHERE shift_name_id=?`,
        [typeId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // ------------------------------------------------------------
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
