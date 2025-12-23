import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IReqRoleItem, IResRoleRowItem } from "@/components/types/roles";
import { pool } from "lib/database";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get role
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          display,
          role,
          role_id
        FROM op_roles
        WHERE role_id=?`,
        [roleId]
      );
      const [resRoleFirst] = dbRoleList.map(
        ({ display, role, role_id }: RowDataPacket) => {
          const resRoleItem: IResRoleRowItem = {
            display: Boolean(display),
            id: role_id,
            name: role,
          };

          return resRoleItem;
        }
      );

      return res.status(200).json(resRoleFirst);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update role
      const { name }: IReqRoleItem = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET
          role=?,
          update_role=true
        WHERE role_id=?`,
        [name, roleId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // ------------------------------------------------------------
    case "DELETE": {
      // delete role
      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET delete_role=true
        WHERE role_id=?`,
        [roleId]
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

export default roles;
