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

const shiftTypeUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { typeId } = req.query;

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
        ORDER BY pt.position`,
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
          st.end_time_lt,
          st.notes,
          st.shift_instance,
          st.shift_times_id,
          st.start_time_lt,
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
        AND remove_shift_time=false
        ORDER BY st.start_time_lt, pt.position`,
        [typeId]
      );

      const resTimeMap: { [key: string]: boolean } = {};
      const resTimeList: IResShiftTypeTimeItem[] = [];

      dbTimeList.forEach(
        ({
          end_time_lt,
          notes,
          position,
          position_alias,
          position_type_id,
          sap_points,
          shift_instance,
          shift_times_id,
          slots,
          start_time_lt,
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
              endTime: end_time_lt,
              instance: shift_instance,
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
              startTime: start_time_lt,
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
    // --------------------
    case "PATCH": {
      // update type
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
        WHERE shift_name_id=?`,
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
        async ({ endTime, timeId, instance, notes, startTime }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_times
            SET
              end_time_lt=?,
              notes=?,
              update_shift_time=true,
              shift_instance=?,
              start_time_lt=?
            WHERE shift_times_id=?`,
            [endTime, notes, instance, startTime, timeId]
          );
        }
      );
      timeListAdd.forEach(
        async ({ endTime, instance, notes, positionList, startTime }) => {
          const idNew = generateId(
            `SELECT shift_times_id
          FROM op_shift_times`
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
            [endTime, notes, instance, typeId, idNew, startTime]
          );

          positionList.forEach(
            async ({ alias, positionId, sapPoints, slots }) => {
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
                [alias, positionId, sapPoints, idNew, slots, timePositionIdNew]
              );
            }
          );
        }
      );
      timeListRemove.forEach(async ({ shift_times_id }) => {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_shift_times
          SET remove_shift_time=true
          WHERE shift_times_id=?`,
          [shift_times_id]
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
      timePositionListRemove.forEach(
        async ({ time_position_id: timePositionId }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_time_position
            SET remove_time_position=true
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
    // --------------------
    case "DELETE": {
      // delete type
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
