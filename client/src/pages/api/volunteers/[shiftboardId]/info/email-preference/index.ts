import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqToggleEmailUnsubscribed } from "@/components/types/volunteer-info";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";

// Toggles the EmailUnsubscribed role on op_volunteer_roles. Mirrors the
// other-sap endpoint pattern: SELECT-then-branch into UPDATE or INSERT.
// The mail layer (client/lib/mail/queue.ts) checks this role at enqueue
// time and skips the send.
const ROLE_EMAIL_UNSUBSCRIBED_ID = 2000020;

const emailPreference = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  // Self-only: prevents an admin or anyone else from flipping this for
  // another volunteer. Admins can already manage roles directly on the
  // Roles page if they need to unsubscribe someone on their behalf.
  if (Number(shiftboardId) !== session.shiftboardId) {
    return res.status(403).json({
      statusCode: 403,
      message: "Forbidden",
    });
  }

  switch (req.method) {
    case "POST": {
      const { unsubscribed }: IReqToggleEmailUnsubscribed = JSON.parse(
        req.body
      );
      const [addRole, removeRole] = [unsubscribed === true, unsubscribed === false];

      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteer_roles
        WHERE role_id=?
        AND shiftboard_id=?`,
        [ROLE_EMAIL_UNSUBSCRIBED_ID, shiftboardId]
      );
      const [dbVolunteerRoleFirst] = dbVolunteerRoleList;

      if (dbVolunteerRoleFirst) {
        await pool.query(
          `UPDATE op_volunteer_roles
          SET add_role=?, remove_role=?
          WHERE role_id=?
          AND shiftboard_id=?`,
          [addRole, removeRole, ROLE_EMAIL_UNSUBSCRIBED_ID, shiftboardId]
        );
      } else {
        await pool.query(
          `INSERT INTO op_volunteer_roles (
            add_role,
            remove_role,
            role_id,
            shiftboard_id
          )
          VALUES (?, ?, ?, ?)`,
          [addRole, removeRole, ROLE_EMAIL_UNSUBSCRIBED_ID, shiftboardId]
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(emailPreference);
