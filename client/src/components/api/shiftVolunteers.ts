import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqReviewValues, IReqSwitchValues } from "@/components/types";
import {
  ROLE_ADMIN_ID,
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_SUPER_ADMIN_ID,
  SHIFT_DURING,
  SHIFT_PAST,
  UPDATE_TYPE_CHECK_IN,
  UPDATE_TYPE_REVIEW,
} from "@/constants";
import { getCheckInType } from "@/utils/getCheckInType";
import { enqueueEmail } from "lib/mail";
import {
  lookupActorDisplayName,
  notifyRemoval,
  type RemovalCause,
} from "@/components/api/assignmentNotify";

dayjs.extend(utc);
dayjs.extend(timezone);

// Shift start/end times are stored as naive playa-local strings
// (e.g. "2026-08-31 19:00"); interpret them in this zone so the
// window math is correct regardless of the server's own timezone.
const PLAYA_TZ = "America/Los_Angeles";

// #313 — when a volunteer (self) or admin removes someone from a
// position with `critical=1`, notify the VC list so they can move on
// refilling. The warning dialog from #308 (which would make the
// volunteer acknowledge the gap before a self-drop) is not built yet,
// so the email no longer claims a warning was shown (#402).
// Critical-drop alerts go to the PEERS inbox AND the coordinators list
// (papabear 2026-07-16). joinAddrs() renders the array as a comma-list.
const VC_LIST_EMAILS = [
  "peers@burningman.org",
  "peers-coordinators@burningman.org",
];
const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";

interface CriticalDropContext extends RowDataPacket {
  critical: number;
  position: string;
  datename: string | null;
  date: string;
  start_time_text: string | null;
  shift_times_id: number;
  playa_name: string | null;
  world_name: string | null;
}

async function notifyCriticalDrop(
  pool: Pool,
  shiftboardId: number,
  timePositionId: number,
  actorShiftboardId: number | null
): Promise<void> {
  const [rows] = await pool.query<CriticalDropContext[]>(
    `SELECT
       pt.critical,
       pt.position,
       d.datename,
       d.date,
       st.start_time_text,
       st.shift_times_id,
       v.playa_name,
       v.world_name
     FROM op_volunteer_shifts vs
     JOIN op_shift_time_position stp
       ON stp.time_position_id = vs.time_position_id
     JOIN op_position_type pt
       ON pt.position_type_id = stp.position_type_id
     JOIN op_shift_times st
       ON st.shift_times_id = stp.shift_times_id
     LEFT JOIN op_dates d
       ON d.date_id = st.start_date_id
     LEFT JOIN op_volunteers v
       ON v.shiftboard_id = vs.shiftboard_id
     WHERE vs.shiftboard_id = ?
       AND vs.time_position_id = ?
     LIMIT 1`,
    [shiftboardId, timePositionId]
  );
  const ctx = rows[0];
  if (!ctx || !ctx.critical) return;

  const dayLabel = ctx.datename ? `${ctx.datename} ${ctx.date}` : ctx.date;
  const timeLabel = ctx.start_time_text ? ` at ${ctx.start_time_text}` : "";
  // The volunteer whose slot is now open — vs.shiftboard_id is the removed
  // person, NOT whoever performed the removal.
  const volunteerLabel = ctx.playa_name
    ? `${ctx.playa_name}${ctx.world_name ? ` "${ctx.world_name}"` : ""}`
    : (ctx.world_name ?? `shiftboard_id ${shiftboardId}`);

  // Distinguish a self-drop from an admin/coordinator removal so the CVC
  // list can tell who is no longer covering the shift AND who took the
  // action. Per Mew (2026-06-08): name the volunteer, not just the actor.
  const isSelfDrop =
    actorShiftboardId == null || actorShiftboardId === shiftboardId;
  const actorName = isSelfDrop
    ? null
    : await lookupActorDisplayName(pool, actorShiftboardId);
  const removedByLabel = isSelfDrop
    ? "themselves (self-drop)"
    : (actorName ?? "an administrator");

  await enqueueEmail({
    to: VC_LIST_EMAILS,
    subject: `[PEERS] CRITICAL OPENING: ${ctx.position} on ${dayLabel}`,
    bodyText: [
      "A critical position is now open and needs to be refilled.",
      "",
      `Position: ${ctx.position}`,
      `Shift: ${dayLabel}${timeLabel}`,
      `Volunteer: ${volunteerLabel}`,
      `Removed by: ${removedByLabel}`,
      "",
      `Manage this shift's volunteers: ${APP_BASE_URL}/shifts/${ctx.shift_times_id}/volunteers`,
    ].join("\n"),
    category: "critical-drop",
  });
}

// Server-side authorization for coordinator-page check-in, mirroring the
// UI gate in ShiftVolunteers.tsx so the restriction can't be bypassed with
// a crafted PATCH (the toggle is only hidden client-side):
//   - during the shift window: PEERS Shift Lead / Coordinator / Admin
//   - after the window:        PEERS Coordinator / Admin
//   - before the window / canceled shift: nobody
// (papabear 2026-07-16). NOTE: this is intentionally NOT applied to the
// volunteer self-check-in route (/api/volunteers/[id]/shifts), where a
// volunteer may still check themselves in during their own shift.
export const checkCheckInAuthorized = async (
  pool: Pool,
  session: { shiftboardId: number },
  timePositionId: number | string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  const [dbShiftRows] = await pool.query<RowDataPacket[]>(
    `SELECT st.start_time, st.end_time, st.canceled
     FROM op_shift_time_position stp
     JOIN op_shift_times st ON st.shift_times_id = stp.shift_times_id
     WHERE stp.time_position_id = ?
     LIMIT 1`,
    [timePositionId]
  );
  const dbShift = dbShiftRows[0];
  if (!dbShift) {
    return { ok: false, status: 404, message: "Shift not found." };
  }
  if (dbShift.canceled) {
    return {
      ok: false,
      status: 409,
      message: "Shift is canceled; check-in is unavailable.",
    };
  }

  // Requester's roles (by their authenticated shiftboard id).
  const [dbRoleRows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id FROM op_volunteer_roles WHERE shiftboard_id = ?`,
    [session.shiftboardId]
  );
  const roleIdSet = new Set(dbRoleRows.map((row) => Number(row.role_id)));
  // Super Admin is the strict superset of Admin — never lock it out.
  const isAdmin =
    roleIdSet.has(ROLE_ADMIN_ID) || roleIdSet.has(ROLE_SUPER_ADMIN_ID);
  const isPeersCoordinator = roleIdSet.has(ROLE_PEERS_COORDINATOR_ID);
  const isPeersShiftLead = roleIdSet.has(ROLE_PEERS_SHIFT_LEAD_ID);

  // Determine where "now" falls relative to the shift window. If the
  // times are missing/unparseable, fall back to the DURING rule so a
  // data hiccup can't lock out legitimate staff.
  const startTime = dayjs.tz(dbShift.start_time, PLAYA_TZ);
  const endTime = dayjs.tz(dbShift.end_time, PLAYA_TZ);
  const checkInType =
    startTime.isValid() && endTime.isValid()
      ? getCheckInType({ dateTime: dayjs(), endTime, startTime })
      : SHIFT_DURING;

  let isCheckInAllowed = false;
  if (checkInType === SHIFT_DURING) {
    isCheckInAllowed = isAdmin || isPeersCoordinator || isPeersShiftLead;
  } else if (checkInType === SHIFT_PAST) {
    isCheckInAllowed = isAdmin || isPeersCoordinator;
  }
  // SHIFT_FUTURE → not allowed for anyone.

  if (!isCheckInAllowed) {
    return {
      ok: false,
      status: 403,
      message:
        "You don't have permission to change check-in for this shift right now.",
    };
  }
  return { ok: true };
};

export const shiftVolunteerUpdate = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { updateType } = JSON.parse(req.body);

  switch (updateType) {
    // patch - shift volunteer check-in
    case UPDATE_TYPE_CHECK_IN: {
      const { isCheckedIn, shiftboardId, timePositionId }: IReqSwitchValues =
        JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_shifts
        SET
          noshow=?,
          update_shift=true
        WHERE shiftboard_id=?
        AND time_position_id=?`,
        [isCheckedIn ? "" : "Yes", shiftboardId, timePositionId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // patch - shift volunteer review
    case UPDATE_TYPE_REVIEW: {
      const { notes, rating, shiftboardId, timePositionId }: IReqReviewValues =
        JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_shifts
        SET
          notes=?,
          rating=?,
          update_shift=true
        WHERE shiftboard_id=?
        AND time_position_id=?`,
        [notes, rating, shiftboardId, timePositionId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};
// delete - shift volunteer remove
export const shiftVolunteerRemove = async (
  pool: Pool,
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId, timePositionId } = JSON.parse(req.body);

  await pool.query<RowDataPacket[]>(
    `UPDATE op_volunteer_shifts
    SET
      add_shift=false,
      remove_shift=true
    WHERE shiftboard_id=?
    AND time_position_id=?`,
    [shiftboardId, timePositionId]
  );

  // Best-effort notifications. Wrapped so an enqueue failure doesn't
  // bubble up and 500 the remove request — the DB write is the
  // canonical action; the emails are courtesy on top.
  //
  // Two distinct sends from the same trigger:
  //   - notifyCriticalDrop: to the VC list (only when the position
  //     is marked critical) so coordinators can move on refilling (#313)
  //   - notifyRemoval: to the removed volunteer with a CANCEL .ics
  //     that drops the event from their calendar (per Mew 2026-05-29)
  //
  // RemovalCause distinguishes self-drop from admin-remove so the
  // body copy reflects who initiated. The shift-canceled variant is
  // not reachable from this handler — it fires only when the whole
  // shift's `canceled` flag flips, which is its own endpoint.
  try {
    await notifyCriticalDrop(
      pool,
      shiftboardId,
      timePositionId,
      session.shiftboardId
    );
  } catch (err) {
    console.error(
      `[critical-drop] notifyCriticalDrop failed for shiftboard_id=${shiftboardId} time_position_id=${timePositionId}:`,
      err
    );
  }
  try {
    const cause: RemovalCause =
      session.shiftboardId === shiftboardId
        ? { kind: "self" }
        : { kind: "by-other", actorShiftboardId: session.shiftboardId };
    await notifyRemoval(pool, shiftboardId, timePositionId, cause);
  } catch (err) {
    console.error(
      `[removal-notify] notifyRemoval failed for shiftboard_id=${shiftboardId} time_position_id=${timePositionId}:`,
      err
    );
  }

  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};
