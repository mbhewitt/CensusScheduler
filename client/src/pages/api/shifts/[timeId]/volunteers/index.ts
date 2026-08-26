import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import {
  CHECK_IN_WINDOW_AFTER_MIN,
  CHECK_IN_WINDOW_BEFORE_MIN,
  UPDATE_TYPE_CHECK_IN,
} from "@/constants";
import { isAdmin } from "@/lib/authz";
import { isProvisionedDevice } from "@/lib/device";
import { isOnPlayaRequest } from "@/lib/onPlaya";
import { readSessionFromCookies } from "@/lib/session";
import { pool } from "lib/database";
import { notifyAssignment } from "@/components/api/assignmentNotify";
import { autoSetArrival } from "@/components/api/arrivalAutoSet";
import {
  shiftVolunteerRemove,
  shiftVolunteerUpdate,
} from "@/components/api/shiftVolunteers";

// On-playa (walk-up) mode lets whoever is running the shift check people in and
// add volunteers without an admin login. Off-playa (cloud) those are admin-only.
// On-playa is the build flag OR a request from a provisioned tablet — so a
// cloud/prod tablet at the lab gets the walk-up behavior (isOnPlayaRequest).

const shiftVolunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const isOnPlaya = isOnPlayaRequest(req.cookies);

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
          COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
          pt.prerequisite_id,
          pt.role_id,
          pt.max_per_volunteer,
          pt.min_scheduled_csp,
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
        ORDER BY
          CASE
            WHEN pt.\`lead\`=1 THEN 0
            WHEN pt.critical=1 THEN 1
            ELSE 2
          END,
          pt.position COLLATE utf8mb4_general_ci`,
        [timeId]
      );
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
          pt.critical,
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
          CASE
            WHEN pt.\`lead\`=1 THEN 0
            WHEN pt.critical=1 THEN 1
            ELSE 2
          END,
          v.playa_name COLLATE utf8mb4_general_ci,
          v.world_name COLLATE utf8mb4_general_ci`,
        [timeId]
      );
      const [resShiftPositionFirst] = dbShiftPositionList;
      // A shift with no position rows (unknown/removed timeId) has no metadata
      // to return — respond 404 rather than dereferencing undefined and 500ing.
      if (!resShiftPositionFirst) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Shift not found." });
      }
      const resShiftPositionList = dbShiftPositionList.map(
        ({
          max_per_volunteer,
          min_scheduled_csp,
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
            maxPerVolunteer:
              max_per_volunteer == null ? null : Number(max_per_volunteer),
            minScheduledCsp:
              min_scheduled_csp == null ? null : Number(min_scheduled_csp),
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
          critical,
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
            critical: Boolean(critical),
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

      // Off-playa: adding *another* volunteer is admin-only (walk-up adds are
      // an on-playa affordance). Authenticated self-signup stays open.
      if (
        !isOnPlaya &&
        shiftboardId !== session.shiftboardId &&
        !(await isAdmin(session.shiftboardId))
      ) {
        return res.status(403).json({
          statusCode: 403,
          message: "Adding another volunteer is restricted to admins.",
        });
      }

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
            remove_shift=false,
            removed_at=NULL,
            signed_up_at=NOW()
          WHERE shiftboard_id=?
          AND time_position_id=?`,
          [noShow, shiftboardId, timePositionId]
        );
        // else insert them into the table
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_shifts (
            add_shift,
            signed_up_at,
            noshow,
            shiftboard_id,
            time_position_id
          )
          VALUES (true, NOW(), ?, ?, ?)`,
          [noShow, shiftboardId, timePositionId]
        );
      }

      // Auto-set arrival date from this (possibly SAP-eligible) signup so the
      // SAP fires without the volunteer having to fill the arrival form.
      // Best-effort — a failure here must not fail the assignment.
      try {
        await autoSetArrival(pool, shiftboardId);
      } catch (err) {
        console.error(
          `[arrival-auto-set] autoSetArrival failed for shiftboard_id=${shiftboardId}:`,
          err
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
      // Off-playa: checking a volunteer in (and review) is admin-only.
      if (!isOnPlaya && !(await isAdmin(session.shiftboardId))) {
        return res.status(403).json({
          statusCode: 403,
          message: "Check-in is restricted to admins.",
        });
      }
      // check volunteer into shift
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

// No-login walk-up check-in is only allowed inside [start - BEFORE, start +
// AFTER] of the shift START. Keyed to the time-position actually being mutated
// (the request body's timePositionId), NOT the URL timeId — otherwise a device
// could point the URL at any in-window shift and flip check-in on an unrelated
// position. Evaluated in the DB (NOW() vs start_time) so it's consistent with
// however shift times are stored — no app-vs-DB timezone skew.
const isCheckInWindowOpenForPosition = async (
  timePositionId: number | undefined
): Promise<boolean> => {
  if (typeof timePositionId !== "number" || !Number.isFinite(timePositionId)) {
    return false;
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT (NOW() BETWEEN
        DATE_SUB(st.start_time, INTERVAL ? MINUTE)
        AND DATE_ADD(st.start_time, INTERVAL ? MINUTE)) AS is_open
     FROM op_shift_time_position AS stp
     JOIN op_shift_times AS st
       ON st.shift_times_id = stp.shift_times_id
       AND st.remove_shift_time = false
     WHERE stp.time_position_id = ? AND stp.remove_time_position = false
     LIMIT 1`,
    [CHECK_IN_WINDOW_BEFORE_MIN, CHECK_IN_WINDOW_AFTER_MIN, timePositionId]
  );
  return Boolean(rows[0]?.is_open);
};

// Auth for this endpoint (exposes volunteer playa + world names per shift):
//   - a valid session → full behavior (all methods).
//   - NO session but a valid provisioned-device cookie (a lab tablet) → may
//     VIEW a shift (GET) and CHECK PEOPLE IN (PATCH), the latter only inside the
//     walk-up window above. POST/DELETE still require a real login. This is the
//     "no-login walk-up check-in" per Mew 2026-08-26 (option B). Both the
//     session and the device cookie are HMAC-verified, so forged cookies fail.
// Non-positive so it can never collide with a real shiftboard_id or the
// "unfilled" sentinel (0) — a guest actor must never pass an owner/admin check.
const GUEST_SESSION = { shiftboardId: -1 };

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = readSessionFromCookies(req.cookies);
  if (session) {
    return shiftVolunteers(req, res, session);
  }
  if (!isProvisionedDevice(req.cookies)) {
    return res
      .status(401)
      .json({ statusCode: 401, message: "Authentication required" });
  }
  if (req.method === "GET") {
    return shiftVolunteers(req, res, GUEST_SESSION);
  }
  if (req.method === "PATCH") {
    // Parse the body ourselves so the guest gate keys off the ACTUAL mutation
    // target/type, not the URL. (shiftVolunteerUpdate re-parses req.body.)
    let body: { updateType?: string; timePositionId?: number } = {};
    try {
      body = JSON.parse(req.body);
    } catch {
      /* malformed body → treated as not-a-check-in below */
    }
    // A no-login device may ONLY check people in — not write admin reviews
    // (ratings/notes), which share this PATCH route via updateType.
    if (body.updateType !== UPDATE_TYPE_CHECK_IN) {
      return res.status(403).json({
        statusCode: 403,
        message: "Only check-in is allowed without signing in.",
      });
    }
    if (!(await isCheckInWindowOpenForPosition(body.timePositionId))) {
      return res.status(403).json({
        statusCode: 403,
        message: `Check-in is open from ${CHECK_IN_WINDOW_BEFORE_MIN} minutes before to ${CHECK_IN_WINDOW_AFTER_MIN} minutes after the shift starts.`,
      });
    }
    return shiftVolunteers(req, res, GUEST_SESSION);
  }
  return res
    .status(401)
    .json({ statusCode: 401, message: "Please sign in to do that." });
};

export default handler;
