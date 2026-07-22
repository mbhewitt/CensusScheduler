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
import {
  ROLE_ADMIN_ID,
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_PEERS_SQUADDIE_ID,
  ROLE_SUPER_ADMIN_ID,
  UPDATE_TYPE_CHECK_IN,
} from "@/constants";

// PEERS #overlap: a volunteer may not hold a Squaddie shift and a Shift
// Lead shift that overlap by more than this many minutes. Coordinator
// shifts (PCIO / PCOC) are exempt — one person can fill a coordinator
// role alongside another shift. A small edge overlap (shift handoff) is
// allowed; only the "bulk overlaps" case is blocked.
const SHIFT_OVERLAP_LIMIT_MINUTES = 60;

// PEERS #backtoback: a volunteer may hold at most two CONSECUTIVE shifts
// — never three in a row. This is type-agnostic: Squaddie and Shift Lead
// shifts chain together (a Lead shift followed by two back-to-back
// Squaddie shifts is still three in a row). Two shifts count as
// "consecutive" when they either overlap by up to OVERLAP minutes OR the
// next starts within GAP minutes of the previous ending. The day's shift
// slots are spaced with breaks of up to 60 min (e.g. the Squaddie
// 15:30–18:30 → 19:30–22:30 handoff), and those still count as
// consecutive; only a longer break (the gap to a later block, or the next
// day) resets the chain. Coordinators are exempt.
const BACK_TO_BACK_MAX_RUN = 2;
const BACK_TO_BACK_GAP_MINUTES = 60;
const BACK_TO_BACK_OVERLAP_MINUTES = 60;

// PEERS #dailycap: separate from the consecutive rule, a volunteer may
// hold at most this many non-Coordinator shifts (Squaddie + Shift Lead
// combined) on any single day. Coordinators are exempt and uncounted.
const MAX_SHIFTS_PER_DAY = 3;

// The calendar day of a shift = the date portion of its playa-local start
// ("2026-08-31 12:00" -> "2026-08-31").
const shiftDay = (value: string): string => `${value}`.slice(0, 10);

// Parse a naive playa-local datetime string ("2026-08-31 12:00") to epoch
// minutes. Both endpoints are parsed identically, so the delta is correct
// regardless of the server timezone.
const shiftTimeToMinutes = (value: string): number =>
  new Date(`${value}`.replace(" ", "T")).getTime() / 60000;

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

      // PEERS #backtoback: block a claim that would create three (or more)
      // consecutive shifts. This is TYPE-AGNOSTIC — Squaddie and Shift Lead
      // shifts are counted together (a Lead shift immediately followed by
      // two back-to-back Squaddie shifts is still three in a row). Only the
      // claimed shift must be Squaddie/Lead to trigger the check; both it
      // and the held shifts it chains with exclude Coordinators, which are
      // exempt. Enforced server-side alongside the cross-type overlap rule.
      const [dbClaimedShiftRows] = await pool.query<RowDataPacket[]>(
        `SELECT pt.role_id, st.start_time, st.end_time
         FROM op_shift_time_position stp
         JOIN op_position_type pt ON pt.position_type_id = stp.position_type_id
         JOIN op_shift_times st ON st.shift_times_id = stp.shift_times_id
         WHERE stp.time_position_id = ?
         LIMIT 1`,
        [timePositionId]
      );
      const claimedShift = dbClaimedShiftRows[0];
      if (
        claimedShift &&
        (claimedShift.role_id === ROLE_PEERS_SQUADDIE_ID ||
          claimedShift.role_id === ROLE_PEERS_SHIFT_LEAD_ID)
      ) {
        // all OTHER non-Coordinator shifts the volunteer already holds
        const [dbChainableShifts] = await pool.query<RowDataPacket[]>(
          `SELECT st.start_time, st.end_time
           FROM op_volunteer_shifts vs
           JOIN op_shift_time_position stp
             ON stp.time_position_id = vs.time_position_id
           JOIN op_position_type pt
             ON pt.position_type_id = stp.position_type_id
           JOIN op_shift_times st
             ON st.shift_times_id = stp.shift_times_id
           WHERE vs.shiftboard_id = ?
             AND vs.remove_shift = false
             AND pt.role_id <> ?
             AND vs.time_position_id <> ?`,
          [shiftboardId, ROLE_PEERS_COORDINATOR_ID, timePositionId]
        );

        // The consecutive check runs BEFORE the daily cap so that when a
        // claim trips both (e.g. a 4th shift that also completes a 3-in-a-
        // row), the user sees the "no 3 consecutive" message rather than
        // the raw per-day count.
        //
        // combine held non-Coordinator shifts + the claimed one, sort by
        // start, then find the maximal run of back-to-back shifts that
        // includes the claim. Block if that run reaches three.
        const shiftRun = [
          {
            start: shiftTimeToMinutes(claimedShift.start_time),
            end: shiftTimeToMinutes(claimedShift.end_time),
            isClaimed: true,
          },
          ...dbChainableShifts.map((shift) => ({
            start: shiftTimeToMinutes(shift.start_time),
            end: shiftTimeToMinutes(shift.end_time),
            isClaimed: false,
          })),
        ].sort((a, b) => a.start - b.start);

        // adjacent = overlap up to OVERLAP min, or gap up to GAP min
        const isBackToBack = (
          earlier: { end: number },
          later: { start: number }
        ): boolean => {
          const gap = later.start - earlier.end;
          return gap <= BACK_TO_BACK_GAP_MINUTES &&
            gap >= -BACK_TO_BACK_OVERLAP_MINUTES;
        };

        let runStart = 0;
        let wouldChainThree = false;
        for (let i = 1; i <= shiftRun.length; i += 1) {
          const isBreak =
            i === shiftRun.length ||
            !isBackToBack(shiftRun[i - 1], shiftRun[i]);
          if (isBreak) {
            const run = shiftRun.slice(runStart, i);
            if (
              run.length > BACK_TO_BACK_MAX_RUN &&
              run.some((shift) => shift.isClaimed)
            ) {
              wouldChainThree = true;
              break;
            }
            runStart = i;
          }
        }
        if (wouldChainThree) {
          return res.status(409).json({
            statusCode: 409,
            message:
              `A volunteer can only hold two consecutive shifts per day, ` +
              `and this one makes 3 shifts in a row. Drop one of your two ` +
              `back to back shifts if you need to swap or pick a ` +
              `non-consecutive shift if you want 3 shifts for the day.`,
          });
        }

        // PEERS #dailycap: cap total non-Coordinator shifts per day. This
        // runs after the consecutive check, so it only fires for a 4th
        // same-day shift that is NOT itself part of a 3-in-a-row (e.g. on
        // a mixed Squaddie/Lead day with enough spacing).
        const claimedDay = shiftDay(claimedShift.start_time);
        const sameDayHeldCount = dbChainableShifts.filter(
          (shift) => shiftDay(shift.start_time) === claimedDay
        ).length;
        if (sameDayHeldCount >= MAX_SHIFTS_PER_DAY) {
          return res.status(409).json({
            statusCode: 409,
            message:
              `A volunteer can hold at most ${MAX_SHIFTS_PER_DAY} shifts ` +
              `per day, and this one would be number ` +
              `${sameDayHeldCount + 1}. Drop one of that day's shifts ` +
              `first if you need to swap.`,
          });
        }
      }

      // PEERS #capacity: the requester's roles (by their authenticated
      // shiftboard id) — admins/superadmins may intentionally overbook (the
      // UI asks them to confirm first), so they're exempt from the cap below.
      const [dbRequesterRoleRows] = await pool.query<RowDataPacket[]>(
        `SELECT role_id FROM op_volunteer_roles WHERE shiftboard_id = ?`,
        [session.shiftboardId]
      );
      const requesterRoleIds = new Set(
        dbRequesterRoleRows.map((row) => Number(row.role_id))
      );
      const isRequesterAdmin =
        requesterRoleIds.has(ROLE_ADMIN_ID) ||
        requesterRoleIds.has(ROLE_SUPER_ADMIN_ID);

      // PEERS #capacity: block a claim that would exceed the position's slot
      // count. Race-safe: the slot count and the insert run in one
      // transaction with the position row locked FOR UPDATE, so two
      // volunteers claiming the last slot at the same instant can't both
      // slip through. Enforced server-side so a stale tab / forged request
      // can't overbook either; the client only greys out full positions.
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Lock the position row so concurrent claims serialize here.
        const [dbPositionRows] = await connection.query<RowDataPacket[]>(
          `SELECT slots FROM op_shift_time_position
           WHERE time_position_id = ?
           FOR UPDATE`,
          [timePositionId]
        );
        const slotsTotal = Number(dbPositionRows[0]?.slots ?? 0);

        const [dbShiftVolunteerList] = await connection.query<RowDataPacket[]>(
          `SELECT remove_shift
          FROM op_volunteer_shifts
          WHERE shiftboard_id=?
          AND time_position_id=?`,
          [shiftboardId, timePositionId]
        );
        const [dbShiftVolunteerFirst] = dbShiftVolunteerList;
        // A previously-removed (remove_shift=true) row is re-activated below
        // and DOES reclaim a slot, so only an already-ACTIVE row is exempt.
        const isAlreadyActive =
          dbShiftVolunteerFirst && !dbShiftVolunteerFirst.remove_shift;

        if (!isAlreadyActive && !isRequesterAdmin) {
          const [dbFilledRows] = await connection.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS filled
             FROM op_volunteer_shifts
             WHERE time_position_id=?
             AND remove_shift=false`,
            [timePositionId]
          );
          const slotsFilled = Number(dbFilledRows[0]?.filled ?? 0);
          if (slotsFilled >= slotsTotal) {
            await connection.rollback();
            return res.status(409).json({
              statusCode: 409,
              message: "This position is already full.",
            });
          }
        }

        // if volunteer exists in shift already
        // then update add_shift and remove_shift fields
        if (dbShiftVolunteerFirst) {
          await connection.query<RowDataPacket[]>(
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
          await connection.query<RowDataPacket[]>(
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

        await connection.commit();
      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
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
