import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { isProvisionedDevice } from "@/lib/device";
import { readSessionFromCookies } from "@/lib/session";
import { getShiftList } from "@/utils/getShiftList";
import { pool } from "lib/database";

const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

// Off-playa, signed-out visitors (and recruiting links) see only shifts a new
// volunteer could sign up for: positions that need no role, earn CSP, on
// shifts that aren't canceled (per Mew 2026-10-16). Shifts with no open slot
// are dropped after counting. Signed-in volunteers and on-playa walk-ups
// keep the full list.
const PUBLIC_JOIN = `JOIN op_position_type AS pt
          ON pt.position_type_id=stp.position_type_id
          AND pt.role_id IS NULL
          AND stp.sap_points > 0`;

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  const { filter } = req.query;
  const isPublic =
    !isOnPlaya &&
    !isProvisionedDevice(req.cookies) &&
    !readSessionFromCookies(req.cookies);
  const publicJoin = isPublic ? PUBLIC_JOIN : "";
  const publicWhere = isPublic ? "AND st.canceled=false" : "";

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      let dbShiftList = [];

      // get all training shifts
      if (filter === "trainings") {
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT
            d.date,
            d.datename,
            sc.department,
            sc.shift_category_id,
            sn.shift_name,
            st.end_time,
            st.end_time_text,
            st.shift_times_id,
            st.start_time,
            st.start_time_text,
            stp.sap_points,
            stp.slots,
            stp.time_position_id,
            vs.remove_shift,
            vs.shiftboard_id
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.delete_shift=false
          AND sn.off_playa=false
          AND sn.shift_name_id=st.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.delete_category=false
          AND sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date_id=st.start_date_id
          JOIN op_shift_time_position AS stp
          ON stp.remove_time_position=false
          AND stp.shift_times_id=st.shift_times_id
          ${publicJoin}
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.remove_shift=false
          AND vs.time_position_id=stp.time_position_id
          WHERE st.remove_shift_time=false
          AND st.canceled=false
          AND sc.department="Training"
          ORDER BY d.date, st.start_time_text`
        );
      } else {
        // get all shifts (including canceled — UI strikes them through
        // and prevents adds; volunteers still need to see them so they
        // know they were canceled and can self-remove)
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT
            d.date,
            d.datename,
            sc.department,
            sc.shift_category_id,
            sn.shift_name,
            st.canceled,
            st.end_time,
            st.end_time_text,
            st.shift_times_id,
            st.start_time,
            st.start_time_text,
            stp.sap_points,
            stp.slots,
            stp.time_position_id,
            vs.shiftboard_id
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.delete_shift=false
          AND sn.off_playa=false
          AND sn.shift_name_id=st.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.delete_category=false
          AND sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date_id=st.start_date_id
          JOIN op_shift_time_position AS stp
          ON stp.remove_time_position=false
          AND stp.shift_times_id=st.shift_times_id
          ${publicJoin}
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.remove_shift=false
          AND vs.time_position_id=stp.time_position_id
          WHERE st.remove_shift_time=false
          ${publicWhere}
          ORDER BY d.date, st.start_time_text`
        );
      }
      const resShiftList = getShiftList(dbShiftList).filter(
        (shift) => !isPublic || shift.slotsFilled < shift.slotsTotal
      );

      return res.status(200).json(resShiftList);
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

export default shifts;
