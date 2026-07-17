import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqSignIn } from "@/components/types/sign-in";
import type { IResVolunteerAccount } from "@/components/types/volunteers";
import { isOnPlaya } from "@/lib/onPlaya";
import { buildSessionCookie } from "@/lib/session";
import { pool } from "lib/database";

const signIn = async (req: NextApiRequest, res: NextApiResponse) => {
  // Passcode sign-in is only honored from the on-playa gateway network. This
  // is re-verified server-side off the unspoofable X-Real-IP (nginx-set), not
  // just the UI cookie — so a forged cookie can't unlock passcode login from
  // off-playa. (per Mew 2026-07-17)
  const onPlaya = isOnPlaya((name) => {
    const value = req.headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value ?? null;
  });
  if (!onPlaya) {
    return res.status(403).json({
      statusCode: 403,
      message: "Passcode sign-in is only available on-playa",
    });
  }

  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      // check email and passcode credentials
      const { passcode, shiftboardId }: IReqSignIn = JSON.parse(req.body);
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          core_crew,
          email,
          emergency_contact,
          playa_name,
          shiftboard_id,
          world_name
        FROM op_volunteers
        WHERE passcode=?
        AND shiftboard_id=?`,
        [passcode, shiftboardId]
      );
      const [volunteerFirst] = dbVolunteerList;

      // if credentials do not exist
      // then send error message
      if (!volunteerFirst) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }

      // else send the volunteer
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          r.role,
          r.role_id
        FROM op_volunteer_roles AS vr
        JOIN op_roles AS r
        ON vr.role_id=r.role_id
        AND vr.remove_role=false
        WHERE vr.shiftboard_id=?`,
        [shiftboardId]
      );
      const resRoleList = dbRoleList.map(({ role, role_id }) => ({
        id: role_id,
        name: role,
      }));
      const resAccount: IResVolunteerAccount = {
        email: volunteerFirst.email,
        emergencyContact: volunteerFirst.emergency_contact,
        isCreated: volunteerFirst.create_volunteer,
        location: volunteerFirst.location,
        notes: volunteerFirst.notes,
        phone: volunteerFirst.phone,
        playaName: volunteerFirst.playa_name,
        roleList: resRoleList,
        shiftboardId: volunteerFirst.shiftboard_id,
        worldName: volunteerFirst.world_name,
      };

      // hotfix 2026-05-06: set the server-side session cookie so the
      // middleware (and API guards) recognize this user as authenticated.
      res.setHeader("Set-Cookie", buildSessionCookie(resAccount.shiftboardId));

      return res.status(200).json(resAccount);
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

export default signIn;
