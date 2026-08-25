import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqSignIn } from "@/components/types/sign-in";
import type { IResVolunteerAccount } from "@/components/types/volunteers";
import { isProvisionedDevice } from "@/lib/device";
import { buildSessionCookie } from "@/lib/session";
import { pool } from "lib/database";

const signIn = async (req: NextApiRequest, res: NextApiResponse) => {
  // Passcode sign-in is only honored from a provisioned tablet — a device that
  // holds a valid, HMAC-signed peers-device cookie minted via the super-admin
  // QR flow (see lib/device.ts, migration 012). This replaces the old
  // on-playa-IP gate: peers is cloud-only this year, so a tablet's egress IP
  // over playa internet isn't a reliable signal, whereas the device cookie is
  // topology-independent and unforgeable. Participants on their own devices
  // (no cookie) are refused here regardless of network. (per Mew 2026-08-24)
  if (!isProvisionedDevice(req.cookies)) {
    return res.status(403).json({
      statusCode: 403,
      message: "This device is not authorized for passcode sign-in.",
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
