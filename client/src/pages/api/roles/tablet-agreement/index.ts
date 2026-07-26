import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { GATE_OPEN_ISO, ROLE_TABLET_AGREEMENT_ID } from "@/constants";
import { canManageVolunteer, isOwnerOrAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// PEERS Tablet Responsibility Agreement (papabear 2026-07-25/26).
// - GET: returns the volunteer's saved camp/phone/open-camping/landmark so the
//   form can pre-fill (no double entry across create-account and this form).
// - POST: upserts the self-sign role (like behavioral-standards) and saves the
//   camp name / address / phone / open-camping / landmark captured on the form.
interface IReqTabletAgreement {
  isSigned: boolean;
  shiftboardId: number | string;
  campName?: string;
  campAddress?: string;
  phone?: string;
  isOpenCamping?: boolean;
  location?: string;
}

const tabletAgreement = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  switch (req.method) {
    // get — pre-fill data
    // ------------------------------------------------------------
    case "GET": {
      const { shiftboardId } = req.query;
      const canRead = await canManageVolunteer(session, Number(shiftboardId));
      if (!canRead) {
        return res.status(403).json({ statusCode: 403, message: "Forbidden" });
      }
      const [dbList] = await pool.query<RowDataPacket[]>(
        `SELECT camp_name, camp_address, phone, open_camping, location
         FROM op_volunteers WHERE shiftboard_id=?`,
        [shiftboardId]
      );
      const row = dbList[0];
      return res.status(200).json({
        campName: row?.camp_name ?? "",
        campAddress: row?.camp_address ?? "",
        phone: row?.phone ?? "",
        isOpenCamping: Boolean(row?.open_camping),
        location: row?.location ?? "",
      });
    }

    // post — sign
    // ------------------------------------------------------------
    case "POST": {
      const {
        isSigned,
        shiftboardId,
        campName,
        campAddress,
        phone,
        isOpenCamping,
        location,
      }: IReqTabletAgreement = JSON.parse(req.body);

      const canWrite = await isOwnerOrAdmin(session, Number(shiftboardId));
      if (!canWrite) {
        return res.status(403).json({ statusCode: 403, message: "Forbidden" });
      }

      // Required-field validation (papabear 2026-07-26): camp name + phone are
      // always required; camp address is required too, EXCEPT for an open camper
      // before Gate open (they have no address yet). Mirrors the client gate.
      if (isSigned === true) {
        const isAfterGate = new Date() >= new Date(GATE_OPEN_ISO);
        const addressRequired = isAfterGate || isOpenCamping !== true;
        if (
          !campName ||
          campName.trim() === "" ||
          !phone ||
          phone.trim() === "" ||
          (addressRequired && (!campAddress || campAddress.trim() === ""))
        ) {
          return res.status(400).json({
            statusCode: 400,
            message:
              "Camp name, phone, and (unless open camping) camp address are required",
          });
        }
      }

      const [addRole, removeRole] = [isSigned === true, isSigned === false];

      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id FROM op_volunteer_roles
         WHERE role_id=? AND shiftboard_id=?`,
        [ROLE_TABLET_AGREEMENT_ID, shiftboardId]
      );
      if (dbRoleList[0]) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles SET add_role=?, remove_role=?
           WHERE role_id=? AND shiftboard_id=?`,
          [addRole, removeRole, ROLE_TABLET_AGREEMENT_ID, shiftboardId]
        );
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_roles (add_role, remove_role, role_id, shiftboard_id)
           VALUES (?, ?, ?, ?)`,
          [addRole, removeRole, ROLE_TABLET_AGREEMENT_ID, shiftboardId]
        );
      }

      // Save the camp name / address / phone / open-camping / landmark captured
      // on the form (only on sign).
      if (isSigned === true) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteers
           SET camp_name=?, camp_address=?, phone=?, open_camping=?,
               location=?, update_volunteer=true
           WHERE shiftboard_id=?`,
          [
            campName ?? "",
            campAddress ?? "",
            phone ?? "",
            isOpenCamping === true ? 1 : 0,
            location ?? "",
            shiftboardId,
          ]
        );
      }

      return res.status(201).json({ statusCode: 201, message: "Created" });
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({ statusCode: 404, message: "Not found" });
    }
  }
};

export default withAuth(tabletAgreement);
