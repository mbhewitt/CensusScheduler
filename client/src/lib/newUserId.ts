import { RowDataPacket } from "mysql2";

import { pool } from "lib/database";

// New-account shiftboard_ids start at 10,000,000 — keeps a clear range
// above e2e test data (which uses 9,000,000+ per client/e2e/helpers/db.ts)
// and above all legacy imported volunteers. Per @mbhewitt 2026-05-23.
const NEW_USER_ID_FLOOR = 10_000_000;
const NEW_USER_ID_RANGE = 10_000_000; // candidate space [10M, 20M)

export const generateNewUserShiftboardId = async (): Promise<number> => {
  // Loop until we find a free id. At 10M slots versus a handful of
  // sign-ups per day, collisions are vanishing — but the loop makes the
  // duplicate-check guarantee explicit (the legacy generateId() has a
  // known async race where the duplicate check resolves after the value
  // is already returned, see specs/training-confirmation-endpoint.md
  // gotcha #1).
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate =
      NEW_USER_ID_FLOOR + Math.floor(Math.random() * NEW_USER_ID_RANGE);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT shiftboard_id FROM op_volunteers WHERE shiftboard_id = ? LIMIT 1",
      [candidate]
    );
    if (rows.length === 0) return candidate;
  }
  throw new Error(
    "could not allocate a new shiftboard_id after 10 attempts — DB unusually full"
  );
};
