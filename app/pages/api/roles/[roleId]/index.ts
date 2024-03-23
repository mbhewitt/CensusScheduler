import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResRoleItem } from "src/components/types";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get one role
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT display, role, role_id
        FROM op_roles
        WHERE delete_role=false AND role_id=?
        ORDER BY role`,
        [roleId]
      );
      const resRoleList: IResRoleItem[] = dbRoleList.map(
        ({ display, role, role_id }) => {
          return { display: Boolean(display), roleId: role_id, roleName: role };
        }
      );
      const resRoleFirst = resRoleList[0];

      return res.status(200).json(resRoleFirst);
    }

    // patch
    // --------------------
    case "PATCH": {
      // update role display
      const { name } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET role=?, update_role=true
        WHERE role_id=?`,
        [name, roleId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // --------------------
    case "DELETE": {
      // delete role
      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET create_role=false, delete_role=true
        WHERE role_id=?`,
        [roleId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // --------------------
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
