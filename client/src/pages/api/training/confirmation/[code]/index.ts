import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IResTrainingConfirmation,
  IResTrainingShiftItem,
} from "@/components/types/confirm";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// /api/training/confirmation/[code]
// GET reads training + shifts that require it.
// POST assigns the training-completion role to the signed-in volunteer.
// See specs/training-confirmation-endpoint.md.
//
// Auth: wrapped in withAuth so the shiftboardId comes from the
// HMAC-verified session cookie, not a caller-supplied param. The spec's
// "client-side only" note predates the hotfix #288 withAuth infrastructure.

const trainingConfirmation = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { code } = req.query;
  if (typeof code !== "string" || !code) {
    return res.status(400).json({ statusCode: 400, message: "code required" });
  }

  switch (req.method) {
    case "GET": {
      const [dbTrainingList] = await pool.query<RowDataPacket[]>(
        `SELECT
          t.training_id,
          t.training_name,
          t.role_id,
          t.url,
          r.role AS role_name
        FROM op_trainings AS t
        JOIN op_roles AS r ON r.role_id = t.role_id
        WHERE t.code = ? AND t.delete_training = false
        LIMIT 1`,
        [code]
      );
      const dbTraining = dbTrainingList[0];
      if (!dbTraining) {
        return res.status(404).json({ statusCode: 404, message: "Not found" });
      }

      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT playa_name
        FROM op_volunteers
        WHERE shiftboard_id = ?
        LIMIT 1`,
        [session.shiftboardId]
      );
      const dbVolunteer = dbVolunteerList[0];
      if (!dbVolunteer) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Volunteer not found" });
      }

      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
        FROM op_volunteer_roles
        WHERE shiftboard_id = ? AND role_id = ? AND remove_role = false
        LIMIT 1`,
        [session.shiftboardId, dbTraining.role_id]
      );
      const alreadyConfirmed = dbRoleList.length > 0;

      // Shifts that require this training. Soft-delete filters on every
      // link in the join (see spec gotcha #13).
      // d.date is in SELECT to satisfy MySQL strict mode (DISTINCT +
      // ORDER BY require the sort column to be in the select list). It's
      // also useful client-side for display.
      const [dbShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          sn.shift_name,
          sn.shift_name_id,
          sc.shift_category AS department,
          pt.position,
          pt.position_type_id,
          st.shift_instance,
          st.start_time,
          st.start_time_text,
          st.end_time,
          st.end_time_text,
          st.shift_times_id,
          d.date,
          d.datename
        FROM op_position_trainings AS ptr
        JOIN op_position_type AS pt ON ptr.position_type_id = pt.position_type_id
        JOIN op_shift_time_position AS stp ON pt.position_type_id = stp.position_type_id
        JOIN op_shift_times AS st ON stp.shift_times_id = st.shift_times_id
        JOIN op_shift_name AS sn ON st.shift_name_id = sn.shift_name_id
        JOIN op_shift_category AS sc ON sn.shift_category_id = sc.shift_category_id
        LEFT JOIN op_dates AS d ON st.start_date_id = d.date_id
        WHERE ptr.training_id = ?
          AND ptr.delete_position_training = false
          AND stp.remove_time_position = false
          AND st.remove_shift_time = false
          AND st.canceled = false
          AND sn.delete_shift = false
          AND sc.delete_category = false
        ORDER BY d.date, st.start_time_text`,
        [dbTraining.training_id]
      );

      const availableShifts: IResTrainingShiftItem[] = dbShiftList.map(
        (row: RowDataPacket) => ({
          dateName: row.datename ?? "",
          department: row.department ?? "",
          endTime: row.end_time ?? row.end_time_text ?? "",
          position: row.position ?? "",
          positionId: row.position_type_id,
          shiftName: row.shift_name ?? "",
          shiftTimesId: row.shift_times_id,
          startTime: row.start_time ?? row.start_time_text ?? "",
        })
      );

      const body: IResTrainingConfirmation = {
        training: {
          name: dbTraining.training_name,
          roleId: dbTraining.role_id,
          roleName: dbTraining.role_name,
          url: dbTraining.url ?? "",
        },
        volunteer: {
          playaName: dbVolunteer.playa_name ?? "",
        },
        alreadyConfirmed,
        availableShifts,
      };

      return res.status(200).json(body);
    }

    case "POST": {
      const [dbTrainingList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
        FROM op_trainings
        WHERE code = ? AND delete_training = false
        LIMIT 1`,
        [code]
      );
      const dbTraining = dbTrainingList[0];
      if (!dbTraining) {
        return res.status(404).json({ statusCode: 404, message: "Not found" });
      }

      // SELECT-then-branch (matches existing pattern in roles/[id]/volunteers).
      const [dbExistingList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
        FROM op_volunteer_roles
        WHERE role_id = ? AND shiftboard_id = ?
        LIMIT 1`,
        [dbTraining.role_id, session.shiftboardId]
      );

      if (dbExistingList.length > 0) {
        await pool.query(
          `UPDATE op_volunteer_roles
          SET add_role = true, remove_role = false
          WHERE role_id = ? AND shiftboard_id = ?`,
          [dbTraining.role_id, session.shiftboardId]
        );
        return res.status(200).json({ statusCode: 200, message: "OK" });
      }

      await pool.query(
        `INSERT INTO op_volunteer_roles
          (shiftboard_id, role_id, add_role, remove_role)
        VALUES (?, ?, true, false)`,
        [session.shiftboardId, dbTraining.role_id]
      );
      return res.status(201).json({ statusCode: 201, message: "Created" });
    }

    default:
      return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
};

export default withAuth(trainingConfirmation);
