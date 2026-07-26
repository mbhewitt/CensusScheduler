import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { GATE_OPEN_ISO, ROLE_TABLET_AGREEMENT_ID } from "@/constants";
import { pool } from "lib/database";

// PEERS Tablet Responsibility Agreement sign (papabear 2026-07-25). Mirrors the
// behavioral-standards sign: upserts the self-sign role, and also saves the
// camp name / camp address / phone captured on the form.
interface IReqTabletAgreement {
  isSigned: boolean;
  shiftboardId: number | string;
  campName?: string;
  campAddress?: string;
  phone?: string;
  isOpenCamping?: boolean;
}

const tabletAgreement = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      const {
        isSigned,
        shiftboardId,
        campName,
        campAddress,
        phone,
        isOpenCamping,
      }: IReqTabletAgreement = JSON.parse(req.body);

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

      // Save the camp name / address / phone captured on the form (only on
      // sign, and only fields that were provided).
      if (isSigned === true) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteers
           SET camp_name=?, camp_address=?, phone=?, update_volunteer=true
           WHERE shiftboard_id=?`,
          [campName ?? "", campAddress ?? "", phone ?? "", shiftboardId]
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

export default tabletAgreement;
