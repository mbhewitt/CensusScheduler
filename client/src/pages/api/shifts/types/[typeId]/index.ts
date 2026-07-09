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
import {
  notifyRemoval,
  notifyRestoration,
} from "@/components/api/assignmentNotify";
import {
  findInstanceConflict,
  handleTimeListAdd,
} from "@/pages/api/shifts/types";

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
          d.date,
          pt.position,
          pt.position_type_id,
          st.canceled,
          st.end_time_text,
          st.meal,
          st.notes,
          st.shift_instance,
          st.shift_times_id,
          st.start_time_text,
          stp.position_alias,
          stp.sap_points,
          stp.slots,
          stp.time_position_id
        FROM op_shift_times AS st
        LEFT JOIN op_dates AS d
        ON d.date_id=st.start_date_id
        LEFT JOIN op_shift_time_position AS stp
        ON stp.shift_times_id=st.shift_times_id
        LEFT JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        WHERE st.shift_name_id=?
        AND st.remove_shift_time=false
        AND stp.remove_time_position=false
        ORDER BY
          d.date,
          st.start_time_text,
          pt.position COLLATE utf8mb4_general_ci`,
        [typeId]
      );

      const resTimeMap: { [key: string]: boolean } = {};
      const resTimeList: IResShiftTypeTimeItem[] = [];

      dbTimeList.forEach(
        ({
          canceled,
          date,
          end_time_text,
          meal,
          notes,
          position,
          position_alias,
          position_type_id,
          sap_points,
          shift_instance,
          shift_times_id,
          slots,
          start_time_text,
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
              canceled: Boolean(canceled),
              date: date,
              endTime: end_time_text,
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
              startTime: start_time_text,
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

      // reject duplicate instance labels before writing anything (see
      // findInstanceConflict) so the save fails cleanly instead of silently
      // dropping the colliding time. Excludes each time's own row, so keeping
      // an existing label is fine.
      const conflict = await findInstanceConflict({
        timeList,
        typeId: Number(typeId),
      });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: `The time label "${conflict}" is already used by another time in this shift. Each time's Instance label must be unique within the shift — please rename it and try again.`,
        });
      }

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

      // Capture the prior `canceled` state for every row we're about to
      // touch so we can detect the 0→1 transition and notify the
      // assigned volunteers exactly once per cancellation. Done before
      // the UPDATEs fire.
      const wasCanceledMap = new Map<number, boolean>();
      if (timeListUpdate.length > 0) {
        const [priorStates] = await pool.query<RowDataPacket[]>(
          `SELECT shift_times_id, canceled FROM op_shift_times
           WHERE shift_times_id IN (?)`,
          [timeListUpdate.map(({ timeId }) => timeId)]
        );
        for (const row of priorStates) {
          wasCanceledMap.set(row.shift_times_id, Boolean(row.canceled));
        }
      }

      // Await the UPDATEs so transition detection / notify happens
      // after the writes land (the previous forEach(async) pattern
      // raced the route's response).
      await Promise.all(
        timeListUpdate.map(
          async ({ canceled, endTime, timeId, instance, meal, notes, startTime }) => {
            // Refresh start_date_id / end_date_id alongside the start_time /
            // end_time change — a date edit must update the FK or downstream
            // joins keep pointing at the old date row. See [[fix-handleTimeListAdd]].
            // start_time_text / end_time_text ("HH:mm") must be written too:
            // the Shift Types form GET reads ONLY the _text columns, so
            // skipping them leaves the form's time fields blank/red (#395).
            await pool.query<RowDataPacket[]>(
              `UPDATE op_shift_times
              SET
                canceled=?,
                end_date_id=(SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
                end_time=?,
                end_time_text=DATE_FORMAT(?, '%H:%i'),
                meal=?,
                notes=?,
                update_shift_time=true,
                shift_instance=?,
                start_date_id=(SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
                start_time=?,
                start_time_text=DATE_FORMAT(?, '%H:%i')
              WHERE shift_times_id=?`,
              [
                Boolean(canceled),
                endTime,
                endTime,
                endTime,
                meal === "None" ? "" : meal,
                notes,
                instance,
                startTime,
                startTime,
                startTime,
                timeId,
              ]
            );
          }
        )
      );

      // For each shift_times_id that flipped 0→1 (newly canceled) or
      // 1→0 (un-canceled), fan out the appropriate email per still-
      // assigned volunteer. Best-effort: enqueue failures log and the
      // route still 201s.
      for (const t of timeListUpdate) {
        const wasCanceled = wasCanceledMap.get(t.timeId) ?? false;
        const isCanceled = Boolean(t.canceled);
        if (wasCanceled === isCanceled) continue;
        const tag = isCanceled ? "shift-canceled" : "shift-restored";
        try {
          const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT DISTINCT vs.shiftboard_id, vs.time_position_id
             FROM op_volunteer_shifts vs
             JOIN op_shift_time_position stp
               ON stp.time_position_id = vs.time_position_id
             WHERE stp.shift_times_id = ?
               AND vs.remove_shift = false`,
            [t.timeId]
          );
          for (const v of rows) {
            try {
              if (isCanceled) {
                await notifyRemoval(
                  pool,
                  v.shiftboard_id,
                  v.time_position_id,
                  { kind: "shift-canceled" }
                );
              } else {
                await notifyRestoration(
                  pool,
                  v.shiftboard_id,
                  v.time_position_id
                );
              }
            } catch (err) {
              console.error(
                `[${tag}-notify] enqueue failed for shiftboard_id=${v.shiftboard_id} time_position_id=${v.time_position_id}:`,
                err
              );
            }
          }
        } catch (err) {
          console.error(
            `[${tag}-notify] fan-out failed for shift_times_id=${t.timeId}:`,
            err
          );
        }
      }
      // Snapshot existing time-position rows BEFORE inserting any new times.
      // handleTimeListAdd (below) inserts each new time's position with a
      // server-generated id the request doesn't know about; if that fresh row
      // were included in this snapshot, timePositionListRemove would treat it
      // as an existing row missing from the request and wrongly mark it
      // removed — which hides the just-added time on reload (the form GET
      // filters out times whose position is removed).
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

      // add new times. Awaited (not fire-and-forget) so inserts complete and
      // any error surfaces; each new time is inserted individually — the old
      // code passed the whole timeListAdd once per item, re-inserting them.
      await Promise.all(
        timeListAdd.map(async (timeItem) => {
          const { endTime, instance, meal, notes, startTime } = timeItem;
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
            await handleTimeListAdd({
              timeList: [timeItem],
              typeId: Number(typeId),
            });
          }
        })
      );
      await Promise.all(
        timeListRemove.map(async ({ shift_times_id }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_times
            SET
              add_shift_time=false,
              remove_shift_time=true,
              shift_instance=?
            WHERE shift_times_id=?`,
            // use shift times ID for shift instance because shift instance must be unique
            [shift_times_id, shift_times_id]
          );
        })
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

      // Awaited (was forEach(async), fire-and-forget): the three time-position
      // loops must finish before the 200, or the response races the writes and
      // a just-added position/time vanishes on reload (the form GET drops any
      // time with no position row). Same fix already applied to the time loops
      // above (see the [[shift-type-patch-forEach-race]] comments).
      await Promise.all(
        timePositionListUpdate.map(
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
      ));
      await Promise.all(
        timePositionListAdd.map(
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
      ));
      await Promise.all(
        timePositionListRemove.map(
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
      ));

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
