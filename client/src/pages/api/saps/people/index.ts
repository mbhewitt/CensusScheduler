import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { autoTargetDay, pickAutoSap } from "lib/sap";
import { getCurrentBurnYear } from "lib/sapDb";
import { buildRequiredDays } from "lib/sapStatus";

const ROLE_STAFF_ID = 2000006;
const REQUIRED_CSP = 12;

interface Assignment {
  sapId: number;
  sapDate: string;
  status: "assigned" | "received";
  receivedVia: "download" | "email" | null;
}

// GET /api/saps/people — everyone manageable on the SAP page: active
// op_volunteers plus off-book entries. For each: requirements summary, Staff
// flag, the Auto-picked SAP date, their first-shift date, and current
// assignment. Built from set-based queries (not per-person) to avoid hammering
// the connection pool. Sorted by first-shift date asc (earliest arrivals first).
const sapsPeople = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const burnYear = await getCurrentBurnYear();
  if (burnYear === null) {
    return res
      .status(200)
      .json({ statusCode: 200, burnYear: null, availableDates: [], people: [] });
  }

  const [
    [volRows],
    [offbookRows],
    [staffRows],
    [totalCspRows],
    [dayCspRows],
    [firstShiftRows],
    [availRows],
    [assignRows],
    [dateRows],
  ] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT v.shiftboard_id, v.playa_name, v.world_name, v.email,
              d.datename AS arrival_datename
         FROM op_volunteers v
         LEFT JOIN op_dates d ON v.arrival_date_id = d.date_id
        WHERE v.delete_volunteer = false`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT email, name, linked_shiftboard_id FROM op_sap_offbook`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT shiftboard_id FROM op_volunteer_roles
        WHERE role_id = ? AND remove_role = false`,
      [ROLE_STAFF_ID],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT vs.shiftboard_id, COALESCE(SUM(stp.sap_points), 0) AS total_csp
         FROM op_volunteer_shifts vs
         JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
        WHERE vs.remove_shift = false AND stp.remove_time_position = false
        GROUP BY vs.shiftboard_id`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT vs.shiftboard_id, d.datename, COALESCE(SUM(stp.sap_points), 0) AS day_csp
         FROM op_volunteer_shifts vs
         JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
         JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
         JOIN op_dates d ON st.start_date_id = d.date_id
        WHERE vs.remove_shift = false AND stp.remove_time_position = false
          AND st.remove_shift_time = false
        GROUP BY vs.shiftboard_id, d.datename`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT vs.shiftboard_id, MIN(d.\`date\`) AS first_date
         FROM op_volunteer_shifts vs
         JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
         JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
         JOIN op_dates d ON st.start_date_id = d.date_id
        WHERE vs.remove_shift = false AND stp.remove_time_position = false
          AND st.remove_shift_time = false
          AND COALESCE(stp.sap_points, 0) > 0
        GROUP BY vs.shiftboard_id`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT sap_date, COUNT(*) AS cnt
         FROM op_saps
        WHERE burn_year = ? AND status = 'available'
        GROUP BY sap_date
        ORDER BY sap_date ASC`,
      [burnYear],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT sap_id, sap_date, status, received_via, shiftboard_id, assigned_email
         FROM op_saps
        WHERE burn_year = ? AND status IN ('assigned', 'received')`,
      [burnYear],
    ),
    pool.query<RowDataPacket[]>("SELECT `date`, datename FROM op_dates"),
  ]);

  // Lookups.
  const dateToDayname = new Map<string, string>();
  for (const d of dateRows) dateToDayname.set(String(d.date), d.datename);

  const staffSet = new Set<number>(staffRows.map((r) => r.shiftboard_id));
  const totalCspMap = new Map<number, number>();
  for (const r of totalCspRows)
    totalCspMap.set(r.shiftboard_id, Number(r.total_csp));

  const dayCspMap = new Map<number, Record<string, number>>();
  for (const r of dayCspRows) {
    const m = dayCspMap.get(r.shiftboard_id) ?? {};
    m[r.datename] = Number(r.day_csp);
    dayCspMap.set(r.shiftboard_id, m);
  }

  const firstShiftMap = new Map<number, string>();
  for (const r of firstShiftRows)
    if (r.first_date) firstShiftMap.set(r.shiftboard_id, String(r.first_date));

  const availablePool = availRows.map((r) => ({ sapDate: String(r.sap_date) }));
  const availableDates = availRows.map((r) => ({
    date: String(r.sap_date),
    dayname: dateToDayname.get(String(r.sap_date)) ?? null,
    count: Number(r.cnt),
  }));

  const assignByVol = new Map<number, Assignment>();
  const assignByEmail = new Map<string, Assignment>();
  for (const r of assignRows) {
    const a: Assignment = {
      sapId: r.sap_id,
      sapDate: String(r.sap_date),
      status: r.status,
      receivedVia: r.received_via,
    };
    if (r.shiftboard_id) assignByVol.set(r.shiftboard_id, a);
    else if (r.assigned_email)
      assignByEmail.set(String(r.assigned_email).toLowerCase(), a);
  }

  const dayname = (date: string | null) =>
    date ? (dateToDayname.get(date) ?? null) : null;

  const volunteers = volRows.map((v) => {
    const isStaff = staffSet.has(v.shiftboard_id);
    const firstShiftDate = firstShiftMap.get(v.shiftboard_id) ?? null;
    const targetDay = autoTargetDay(firstShiftDate);
    const autoSapDate = pickAutoSap(targetDay, availablePool)?.sapDate ?? null;
    const requiredDays = buildRequiredDays(
      v.arrival_datename ?? "",
      dayCspMap.get(v.shiftboard_id) ?? {},
    );
    const missing = requiredDays.filter((d) => !d.fulfilled).map((d) => d.label);
    const totalCsp = totalCspMap.get(v.shiftboard_id) ?? 0;
    return {
      kind: "volunteer" as const,
      shiftboardId: v.shiftboard_id,
      email: v.email ?? null,
      name: v.playa_name || v.world_name || `#${v.shiftboard_id}`,
      isStaff,
      autoLabel: isStaff ? "Staff" : "Auto",
      firstShiftDate,
      firstShiftDayname: dayname(firstShiftDate),
      autoSapDate,
      autoSapDayname: dayname(autoSapDate),
      requiredDays,
      missing,
      totalCsp,
      cspFulfilled: totalCsp >= REQUIRED_CSP,
      assignment: assignByVol.get(v.shiftboard_id) ?? null,
    };
  });

  const offbook = offbookRows
    .filter((o) => o.linked_shiftboard_id === null)
    .map((o) => ({
      kind: "offbook" as const,
      shiftboardId: null,
      email: String(o.email),
      name: o.name || String(o.email),
      isStaff: false,
      autoLabel: "Auto",
      firstShiftDate: null,
      firstShiftDayname: null,
      autoSapDate: null,
      autoSapDayname: null,
      requiredDays: [],
      missing: [],
      totalCsp: 0,
      cspFulfilled: false,
      assignment: assignByEmail.get(String(o.email).toLowerCase()) ?? null,
    }));

  // Earliest arrivals first; people with no computable first shift sort last.
  const people = [...volunteers, ...offbook].sort((a, b) => {
    const af = a.firstShiftDate ?? "9999-99-99";
    const bf = b.firstShiftDate ?? "9999-99-99";
    if (af !== bf) return af < bf ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return res
    .status(200)
    .json({ statusCode: 200, burnYear, availableDates, people });
};

export default withSuperAdmin(sapsPeople);
