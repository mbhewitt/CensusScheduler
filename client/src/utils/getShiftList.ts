import { RowDataPacket } from "mysql2";

import type { IResShiftRowItem } from "@/components/types/shifts";

// Collapse the per-position-per-volunteer rows that come out of /api/shifts
// into one IResShiftRowItem per shift_times_id, summing slotsTotal across
// distinct positions and slotsFilled across rows that have a shiftboard_id.
//
// Previously this used a "is the last pushed item the same shift?" check,
// which silently broke when two shifts shared the exact same
// (date, start_time_text) — the SQL `ORDER BY d.date, st.start_time_text`
// interleaved their position rows, so the linear dedupe lost. Switched to
// a Map keyed by shift_times_id so the dedupe is order-independent.
// (Observed 2026-05-23 on prod: Data Entry and Airport Sampling both at
// Aug 31 09:00 → each appeared twice on /shifts.)
export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const timePositionSeen: Set<number> = new Set();
  const shiftMap: Map<number, IResShiftRowItem> = new Map();

  dbShiftList.forEach((row: RowDataPacket) => {
    const {
      canceled,
      date,
      datename,
      department,
      end_time,
      end_time_text,
      sap_points,
      shift_category_id,
      shift_name,
      shift_times_id,
      shiftboard_id,
      start_time,
      start_time_text,
      slots,
      time_position_id,
    } = row;

    let shift = shiftMap.get(shift_times_id);
    if (!shift) {
      shift = {
        canceled: Boolean(canceled),
        category: { id: shift_category_id },
        cspMin: Number.POSITIVE_INFINITY,
        cspMax: Number.NEGATIVE_INFINITY,
        date,
        dateName: datename ?? "",
        department: { name: department ?? "" },
        endTime: end_time ?? end_time_text,
        id: shift_times_id,
        slotsFilled: 0,
        slotsTotal: 0,
        startTime: start_time ?? start_time_text,
        type: shift_name,
      };
      shiftMap.set(shift_times_id, shift);
    }

    // slotsTotal + cspMin/Max: each distinct position contributes its `slots`
    // and `sap_points` once. (LEFT JOIN op_volunteer_shifts multiplies rows
    // per position when several volunteers are assigned.)
    if (!timePositionSeen.has(time_position_id)) {
      timePositionSeen.add(time_position_id);
      shift.slotsTotal += slots;
      const csp = Number(sap_points ?? 0);
      if (csp < shift.cspMin) shift.cspMin = csp;
      if (csp > shift.cspMax) shift.cspMax = csp;
    }

    // slotsFilled: each row with a non-null shiftboard_id is one assignment
    if (shiftboard_id) {
      shift.slotsFilled += 1;
    }
  });

  // Normalize: a shift with no positions never updated the CSP sentinels.
  // Collapse to 0 so the UI doesn't render Infinity / -Infinity.
  for (const shift of shiftMap.values()) {
    if (!Number.isFinite(shift.cspMin)) shift.cspMin = 0;
    if (!Number.isFinite(shift.cspMax)) shift.cspMax = 0;
  }

  // Map iteration preserves insertion order, so the output keeps the order
  // the first row of each shift appeared in (date + start_time_text from
  // the SQL ORDER BY).
  return Array.from(shiftMap.values());
};
