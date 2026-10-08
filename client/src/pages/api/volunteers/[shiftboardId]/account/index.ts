import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqVolunteerAccount,
  IResVolunteerAccount,
} from "@/components/types/volunteers";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isAdmin, isOwnerOrAdmin } from "@/lib/authz";

const volunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  if (!(await isOwnerOrAdmin(session, Number(shiftboardId)))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get volunteer account
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          r.role,
          r.role_id
        FROM op_roles as r
        JOIN op_volunteer_roles AS vr
        ON r.role_id=vr.role_id
        AND vr.remove_role=false
        AND vr.shiftboard_id=?
        WHERE r.display=true
        ORDER BY r.role COLLATE utf8mb4_general_ci`,
        [shiftboardId]
      );
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          create_volunteer,
          email,
          email_bounced_at,
          location,
          notes,
          playa_name,
          shiftboard_id,
          world_name
        FROM op_volunteers
        WHERE delete_volunteer=false
        AND shiftboard_id=?
        ORDER BY playa_name COLLATE utf8mb4_general_ci`,
        [shiftboardId]
      );
      const resRoleList = dbRoleList.map(({ role, role_id }) => ({
        id: role_id,
        name: role,
      }));
      const [dbVolunteerFirst] = dbVolunteerList;
      if (!dbVolunteerFirst) {
        return res.status(404).json({
          statusCode: 404,
          message: "Volunteer not found",
        });
      }
      const resVolunteerItem: IResVolunteerAccount = {
        email: dbVolunteerFirst.email ?? "",
        emailBouncedAt: dbVolunteerFirst.email_bounced_at ?? null,
        isCreated: Boolean(dbVolunteerFirst.create_volunteer),
        location: dbVolunteerFirst.location ?? "",
        notes: dbVolunteerFirst.notes ?? "",
        playaName: dbVolunteerFirst.playa_name ?? "",
        shiftboardId: dbVolunteerFirst.shiftboard_id ?? 0,
        roleList: resRoleList,
        worldName: dbVolunteerFirst.world_name ?? "",
      };

      return res.status(200).json(resVolunteerItem);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update volunteer account
      const {
        email,
        emailBounced,
        location,
        notes,
        playaName,
        worldName,
      }: IReqVolunteerAccount = JSON.parse(req.body);
      // #785: only an admin may set/clear the bounced flag; null = leave as is.
      const bounced =
        typeof emailBounced === "boolean" && (await isAdmin(session.shiftboardId))
          ? emailBounced
          : null;

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET
          -- must precede email=? (MySQL assigns left to right): a changed
          -- email always clears the flag, otherwise the admin's choice applies
          email_bounced_at=CASE
            WHEN NOT (email <=> ?) THEN NULL
            WHEN ? IS NULL THEN email_bounced_at
            WHEN ? THEN COALESCE(email_bounced_at, NOW())
            ELSE NULL
          END,
          email=?,
          location=?,
          notes=?,
          playa_name=?,
          update_volunteer=true,
          world_name=?
        WHERE shiftboard_id=?`,
        [email, bounced, bounced, email, location, notes, playaName, worldName, shiftboardId]
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
