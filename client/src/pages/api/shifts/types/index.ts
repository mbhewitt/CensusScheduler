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

// op_shift_times.shift_instance carries a GLOBAL UNIQUE key, but the "Add
// time" dialog only checks a new label against the current shift type's own
// times — so a label another type already uses (e.g. "Monday Morning") slips
// past the UI and then fails the DB insert. Because the inserts used to run
// fire-and-forget, that duplicate-key error was swallowed and the time
// silently vanished on reload. Run this read-only check BEFORE any writes so a
// collision fails cleanly with a clear message instead. Returns the first
// conflicting label, or null when every label is unique.
export const findInstanceConflict = async ({
  timeList,
}: {
  timeList: IReqShiftTypeTimeItem[];
}): Promise<string | null> => {
  // instance label -> the timeId the request assigns it to
  const requested = new Map<string, number>();
  for (const { instance, timeId } of timeList) {
    if (instance == null || instance === "") continue;
    // same label on two different rows within this one submission
    if (requested.has(instance) && requested.get(instance) !== timeId) {
      return instance;
    }
    requested.set(instance, timeId);
  }
  const instances = [...requested.keys()];
  if (instances.length === 0) return null;

  const [dbRows] = await pool.query<RowDataPacket[]>(
    `SELECT shift_instance, shift_times_id
    FROM op_shift_times
    WHERE remove_shift_time = false
    AND shift_instance IN (?)`,
    [instances]
  );
  for (const { shift_instance, shift_times_id } of dbRows) {
    // A conflict only when the label already lives on a DIFFERENT physical
    // time row. A time keeping its own label (same shift_times_id) is fine.
    if (requested.get(shift_instance) !== shift_times_id) {
      return shift_instance;
    }
  }
  return null;
};

export const handleTimeListAdd = async ({
  timeList,
  typeId,
}: IHandleTimeListAdd) => {
  // insert new shift time rows. Awaited (not fire-and-forget) so a failed
  // insert propagates instead of being silently dropped after the response.
  await Promise.all(
    timeList.map(
    async ({ endTime, instance, meal, notes, positionList, startTime }) => {
      const timeIdNew = generateId(
        `SELECT shift_times_id
        FROM op_shift_times`
      );

      // start_date_id / end_date_id are FK lookups into op_dates by the
      // calendar date portion of start_time / end_time. Every downstream
      // query (/api/shifts, /api/shifts/types/[typeId], /api/shifts/[timeId]/
      // volunteers, etc.) JOINs op_dates via these FKs to get the date label,
      // so a row without them shows up as an orphan with NULL date/datename.
      // Missing date matches resolve to NULL — same as the old behavior.
      //
      // start_time_text / end_time_text hold the bare "HH:mm" — the Shift
      // Types form GET reads ONLY these (not start_time/end_time), so a row
      // without them renders as blank/red time fields in the form (#395).
      await pool.query(
        `INSERT INTO op_shift_times (
          add_shift_time,
          end_date_id,
          end_time,
          end_time_text,
          meal,
          notes,
          shift_instance,
          shift_name_id,
          shift_times_id,
          start_date_id,
          start_time,
          start_time_text
        )
        VALUES (
          true,
          (SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
          ?, DATE_FORMAT(?, '%H:%i'), ?, ?, ?, ?, ?,
          (SELECT date_id FROM op_dates WHERE date = DATE(?) AND delete_date = false LIMIT 1),
          ?, DATE_FORMAT(?, '%H:%i')
        )`,
        [
          endTime,
          endTime,
          endTime,
          meal,
          notes,
          instance,
          typeId,
          timeIdNew,
          startTime,
          startTime,
          startTime,
        ]
      );

      await Promise.all(
        positionList.map(async ({ alias, positionId, sapPoints, slots }) => {
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
        })
      );
    }
    )
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
        ORDER BY shift_name COLLATE utf8mb4_general_ci`
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
      // create shift type
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

      // reject duplicate instance labels before writing anything (see
      // findInstanceConflict) so the save fails cleanly instead of silently
      // dropping the colliding time.
      const conflict = await findInstanceConflict({ timeList });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: `The time label "${conflict}" is already in use by another shift. Each time's Instance label must be unique across all shifts — please rename it and try again.`,
        });
      }

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
      await handleTimeListAdd({ timeList, typeId: typeIdNew });

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
