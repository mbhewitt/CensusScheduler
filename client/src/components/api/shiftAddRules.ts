import type { RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";

import { CHECK_IN_BEFORE_HOURS } from "@/constants";
import { isAdmin } from "@/lib/authz";
import { EMBARGOED_UNTIL_SQL } from "@/lib/shiftRelease";

// The ONE copy of the "can this volunteer take this position" rules (C-863 A2).
// POST /api/shifts/[timeId]/volunteers runs it inside its capacity lock, and
// POST …/volunteers/preflight runs it read-only so the add dialog (and the
// pumpkin gate) can show the same answer before submitting. The dialog keeps
// no rule logic of its own.
//
// Non-admins get blockers; admins get the same findings as warnings and may
// override (the app's admin semantics: Admin or SuperAdmin). A canceled shift
// blocks everyone, and adding someone else off-playa is admin-only.

export interface IShiftAddBlocker {
  code:
    | "admin-only"
    | "canceled"
    | "role-required"
    | "full"
    | "time-conflict"
    | "max-per-volunteer"
    | "min-csp"
    | "embargoed";
  message: string;
}
export interface IShiftAddCheck {
  notFound: "position" | "volunteer" | null;
  blockers: IShiftAddBlocker[];
  warnings: string[];
  // Check-in state for a new row, from the server clock: "X" (not yet checked
  // in) for a future shift, "" once inside the check-in window or later.
  noShow: "X" | "";
  playaName: string;
  worldName: string;
  positionName: string;
  shiftTimesId: number;
}

type Db = Pool | PoolConnection;

export async function checkShiftAdd(
  db: Db,
  {
    actorShiftboardId,
    isOnPlaya,
    shiftboardId,
    timePositionId,
  }: {
    actorShiftboardId: number;
    isOnPlaya: boolean;
    shiftboardId: number;
    timePositionId: number;
  }
): Promise<IShiftAddCheck> {
  const result: IShiftAddCheck = {
    notFound: null,
    blockers: [],
    warnings: [],
    noShow: "X",
    playaName: "",
    worldName: "",
    positionName: "",
    shiftTimesId: 0,
  };
  const actorIsAdmin = await isAdmin(actorShiftboardId);

  // Off-playa, adding *another* volunteer is admin-only. Checked first and
  // alone so a non-admin learns nothing about someone else's schedule.
  if (!isOnPlaya && shiftboardId !== actorShiftboardId && !actorIsAdmin) {
    result.blockers.push({
      code: "admin-only",
      message: "Adding another volunteer is restricted to admins.",
    });
    return result;
  }

  // Shift times are playa-local; the DB runs in UTC (see the walk-up window).
  const [[position]] = await db.query<RowDataPacket[]>(
    `SELECT
       stp.slots,
       stp.shift_times_id,
       stp.position_type_id,
       st.canceled,
       st.start_time,
       st.end_time,
       pt.max_per_volunteer,
       pt.min_scheduled_csp,
       pt.prerequisite_id,
       COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
       r.role AS role_required,
       (SELECT COUNT(*)
        FROM op_volunteer_shifts vs
        JOIN op_volunteers v
          ON v.shiftboard_id = vs.shiftboard_id
          AND v.delete_volunteer = false
        WHERE vs.time_position_id = stp.time_position_id
          AND vs.remove_shift = false
          AND vs.shiftboard_id <> ?) AS filled,
       (r.role_id IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM op_volunteer_roles vr
         WHERE vr.role_id = r.role_id
           AND vr.shiftboard_id = ?
           AND vr.remove_role = false)) AS missing_role,
       (CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')
         < DATE_SUB(st.start_time, INTERVAL ? HOUR)) AS is_future,
       ${EMBARGOED_UNTIL_SQL} AS embargoed_until
     FROM op_shift_time_position stp
     JOIN op_shift_times st
       ON st.shift_times_id = stp.shift_times_id
       AND st.remove_shift_time = false
     JOIN op_shift_name sn
       ON sn.shift_name_id = st.shift_name_id
     JOIN op_position_type pt
       ON pt.position_type_id = stp.position_type_id
     LEFT JOIN op_roles r
       ON r.role_id = pt.role_id
     WHERE stp.time_position_id = ?
       AND stp.remove_time_position = false`,
    [shiftboardId, shiftboardId, CHECK_IN_BEFORE_HOURS, timePositionId]
  );
  if (!position) {
    result.notFound = "position";
    return result;
  }
  const [[volunteer]] = await db.query<RowDataPacket[]>(
    `SELECT playa_name, world_name
     FROM op_volunteers
     WHERE delete_volunteer = false
       AND shiftboard_id = ?`,
    [shiftboardId]
  );
  if (!volunteer) {
    result.notFound = "volunteer";
    return result;
  }
  result.noShow = position.is_future ? "X" : "";
  result.playaName = volunteer.playa_name ?? "";
  result.worldName = volunteer.world_name ?? "";
  result.positionName = position.position;
  result.shiftTimesId = position.shift_times_id;

  if (position.canceled) {
    result.blockers.push({
      code: "canceled",
      message: "Shift is canceled; cannot add volunteers.",
    });
    return result;
  }

  // Findings that block a non-admin and only warn an admin.
  const findings: IShiftAddBlocker[] = [];
  if (position.embargoed_until) {
    findings.push({
      code: "embargoed",
      message: `These shifts open for sign-up on ${String(position.embargoed_until).slice(0, 16)} (Pacific).`,
    });
  }
  if (position.missing_role) {
    findings.push({
      code: "role-required",
      message: `This position requires the ${position.role_required} role.`,
    });
  }
  // The volunteer being added isn't counted, so a re-add isn't blocked.
  if (Number(position.filled) >= Number(position.slots)) {
    findings.push({ code: "full", message: "This position is full." });
  }

  // The volunteer's other active signups (not this slot, not canceled).
  const [otherShiftList] = await db.query<RowDataPacket[]>(
    `SELECT
       stp.position_type_id,
       stp.sap_points,
       st.start_time,
       st.end_time,
       sn.shift_category_id
     FROM op_volunteer_shifts vs
     JOIN op_shift_time_position stp
       ON stp.time_position_id = vs.time_position_id
       AND stp.remove_time_position = false
     JOIN op_shift_times st
       ON st.shift_times_id = stp.shift_times_id
       AND st.remove_shift_time = false
       AND st.canceled = false
     JOIN op_shift_name sn
       ON sn.shift_name_id = st.shift_name_id
     WHERE vs.shiftboard_id = ?
       AND vs.remove_shift = false
       AND vs.time_position_id <> ?`,
    [shiftboardId, timePositionId]
  );
  const ms = (t: unknown) => (t ? new Date(t as string).getTime() : NaN);
  const start = ms(position.start_time);
  const end = ms(position.end_time);

  // #424: strict overlap, so back-to-back shifts that only touch are fine.
  const hasOverlap = otherShiftList.some(
    (s) => ms(s.start_time) < end && start < ms(s.end_time)
  );
  if (hasOverlap) {
    findings.push({
      code: "time-conflict",
      message:
        shiftboardId === actorShiftboardId
          ? "This shift overlaps a shift you’re already signed up for — you can’t be in two places at once. Please remove the other shift first if you’d like to take this one."
          : "This shift overlaps another shift this volunteer is signed up for.",
    });
  } else if (
    // Admins have always been warned on the inclusive check (this shift
    // starting exactly when another ends); non-admins aren't blocked by it.
    actorIsAdmin &&
    otherShiftList.some(
      (s) => start >= ms(s.start_time) && start <= ms(s.end_time)
    )
  ) {
    result.warnings.push(
      "This shift starts right as another of this volunteer’s shifts ends."
    );
  }

  // #438: at most max_per_volunteer of this position across all shifts.
  const maxPerVolunteer = position.max_per_volunteer;
  if (maxPerVolunteer != null) {
    const heldCount = otherShiftList.filter(
      (s) => s.position_type_id === position.position_type_id
    ).length;
    if (heldCount >= Number(maxPerVolunteer)) {
      findings.push({
        code: "max-per-volunteer",
        // Self wording is the dialog's existing copy (#438).
        message:
          shiftboardId === actorShiftboardId
            ? `You’re already signed up for the most ${position.position} ${
                Number(maxPerVolunteer) === 1 ? "shift" : "shifts"
              } allowed (${maxPerVolunteer}). Please remove one first if you’d like to change it.`
            : `Already signed up for ${heldCount} ${position.position} ${
                heldCount === 1 ? "shift" : "shifts"
              }; the most allowed is ${maxPerVolunteer}.`,
      });
    }
  }

  // #436: scheduled CSP (summed here, never taken from the client) must meet
  // the position's minimum.
  const minScheduledCsp = position.min_scheduled_csp;
  if (minScheduledCsp != null) {
    const scheduledCsp = otherShiftList.reduce(
      (sum, s) => sum + Number(s.sap_points ?? 0),
      0
    );
    if (scheduledCsp < Number(minScheduledCsp)) {
      findings.push({
        code: "min-csp",
        // Self wording is the dialog's existing copy (#436).
        message:
          shiftboardId === actorShiftboardId
            ? `${position.position} is a thank-you for active volunteers — please sign up for at least one work shift before adding it.`
            : `${position.position} is a thank-you for active volunteers — ${scheduledCsp} CSP scheduled, at least ${minScheduledCsp} needed.`,
      });
    }
  }

  // Training prerequisite: a warning only (as in the dialog), never a block.
  const prerequisiteId = Number(position.prerequisite_id ?? 0);
  if (
    prerequisiteId !== 0 &&
    !otherShiftList.some(
      (s) =>
        Number(s.shift_category_id) === prerequisiteId &&
        ms(s.start_time) < start
    )
  ) {
    result.warnings.push(
      "This shift requires training, and no training before it is on this volunteer’s schedule."
    );
  }

  if (actorIsAdmin) {
    result.warnings.unshift(...findings.map(({ message }) => message));
  } else {
    result.blockers.push(...findings);
  }
  return result;
}
