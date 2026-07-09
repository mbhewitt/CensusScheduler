import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqVolunteerInfoUpdate,
  IResVolunteerInfo,
} from "@/components/types/volunteer-info";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isOwnerOrAdmin } from "@/lib/authz";
import { buildRequiredDays, PRE_OPEN_DATENAMES } from "lib/sapStatus";

// Role IDs for VIP-specific roles
const ROLE_STAFF_ID = 2000006;
const ROLE_OTHER_SAP_ID = 2000007;
const ROLE_BURNER_PROFILE_UPDATED_ID = 2000010;
const ROLE_WELCOME_COMPLETE_ID = 174766;
const ROLE_BEHAVIORAL_STANDARDS_ID = 1000012;
const ROLE_EMAIL_UNSUBSCRIBED_ID = 2000020;

const volunteerInfo = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  // Owner-or-admin gate (#410): being logged in isn't enough — a volunteer may
  // only read their own record; admins may read anyone's.
  if (!(await isOwnerOrAdmin(session, Number(shiftboardId)))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // 1. fetch volunteer
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          shiftboard_id,
          playa_name,
          world_name,
          email,
          location,
          arrival_date_id
        FROM op_volunteers
        WHERE delete_volunteer=false
        AND shiftboard_id=?`,
        [shiftboardId]
      );
      if (!dbVolunteerList.length) {
        return res.status(404).json({
          statusCode: 404,
          message: "Volunteer not found",
        });
      }
      const dbVolunteer = dbVolunteerList[0];

      // 2. fetch arrival date (if set)
      let arrivalDate: IResVolunteerInfo["arrivalDate"] = null;
      if (dbVolunteer.arrival_date_id) {
        const [dbArrivalDateList] = await pool.query<RowDataPacket[]>(
          `SELECT date_id, datename, date
          FROM op_dates
          WHERE date_id=?`,
          [dbVolunteer.arrival_date_id]
        );
        if (dbArrivalDateList.length) {
          const d = dbArrivalDateList[0];
          arrivalDate = {
            dateId: d.date_id,
            datename: d.datename,
            date: d.date,
          };
        }
      }

      // 3. check for SAP file
      const [dbSapList] = await pool.query<RowDataPacket[]>(
        `SELECT s.sap_id, s.filename, d.datename, d.date
        FROM op_saps s
        JOIN op_dates d ON s.date_id=d.date_id
        WHERE s.shiftboard_id=?
        ORDER BY s.created_at DESC
        LIMIT 1`,
        [shiftboardId]
      );

      // 4. fetch volunteer roles
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT r.role, r.role_id, r.census_shift_points
        FROM op_volunteer_roles vr
        JOIN op_roles r ON vr.role_id=r.role_id
        WHERE vr.shiftboard_id=?
        AND vr.remove_role=false`,
        [shiftboardId]
      );

      // 5. calculate total CSP
      const [dbCspList] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(stp.sap_points), 0) AS total_csp
        FROM op_volunteer_shifts vs
        JOIN op_shift_time_position stp ON vs.time_position_id=stp.time_position_id
        WHERE vs.shiftboard_id=?
        AND vs.remove_shift=false
        AND stp.remove_time_position=false`,
        [shiftboardId]
      );
      const totalCsp = Number(dbCspList[0]?.total_csp ?? 0);

      // 6. CSP per day
      const [dbDayCspList] = await pool.query<RowDataPacket[]>(
        `SELECT d.datename, COALESCE(SUM(stp.sap_points), 0) AS day_csp
        FROM op_volunteer_shifts vs
        JOIN op_shift_time_position stp ON vs.time_position_id=stp.time_position_id
        JOIN op_shift_times st ON stp.shift_times_id=st.shift_times_id
        JOIN op_dates d ON st.start_date_id=d.date_id
        WHERE vs.shiftboard_id=?
        AND vs.remove_shift=false
        AND stp.remove_time_position=false
        AND st.remove_shift_time=false
        GROUP BY d.datename`,
        [shiftboardId]
      );
      const dayCspMap: Record<string, number> = {};
      for (const row of dbDayCspList) {
        dayCspMap[row.datename] = Number(row.day_csp);
      }

      // 7. required trainings (derived from volunteer's shift positions)
      const [dbTrainingList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT t.training_id, t.training_name, t.url
        FROM op_volunteer_shifts vs
        JOIN op_shift_time_position stp ON vs.time_position_id=stp.time_position_id
        JOIN op_position_trainings pt ON stp.position_type_id=pt.position_type_id
        JOIN op_trainings t ON pt.training_id=t.training_id
        WHERE vs.shiftboard_id=?
        AND vs.remove_shift=false
        AND stp.remove_time_position=false
        AND pt.delete_position_training=false
        AND t.delete_training=false`,
        [shiftboardId]
      );

      // 8. volunteer shifts
      const [dbShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT d.datename, d.date, st.start_time, st.end_time,
          pt.position, stp.sap_points,
          sc.department
        FROM op_volunteer_shifts vs
        JOIN op_shift_time_position stp ON vs.time_position_id=stp.time_position_id
        JOIN op_shift_times st ON stp.shift_times_id=st.shift_times_id
        JOIN op_dates d ON st.start_date_id=d.date_id
        JOIN op_position_type pt ON stp.position_type_id=pt.position_type_id
        LEFT JOIN op_shift_name sn ON st.shift_name_id=sn.shift_name_id
        LEFT JOIN op_shift_category sc ON sn.shift_category_id=sc.shift_category_id
        WHERE vs.shiftboard_id=?
        AND vs.remove_shift=false
        AND stp.remove_time_position=false
        AND st.remove_shift_time=false
        AND pt.delete_position=false
        ORDER BY d.date, st.start_time`,
        [shiftboardId]
      );

      // 9. all dates (for arrival date dropdown)
      const [dbDateList] = await pool.query<RowDataPacket[]>(
        `SELECT date_id, datename, date
        FROM op_dates
        ORDER BY date`
      );

      // 10. compute SAP status
      const roleNames = dbRoleList.map((r) => r.role);
      const roleIdSet = new Set(dbRoleList.map((r) => r.role_id));

      const hasSapFile = dbSapList.length > 0;
      const isStaff = roleIdSet.has(ROLE_STAFF_ID);
      const hasOtherSap = roleIdSet.has(ROLE_OTHER_SAP_ID);
      const isPostOpening =
        arrivalDate !== null &&
        !PRE_OPEN_DATENAMES.includes(arrivalDate.datename);

      let bypass = false;
      let bypassReason: IResVolunteerInfo["sapStatus"]["bypassReason"] = null;

      if (hasSapFile) {
        bypass = true;
        bypassReason = "sap_issued";
      } else if (isStaff) {
        bypass = true;
        bypassReason = "staff";
      } else if (hasOtherSap) {
        bypass = true;
        bypassReason = "other_sap";
      } else if (isPostOpening) {
        bypass = true;
        bypassReason = "post_opening";
      }

      // compute day-by-day requirements (shared with the super-admin SAP page)
      const arrivalDatename = arrivalDate?.datename ?? "";
      const requiredDays: IResVolunteerInfo["sapStatus"]["requiredDays"] =
        buildRequiredDays(arrivalDatename, dayCspMap);

      const requiredCsp = 12;
      const cspFulfilled = totalCsp >= requiredCsp;

      const sapFile = hasSapFile
        ? {
            sapId: dbSapList[0].sap_id,
            filename: dbSapList[0].filename,
            datename: dbSapList[0].datename,
            date: dbSapList[0].date,
          }
        : null;

      // role-based thresholds
      const roleThresholds: IResVolunteerInfo["roleThresholds"] = dbRoleList
        .filter((r) => r.census_shift_points !== null)
        .map((r) => ({
          role: r.role,
          requiredCsp: r.census_shift_points,
          currentCsp: totalCsp,
          fulfilled: totalCsp >= r.census_shift_points,
        }));

      // training completion (check if volunteer has the training's role_id)
      const trainings: IResVolunteerInfo["trainings"] = dbTrainingList.map(
        (t) => {
          // look up the training's role_id from op_trainings
          // we need to check if the volunteer has that role
          return {
            trainingId: t.training_id,
            trainingName: t.training_name,
            url: t.url ?? "",
            completed: false, // will be set below
          };
        }
      );

      // fetch training role mappings to check completion
      if (dbTrainingList.length > 0) {
        const trainingIds = dbTrainingList.map((t) => t.training_id);
        const [dbTrainingRoles] = await pool.query<RowDataPacket[]>(
          `SELECT training_id, role_id
          FROM op_trainings
          WHERE training_id IN (${trainingIds.map(() => "?").join(",")})`,
          trainingIds
        );
        const trainingRoleMap = new Map<number, number>();
        for (const tr of dbTrainingRoles) {
          trainingRoleMap.set(tr.training_id, tr.role_id);
        }
        for (const t of trainings) {
          const roleId = trainingRoleMap.get(t.trainingId);
          if (roleId) {
            t.completed = roleIdSet.has(roleId);
          }
        }
      }

      const burnerProfileUpdated = roleIdSet.has(ROLE_BURNER_PROFILE_UPDATED_ID);
      const welcomeComplete = roleIdSet.has(ROLE_WELCOME_COMPLETE_ID);
      const behavioralStandardsSigned = roleIdSet.has(
        ROLE_BEHAVIORAL_STANDARDS_ID
      );
      // Strict (add_role=true AND remove_role=false) so the checkbox state
       // matches the queue's send-time filter in client/lib/mail/queue.ts
      // exactly. The bulk role-list query above is intentionally looser to
       // keep parity with the rest of this endpoint (other-sap, profile-updated,
       // behavioral-standards, etc.).
      const [dbUnsubRow] = await pool.query<RowDataPacket[]>(
        `SELECT 1
        FROM op_volunteer_roles
        WHERE shiftboard_id=?
          AND role_id=?
          AND add_role=true
          AND remove_role=false
        LIMIT 1`,
        [shiftboardId, ROLE_EMAIL_UNSUBSCRIBED_ID]
      );
      const emailUnsubscribed = dbUnsubRow.length > 0;

      // build response
      const resVolunteerInfo: IResVolunteerInfo = {
        volunteer: {
          shiftboardId: dbVolunteer.shiftboard_id,
          playaName: dbVolunteer.playa_name ?? "",
          worldName: dbVolunteer.world_name ?? "",
          email: dbVolunteer.email ?? "",
          location: dbVolunteer.location ?? "",
        },
        arrivalDate,
        sapStatus: {
          bypass,
          bypassReason,
          sapFile,
          totalCsp,
          requiredCsp,
          cspFulfilled,
          requiredDays,
        },
        roleThresholds,
        trainings,
        roles: roleNames,
        dates: dbDateList.map((d) => ({
          dateId: d.date_id,
          datename: d.datename,
          date: d.date,
        })),
        shifts: dbShiftList.map((s) => ({
          datename: s.datename,
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          position: s.position,
          department: s.department ?? "",
          csp: s.sap_points ?? 0,
        })),
        burnerProfileUpdated,
        welcomeComplete,
        behavioralStandardsSigned,
        emailUnsubscribed,
      };

      return res.status(200).json(resVolunteerInfo);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      const { arrivalDateId, location }: IReqVolunteerInfoUpdate = JSON.parse(
        req.body
      );

      if (arrivalDateId !== undefined) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteers
          SET arrival_date_id=?, update_volunteer=true
          WHERE shiftboard_id=?`,
          [arrivalDateId, shiftboardId]
        );
      }

      if (location !== undefined) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteers
          SET location=?, update_volunteer=true
          WHERE shiftboard_id=?`,
          [location, shiftboardId]
        );
      }

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(volunteerInfo);
