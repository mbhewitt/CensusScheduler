import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";
import { notifyAssignment } from "@/components/api/assignmentNotify";
import {
  checkCheckInAuthorized,
  shiftVolunteerRemove,
  shiftVolunteerUpdate,
} from "@/components/api/shiftVolunteers";
import { ROLE_PEERS_COORDINATOR_ID, UPDATE_TYPE_CHECK_IN } from "@/constants";

// PEERS #overlap: a volunteer may not hold a Squaddie shift and a Shift
// Lead shift that overlap by more than this many minutes. Coordinator
// shifts (PCIO / PCOC) are exempt — one person can fill a coordinator
// role alongside another shift. A small edge overlap (shift handoff) is
// allowed; only the "bulk overlaps" case is blocked.
const SHIFT_OVERLAP_LIMIT_MINUTES = 60;

const shiftVolunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all shift volunteers
      const { timeId } = req.query;
      // Include canceled shifts in the detail response — the page
      // shows them with a banner and disables Add, but volunteers
      // still need to reach the page so they can self-remove and
      // admins can flip the canceled state back via Update Time.
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          d.date,
          d.datename,
          pt.position_details,
          pt.position,
          pt.prerequisite_id,
          pt.role_id,
          sn.shift_details,
          sn.shift_name,
          st.canceled,
          st.end_time,
          st.end_time_text,
          st.meal,
          st.notes,
          st.start_time,
          st.start_time_text,
          stp.position_type_id,
          stp.sap_points,
          stp.slots,
          stp.time_position_id
        FROM op_shift_times AS st
        LEFT JOIN op_dates AS d
        ON d.date_id=st.start_date_id
        JOIN op_shift_name AS sn
        ON sn.delete_shift=false
        AND sn.shift_name_id=st.shift_name_id
        JOIN op_shift_time_position AS stp
        ON stp.remove_time_position=false
        AND stp.shift_times_id=st.shift_times_id
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=stp.position_type_id
        WHERE st.remove_shift_time=false
        AND st.shift_times_id=?
        ORDER BY pt.position COLLATE utf8mb4_general_ci`,
        [timeId]
      );
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.position,
          stp.position_type_id,
          v.playa_name,
          v.world_name,
          vs.noshow,
          vs.notes,
          vs.rating,
          vs.shiftboard_id,
          vs.time_position_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.remove_time_position=false
        AND stp.time_position_id=vs.time_position_id
        AND stp.shift_times_id=?
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=stp.position_type_id
        JOIN op_volunteers AS v
        ON v.delete_volunteer=false
        AND v.shiftboard_id=vs.shiftboard_id
        WHERE vs.remove_shift=false
        ORDER BY
          v.playa_name COLLATE utf8mb4_general_ci,
          v.world_name COLLATE utf8mb4_general_ci`,
        [timeId]
      );
      const [resShiftPositionFirst] = dbShiftPositionList;
      const resShiftPositionList = dbShiftPositionList.map(
        ({
          position_details,
          position_type_id,
          position,
          prerequisite_id,
          role_id,
          sap_points,
          slots,
          time_position_id,
        }) => {
          const resShiftPositionItem: IResShiftPositionCountItem = {
            csp: Number(sap_points ?? 0),
            positionDetails: position_details,
            positionId: position_type_id,
            positionName: position,
            prerequisiteId: prerequisite_id ?? 0,
            roleRequiredId: role_id ?? 0,
            slotsFilled: 0,
            slotsTotal: slots,
            timePositionId: time_position_id,
          };

          return resShiftPositionItem;
        }
      );
      const resShiftVolunteerList = dbShiftVolunteerList.map(
        ({
          noshow,
          notes,
          playa_name,
          position,
          rating,
          shiftboard_id,
          time_position_id,
          world_name,
        }) => {
          const resShiftVolunteerItem: IResShiftVolunteerRowItem = {
            isCheckedIn: noshow,
            notes: notes ?? "",
            playaName: playa_name,
            positionName: position,
            rating,
            shiftboardId: shiftboard_id,
            timePositionId: time_position_id,
            worldName: world_name,
          };
          return resShiftVolunteerItem;
        }
      );

      resShiftVolunteerList.forEach((shiftVolunteerItem) => {
        const positionFound = resShiftPositionList.find(
          (resShiftPositionItem) =>
            resShiftPositionItem.timePositionId ===
            shiftVolunteerItem.timePositionId
        );
        if (positionFound) positionFound.slotsFilled += 1;
      });

      const resShiftVolunteerDetails: IResShiftVolunteerInformation = {
        positionList: resShiftPositionList,
        shift: {
          canceled: Boolean(resShiftPositionFirst.canceled),
          date: resShiftPositionFirst.date,
          dateName: resShiftPositionFirst.datename ?? "",
          details: resShiftPositionFirst.shift_details,
          endTime: resShiftPositionFirst.end_time ?? resShiftPositionFirst.end_time_text,
          meal: resShiftPositionFirst.meal,
          notes: resShiftPositionFirst.notes,
          startTime: resShiftPositionFirst.start_time ?? resShiftPositionFirst.start_time_text,
          typeName: resShiftPositionFirst.shift_name,
        },
        volunteerList: resShiftVolunteerList,
      };

      return res.status(200).json(resShiftVolunteerDetails);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // add volunteer to shift
      const { noShow, shiftboardId, timePositionId }: IReqShiftVolunteerItem =
        JSON.parse(req.body);

      // Block adds on canceled shifts. Server-side enforcement —
      // the UI hides the Add button but a stale tab / forged request
      // would still reach this handler. Self-removes (DELETE) are
      // intentionally NOT blocked: an already-assigned volunteer
      // can still drop themselves and trigger the cancellation .ics.
      const [dbShiftCanceledCheck] = await pool.query<RowDataPacket[]>(
        `SELECT st.canceled
         FROM op_shift_time_position stp
         JOIN op_shift_times st ON st.shift_times_id = stp.shift_times_id
         WHERE stp.time_position_id = ?
         LIMIT 1`,
        [timePositionId]
      );
      if (dbShiftCanceledCheck[0]?.canceled) {
        return res.status(409).json({
          statusCode: 409,
          message: "Shift is canceled; cannot add volunteers.",
        });
      }

      // PEERS #overlap: block claiming a Squaddie/Shift Lead shift that
      // overlaps a shift of the OTHER type the volunteer already holds by
      // more than SHIFT_OVERLAP_LIMIT_MINUTES. Coordinator shifts (role
      // 95209) are exempt on both sides. Overlap is computed in SQL from
      // the naive playa-local datetime strings (both cast the same way, so
      // the minute delta is correct regardless of timezone). Enforced
      // server-side so a stale tab / forged request can't bypass it.
      const [dbShiftOverlapCheck] = await pool.query<RowDataPacket[]>(
        `SELECT
          existingPt.position AS conflictPosition,
          existingSt.start_time AS conflictStart,
          existingSt.end_time AS conflictEnd,
          TIMESTAMPDIFF(
            MINUTE,
            GREATEST(
              CAST(claimedSt.start_time AS DATETIME),
              CAST(existingSt.start_time AS DATETIME)
            ),
            LEAST(
              CAST(claimedSt.end_time AS DATETIME),
              CAST(existingSt.end_time AS DATETIME)
            )
          ) AS overlapMinutes
        FROM op_shift_time_position AS claimedStp
        JOIN op_shift_times AS claimedSt
          ON claimedSt.shift_times_id = claimedStp.shift_times_id
        JOIN op_position_type AS claimedPt
          ON claimedPt.position_type_id = claimedStp.position_type_id
        JOIN op_volunteer_shifts AS vs
          ON vs.shiftboard_id = ? AND vs.remove_shift = false
        JOIN op_shift_time_position AS existingStp
          ON existingStp.time_position_id = vs.time_position_id
        JOIN op_position_type AS existingPt
          ON existingPt.position_type_id = existingStp.position_type_id
        JOIN op_shift_times AS existingSt
          ON existingSt.shift_times_id = existingStp.shift_times_id
        WHERE claimedStp.time_position_id = ?
          AND claimedPt.role_id <> ?
          AND existingPt.role_id <> ?
          AND claimedPt.role_id <> existingPt.role_id
          AND existingStp.time_position_id <> claimedStp.time_position_id
        HAVING overlapMinutes > ?
        ORDER BY overlapMinutes DESC
        LIMIT 1`,
        [
          shiftboardId,
          timePositionId,
          ROLE_PEERS_COORDINATOR_ID,
          ROLE_PEERS_COORDINATOR_ID,
          SHIFT_OVERLAP_LIMIT_MINUTES,
        ]
      );
      if (dbShiftOverlapCheck[0]) {
        const { conflictPosition } = dbShiftOverlapCheck[0];
        return res.status(409).json({
          statusCode: 409,
          message:
            `This shift overlaps "${conflictPosition}" — which this ` +
            `volunteer already holds — by more than ` +
            `${SHIFT_OVERLAP_LIMIT_MINUTES} minutes. A Squaddie shift and ` +
            `a Shift Lead shift can't overlap by more than an hour. Drop ` +
            `the conflicting shift first, or pick a shift that doesn't ` +
            `overlap it.`,
        });
      }

      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_shifts
        WHERE shiftboard_id=?
        AND time_position_id=?`,
        [shiftboardId, timePositionId]
      );
      const [dbShiftVolunteerFirst] = dbShiftVolunteerList;

      // if volunteer exists in shift already
      // then update add_shift and remove_shift fields
      if (dbShiftVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_shifts
          SET
            noshow=?,
            add_shift=true,
            remove_shift=false
          WHERE shiftboard_id=?
          AND time_position_id=?`,
          [noShow, shiftboardId, timePositionId]
        );
        // else insert them into the table
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_shifts (
            add_shift,
            noshow,
            shiftboard_id,
            time_position_id
          )
          VALUES (true, ?, ?, ?)`,
          [noShow, shiftboardId, timePositionId]
        );
      }

      // #309: notify the assigned volunteer with the shift details
      // and an .ics calendar attachment. Best-effort — a notify
      // failure doesn't fail the assignment itself.
      try {
        await notifyAssignment(
          pool,
          shiftboardId,
          timePositionId,
          session.shiftboardId
        );
      } catch (err) {
        console.error(
          `[assign-notify] notifyAssignment failed for shiftboard_id=${shiftboardId} time_position_id=${timePositionId}:`,
          err
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // check volunteer into shift. Coordinator-page check-in is
      // role/time gated server-side (see checkCheckInAuthorized);
      // review updates fall through unchanged.
      const patchBody = JSON.parse(req.body);
      if (patchBody.updateType === UPDATE_TYPE_CHECK_IN) {
        const auth = await checkCheckInAuthorized(
          pool,
          session,
          patchBody.timePositionId
        );
        if (!auth.ok) {
          return res
            .status(auth.status)
            .json({ statusCode: auth.status, message: auth.message });
        }
      }
      return shiftVolunteerUpdate(pool, req, res);
    }

    // delete
    // ------------------------------------------------------------
    case "DELETE": {
      // remove volunteer from shift
      return shiftVolunteerRemove(pool, req, res, session);
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

// Hotfix 2026-05-06: this endpoint exposes volunteer playa + world names
// per shift. Wrapped in withAuth so unauth requests get 401 and forged
// cookies are rejected by HMAC verification.
export default withAuth(shiftVolunteers);
