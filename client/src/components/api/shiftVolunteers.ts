import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqReviewValues, IReqSwitchValues } from "@/components/types";
import { UPDATE_TYPE_CHECK_IN, UPDATE_TYPE_REVIEW } from "@/constants";
import { enqueueEmail } from "lib/mail";
import {
  notifyRemoval,
  type RemovalCause,
} from "@/components/api/assignmentNotify";

// #313 — when a volunteer (self) or admin removes someone from a
// position with `critical=1`, notify the VC list so they can move on
// refilling. Pairs with the warning dialog from #308: the volunteer
// has already acknowledged the gap before this code runs.
const VC_LIST_EMAIL = "censusvolunteercoordinators@burningman.org";
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
  timePositionId: number
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
  const volunteerLabel = ctx.playa_name
    ? `${ctx.playa_name}${ctx.world_name ? ` "${ctx.world_name}"` : ""}`
    : (ctx.world_name ?? `shiftboard_id ${shiftboardId}`);

  await enqueueEmail({
    to: VC_LIST_EMAIL,
    subject: `[PEERS] CRITICAL OPENING: ${ctx.position} on ${dayLabel}`,
    bodyText: [
      "A volunteer just dropped a critical position. The slot is now open.",
      "",
      `Position: ${ctx.position}`,
      `Shift: ${dayLabel}${timeLabel}`,
      `Dropped by: ${volunteerLabel}`,
      "",
      `Manage this shift's volunteers: ${APP_BASE_URL}/shifts/${ctx.shift_times_id}/volunteers`,
      "",
      "Note: the volunteer was shown a warning before this drop completed, so they're aware they left a critical gap.",
    ].join("\n"),
    category: "critical-drop",
  });
}

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
    await notifyCriticalDrop(pool, shiftboardId, timePositionId);
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
