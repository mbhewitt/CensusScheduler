import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import type { Server as IOServer } from "socket.io";

import {
  ADD_SHIFT_VOLUNTEER_RES,
  CHECK_IN_WINDOW_AFTER_MIN,
  CHECK_IN_WINDOW_BEFORE_MIN,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  UPDATE_TYPE_CHECK_IN,
} from "@/constants";
import { extractActingAsToken } from "@/lib/actingAs";
import { isAdmin } from "@/lib/authz";
import { isProvisionedDevice } from "@/lib/device";
import { isOnPlayaRequest } from "@/lib/onPlaya";
import { readSessionFromRequest } from "@/lib/session";
import { pool } from "lib/database";
import { notifyAssignment } from "@/components/api/assignmentNotify";
import { autoSetArrival } from "@/components/api/arrivalAutoSet";
import {
  checkShiftAdd,
  type IShiftAddCheck,
} from "@/components/api/shiftAddRules";
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
      // Behavioral Standards status and reviews are admin-only (#632, #852):
      // everyone else gets bsSigned=true (renders as nothing) and no
      // rating/notes. Only admins see or write reviews in the roster UI.
      const sessionGet = await readSessionFromRequest(req);
      const isAdminViewer = sessionGet
        ? await isAdmin(sessionGet.shiftboardId)
        : false;
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
          vs.time_position_id,
          EXISTS(
            SELECT 1
            FROM op_volunteer_roles AS bs
            WHERE bs.shiftboard_id=vs.shiftboard_id
            AND bs.role_id=?
            AND bs.remove_role=false
          ) AS bs_signed
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
        [ROLE_BEHAVIORAL_STANDARDS_ID, timeId]
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
          bs_signed,
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
            bsSigned: !isAdminViewer || Boolean(bs_signed),
            critical: Boolean(critical),
            isCheckedIn: noshow,
            notes: isAdminViewer ? (notes ?? "") : "",
            playaName: playa_name,
            positionName: position,
            rating: isAdminViewer ? rating : null,
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
          endTime:
            resShiftPositionFirst.end_time ??
            resShiftPositionFirst.end_time_text,
          meal: resShiftPositionFirst.meal,
          notes: resShiftPositionFirst.notes,
          startTime:
            resShiftPositionFirst.start_time ??
            resShiftPositionFirst.start_time_text,
          typeName: resShiftPositionFirst.shift_name,
        },
        volunteerList: resShiftVolunteerList,
      };

      return res.status(200).json(resShiftVolunteerDetails);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // add volunteer to shift. Every rule lives in checkShiftAdd (C-863 A2),
      // shared with …/volunteers/preflight; noShow comes from the server
      // clock, never the body.
      const body: IReqShiftVolunteerItem = JSON.parse(req.body);
      const shiftboardId = Number(body.shiftboardId);
      const timePositionId = Number(body.timePositionId);
      if (
        !Number.isInteger(shiftboardId) ||
        shiftboardId <= 0 ||
        !Number.isInteger(timePositionId) ||
        timePositionId <= 0
      ) {
        return res.status(400).json({ statusCode: 400, message: "Bad ids" });
      }
      const viaPumpkin = Boolean(
        extractActingAsToken(req.headers.authorization)
      );

      // Capacity lock: lock the position row FIRST (so the count below reads
      // after any racing add has committed), then check, then write.
      // ponytail: per-position lock; two adds of the SAME person into two
      // different overlapping shifts can still race. Named lock per person if
      // that ever shows up.
      const conn = await pool.getConnection();
      let check: IShiftAddCheck;
      try {
        await conn.beginTransaction();
        await conn.query(
          `SELECT time_position_id
           FROM op_shift_time_position
           WHERE time_position_id=?
           FOR UPDATE`,
          [timePositionId]
        );
        check = await checkShiftAdd(conn, {
          actorShiftboardId: session.shiftboardId,
          isOnPlaya,
          shiftboardId,
          timePositionId,
        });
        if (check.notFound || check.blockers.length) {
          await conn.rollback();
          if (check.notFound) {
            return res.status(404).json({
              statusCode: 404,
              message: `Unknown ${check.notFound}.`,
            });
          }
          const [blocker] = check.blockers;
          const statusCode = blocker.code === "canceled" ? 409 : 403;
          return res.status(statusCode).json({
            statusCode,
            message: blocker.message,
            blockers: check.blockers,
            warnings: check.warnings,
          });
        }

        // re-add flips the old row back on; otherwise insert
        await conn.query(
          `INSERT INTO op_volunteer_shifts (
            add_shift,
            signed_up_at,
            noshow,
            shiftboard_id,
            time_position_id
          )
          VALUES (true, NOW(), ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            noshow=VALUES(noshow),
            add_shift=true,
            remove_shift=false,
            removed_at=NULL,
            signed_up_at=NOW()`,
          [check.noShow, shiftboardId, timePositionId]
        );
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }

      // Side effects are best-effort, but a failure is reported back in
      // warnings[] (A4) so callers can say "added, but …" instead of success.
      const warnings = [...check.warnings];

      // Auto-set arrival date from this (possibly SAP-eligible) signup so the
      // SAP fires without the volunteer having to fill the arrival form.
      try {
        await autoSetArrival(pool, shiftboardId);
      } catch (err) {
        console.error(
          `[arrival-auto-set] autoSetArrival failed for shiftboard_id=${shiftboardId}:`,
          err
        );
        warnings.push("Added, but the arrival date could not be set.");
      }

      // #309: notify the assigned volunteer with the shift details
      // and an .ics calendar attachment.
      try {
        await notifyAssignment(
          pool,
          shiftboardId,
          timePositionId,
          session.shiftboardId,
          viaPumpkin
        );
      } catch (err) {
        console.error(
          `[assign-notify] notifyAssignment failed for shiftboard_id=${shiftboardId} time_position_id=${timePositionId}:`,
          err
        );
        warnings.push("Added, but the assignment email could not be queued.");
      }

      // Live refresh for open shift pages, emitted here so every caller
      // (dialog, pumpkin) gets it. No io yet = no page has connected.
      (
        res.socket as unknown as { server?: { io?: IOServer } }
      ).server?.io?.emit(ADD_SHIFT_VOLUNTEER_RES, {
        // placeholder; clients revalidate right after (true = show nothing)
        bsSigned: true,
        isCheckedIn: check.noShow,
        notes: "",
        playaName: check.playaName,
        positionName: check.positionName,
        rating: null,
        shiftboardId,
        timeId: check.shiftTimesId,
        timePositionId,
        worldName: check.worldName,
      });

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
        warnings,
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // check volunteer into shift (off-playa admin guard lives in the helper)
      return shiftVolunteerUpdate(pool, req, res, session);
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
// position. Shift times are stored playa-local (America/Los_Angeles) but the DB
// runs in UTC, so compare against CONVERT_TZ(NOW(),...) — a raw NOW() would skew
// the window by the UTC offset (~7h) and reject valid check-ins.
const isCheckInWindowOpenForPosition = async (
  timePositionId: number | undefined
): Promise<boolean> => {
  if (typeof timePositionId !== "number" || !Number.isFinite(timePositionId)) {
    return false;
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT (CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles') BETWEEN
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
  const session = await readSessionFromRequest(req);
  if (session) {
    return shiftVolunteers(req, res, session);
  }
  // A pumpkin Bearer that failed verification never falls back to the guest
  // (device-cookie) path.
  if (
    extractActingAsToken(req.headers.authorization) ||
    !isProvisionedDevice(req.cookies)
  ) {
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
