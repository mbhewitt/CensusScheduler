import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

// POST /api/saps/offbook — add (or rename) an off-book person managed by email.
// They appear in the people list and get linked to a volunteer on first login.
const offbook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = body.name ? String(body.name).trim() : null;

  // Minimal email shape check — this is a trusted super-admin entering a known
  // address, not public input.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "Valid email required" });
  }

  await pool.execute<ResultSetHeader>(
    `INSERT INTO op_sap_offbook (email, name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [email, name],
  );

  return res.status(201).json({ statusCode: 201, email, name });
};

export default withSuperAdmin(offbook);
