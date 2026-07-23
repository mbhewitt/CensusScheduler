import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqPasscode } from "@/components/types/volunteers";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { canManageVolunteer } from "@/lib/authz";

const volunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    // Self-only reveal. An admin can SET someone else's passcode (PATCH
    // below — now owner-or-admin gated, #350), but nobody — including
    // admins — can READ an existing one through this endpoint.
    // Per Mew 2026-05-25.
    case "GET": {
      const requestId = Number(shiftboardId);
      if (!session || session.shiftboardId !== requestId) {
        return res.status(403).json({
          statusCode: 403,
          message: "Forbidden",
        });
      }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT passcode
        FROM op_volunteers
        WHERE shiftboard_id=?
        LIMIT 1`,
        [requestId]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }
      return res.status(200).json({
        statusCode: 200,
        passcode: rows[0].passcode ?? "",
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // PEERS #walkin: leadership-hierarchy gate. A volunteer may set their
      // own passcode; admins may reset anyone's; and (new) a Coordinator or
      // Shift Lead may reset the passcode of anyone STRICTLY below them
      // (coordinator > shift lead > squaddie) so they can help a forgetful
      // walk-in at the kiosk. Reset-only is inherent: this route only SETS a
      // new code (the target types it), and reveal (GET above) is self-only.
      if (!(await canManageVolunteer(session, Number(shiftboardId)))) {
        return res.status(403).json({ statusCode: 403, message: "Forbidden" });
      }

      // update volunteer passcode
      const { passcode }: IReqPasscode = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET
          passcode=?,
          update_volunteer=true
        WHERE shiftboard_id=?`,
        [passcode, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // ------------------------------------------------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(volunteers);
