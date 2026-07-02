import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { autoTargetDay, pickAutoSap } from "lib/sap";
import { getCurrentBurnYear, getFirstCspShiftDate } from "lib/sapDb";

interface AssignBody {
  shiftboardId?: number;
  email?: string;
  // "auto" (or omitted) computes the date from the first CSP shift; otherwise a
  // specific "YYYY-MM-DD".
  date?: string;
}

// Resolve the target to a single op_saps owner column + value. Exactly one of
// shiftboardId / email must be present.
function resolveTarget(
  body: AssignBody,
): { col: "shiftboard_id" | "assigned_email"; value: number | string } | null {
  if (body.shiftboardId != null && !body.email)
    return { col: "shiftboard_id", value: body.shiftboardId };
  if (body.email && body.shiftboardId == null)
    return { col: "assigned_email", value: body.email.toLowerCase() };
  return null;
}

const parseBody = (req: NextApiRequest): AssignBody =>
  typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});

// POST /api/saps/assign — reserve an available SAP for a target.
// DELETE /api/saps/assign — release a still-assigned (not yet received) SAP.
const assign = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number },
) => {
  const burnYear = await getCurrentBurnYear();
  if (burnYear === null) {
    return res
      .status(409)
      .json({ statusCode: 409, message: "No event dates configured" });
  }

  const body = parseBody(req);
  const target = resolveTarget(body);
  if (!target) {
    return res.status(400).json({
      statusCode: 400,
      message: "Provide exactly one of shiftboardId or email",
    });
  }

  if (req.method === "DELETE") {
    return unassign(res, burnYear, target);
  }
  if (req.method === "POST") {
    return doAssign(res, burnYear, target, body, session.shiftboardId);
  }
  return res
    .status(405)
    .json({ statusCode: 405, message: "Method not allowed" });
};

async function unassign(
  res: NextApiResponse,
  burnYear: number,
  target: { col: string; value: number | string },
) {
  // Only an 'assigned' (not yet downloaded/emailed) SAP can be released. A
  // 'received' SAP is locked — reassigning it requires issuing a new one.
  const [result] = await pool.execute(
    `UPDATE op_saps
        SET status='available', shiftboard_id=NULL, assigned_email=NULL, assigned_at=NULL
      WHERE burn_year=? AND status='assigned' AND ${target.col}=?`,
    [burnYear, target.value],
  );
  const affected = (result as { affectedRows: number }).affectedRows;
  if (affected === 0) {
    return res.status(409).json({
      statusCode: 409,
      message: "Nothing to unassign (already issued, or not assigned)",
    });
  }
  return res.status(200).json({ statusCode: 200, message: "Unassigned" });
}

async function doAssign(
  res: NextApiResponse,
  burnYear: number,
  target: { col: string; value: number | string },
  body: AssignBody,
  actorId: number,
) {
  // Resolve the desired SAP date (specific, or Auto from first CSP shift).
  let desiredDate = body.date && body.date !== "auto" ? body.date : null;
  if (!desiredDate) {
    if (target.col !== "shiftboard_id") {
      return res.status(400).json({
        statusCode: 400,
        message: "Off-book assignments need an explicit date",
      });
    }
    const firstShift = await getFirstCspShiftDate(target.value as number);
    const [availRows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT sap_date FROM op_saps WHERE burn_year=? AND status='available'`,
      [burnYear],
    );
    const availablePool = availRows.map((r) => ({ sapDate: String(r.sap_date) }));
    desiredDate =
      pickAutoSap(autoTargetDay(firstShift), availablePool)?.sapDate ?? null;
    if (!desiredDate) {
      return res.status(409).json({
        statusCode: 409,
        message: "No suitable SAP available for Auto — choose a date manually",
      });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Current active SAP for this target (at most one expected).
    const [currentRows] = await conn.query<RowDataPacket[]>(
      `SELECT sap_id, sap_date, status FROM op_saps
        WHERE burn_year=? AND ${target.col}=? AND status IN ('assigned','received')
        FOR UPDATE`,
      [burnYear, target.value],
    );
    const current = currentRows[0];

    // Already assigned that exact date and not yet issued → nothing to do.
    if (
      current &&
      current.status === "assigned" &&
      String(current.sap_date) === desiredDate
    ) {
      await conn.commit();
      return res
        .status(200)
        .json({ statusCode: 200, sapId: current.sap_id, sapDate: desiredDate });
    }

    // A still-assigned SAP for a different date is freed back to the pool first
    // (rolled back automatically if the new reservation below fails).
    if (current && current.status === "assigned") {
      await conn.execute(
        `UPDATE op_saps
            SET status='available', shiftboard_id=NULL, assigned_email=NULL, assigned_at=NULL
          WHERE sap_id=?`,
        [current.sap_id],
      );
    }

    // Atomically reserve one available SAP of the desired date.
    const [lockRows] = await conn.query<RowDataPacket[]>(
      `SELECT sap_id FROM op_saps
        WHERE burn_year=? AND status='available' AND sap_date=?
        ORDER BY sap_id ASC LIMIT 1
        FOR UPDATE`,
      [burnYear, desiredDate],
    );
    if (lockRows.length === 0) {
      await conn.rollback();
      return res.status(409).json({
        statusCode: 409,
        message: `No available SAP for ${desiredDate}`,
      });
    }
    const newSapId = lockRows[0].sap_id;
    await conn.execute(
      `UPDATE op_saps
          SET status='assigned', ${target.col}=?, assigned_at=NOW()
        WHERE sap_id=?`,
      [target.value, newSapId],
    );

    // A previously RECEIVED SAP is burned and points at its replacement.
    if (current && current.status === "received") {
      await conn.execute(
        `UPDATE op_saps SET status='burned', superseded_by_sap_id=?, updated_at=NOW()
          WHERE sap_id=?`,
        [newSapId, current.sap_id],
      );
    }

    await conn.commit();
    return res.status(200).json({
      statusCode: 200,
      sapId: newSapId,
      sapDate: desiredDate,
      burnedSapId: current?.status === "received" ? current.sap_id : null,
      actorId,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default withSuperAdmin(assign);
