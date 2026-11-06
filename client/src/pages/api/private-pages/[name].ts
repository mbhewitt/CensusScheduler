import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

// GET /api/private-pages/[name] — a super-admin-only HTML page from
// op_private_pages. A job on the server writes these pages, so their content
// never lands in this public repo.
const privatePage = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const name = String(req.query.name);
  if (!/^[a-z0-9-]{1,64}$/.test(name)) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT html FROM op_private_pages WHERE name = ?`,
    [name]
  );
  if (!rows.length) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(rows[0].html);
};

export default withSuperAdmin(privatePage);
