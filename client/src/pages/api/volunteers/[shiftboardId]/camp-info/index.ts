import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { canManageVolunteer, isOwnerOrAdmin } from "@/lib/authz";

// PEERS camp info (papabear 2026-07-26). Read/write the PEERS-only camp fields
// that aren't in Burner Profile — Camp Name, Camp Address, Open Camping, and
// Landmark (op_volunteers.location) — so a volunteer can update them from the
// Camp Info card on their /info page after signup. Shared columns with the
// Create Account and Tablet Agreement forms.
//
// Auth mirrors the account endpoint: READ = owner/admin or rank-superior
// leadership; WRITE = strictly owner-or-admin (leadership read must not grant
// edit rights).

const campInfo = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  const canRead = await canManageVolunteer(session, Number(shiftboardId));
  const canWrite = await isOwnerOrAdmin(session, Number(shiftboardId));
  if (req.method === "GET" ? !canRead : !canWrite) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT camp_name, camp_address, open_camping, location
        FROM op_volunteers
        WHERE delete_volunteer=false AND shiftboard_id=?
        LIMIT 1`,
        [shiftboardId]
      );
      const [dbVolunteerFirst] = dbVolunteerList;
      if (!dbVolunteerFirst) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Volunteer not found" });
      }
      return res.status(200).json({
        campName: dbVolunteerFirst.camp_name ?? "",
        campAddress: dbVolunteerFirst.camp_address ?? "",
        openCamping: Boolean(dbVolunteerFirst.open_camping),
        location: dbVolunteerFirst.location ?? "",
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      const { campName, campAddress, openCamping, location } = JSON.parse(
        req.body
      ) as {
        campName?: string;
        campAddress?: string;
        openCamping?: boolean;
        location?: string;
      };

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET
          camp_name=?,
          camp_address=?,
          open_camping=?,
          location=?,
          update_volunteer=true
        WHERE shiftboard_id=?`,
        [
          campName ?? "",
          campAddress ?? "",
          openCamping ? 1 : 0,
          location ?? "",
          shiftboardId,
        ]
      );

      return res.status(200).json({ statusCode: 200, message: "OK" });
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({ statusCode: 404, message: "Not found" });
    }
  }
};

export default withAuth(campInfo);
