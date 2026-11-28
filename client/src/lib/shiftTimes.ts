import type { RowDataPacket } from "mysql2";

import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

// Small shared pieces for the single-time shift calls
// (/api/shifts/types/[typeId]/times…), which Pumpkin uses instead of the
// whole-type form save.

export const isDate = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v));

export const isTime = (v: unknown): v is string =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export const isDupEntry = (err: unknown) =>
  (err as { code?: string })?.code === "ER_DUP_ENTRY";

// The op_dates row for a calendar date, created when missing: shift times need
// the FK, and off-season dates (meetings) usually have no row yet. datename is
// UNIQUE, so a new row is named after the date unless the caller names it.
export async function ensureDateId(date: string, name?: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT date_id FROM op_dates WHERE date = ? AND delete_date = false LIMIT 1",
    [date]
  );
  if (rows[0]) return Number(rows[0].date_id);
  const dateId = await generateId(
    "SELECT date_id FROM op_dates WHERE date_id = ?"
  );
  await pool.query(
    `INSERT INTO op_dates (create_date, delete_date, date_id, date, datename)
     VALUES (true, false, ?, ?, ?)`,
    [dateId, date, name || date]
  );
  return dateId;
}
