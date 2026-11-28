import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withWriteGuard } from "@/lib/withWriteGuard";
import { pool } from "lib/database";

// /api/shift-release (#869): the release rows behind the shift embargo.
// GET  → [{ id, embargoFrom, releaseAt, announcedAt }]
// POST { embargoFrom: "YYYY-MM-DD", releaseAt: "YYYY-MM-DDTHH:mm" } (Pacific)
// DELETE ?id=… removes one. Edit = delete + add; one row per season.
const shiftRelease = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET": {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT release_id, embargo_from, release_at, announced_at
         FROM op_shift_release ORDER BY release_at DESC`
      );
      return res.status(200).json(
        rows.map((r) => ({
          announcedAt: r.announced_at,
          embargoFrom: r.embargo_from,
          id: r.release_id,
          releaseAt: r.release_at,
        }))
      );
    }
    case "POST": {
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(req.body || "{}");
      } catch {
        return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
      }
      const { embargoFrom, releaseAt } = body;
      if (
        typeof embargoFrom !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(embargoFrom) ||
        typeof releaseAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}[T ]([01]\d|2[0-3]):[0-5]\d$/.test(releaseAt)
      ) {
        return res.status(400).json({
          statusCode: 400,
          message: "Need embargoFrom YYYY-MM-DD and releaseAt YYYY-MM-DD HH:mm.",
        });
      }
      await pool.query(
        "INSERT INTO op_shift_release (embargo_from, release_at) VALUES (?, ?)",
        [embargoFrom, `${releaseAt.replace("T", " ")}:00`]
      );
      return res.status(201).json({ statusCode: 201, message: "Created" });
    }
    case "DELETE": {
      const id = Number(req.query.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ statusCode: 400, message: "Bad id" });
      }
      await pool.query("DELETE FROM op_shift_release WHERE release_id = ?", [
        id,
      ]);
      return res.status(200).json({ statusCode: 200, message: "OK" });
    }
    default:
      return res
        .status(405)
        .json({ statusCode: 405, message: "Method not allowed" });
  }
};

// SuperAdmin writes, like the rest of the Dates page.
export default withWriteGuard(shiftRelease, "superadmin");
