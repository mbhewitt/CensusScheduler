import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResRoleItem } from "src/components/types";
import { checkIsIdExists, generateId } from "src/utils/generateId";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all roles
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT display, role, role_id
        FROM op_roles
        WHERE delete_role=false
        ORDER BY role`
      );
      const resRoleList: IResRoleItem[] = dbRoleList.map(
        ({ display, role, role_id }) => {
          return { display: Boolean(display), id: role_id, name: role };
        }
      );

      return res.status(200).json(resRoleList);
    }

    // post
    // --------------------
    case "POST": {
      // create role
      const { roleId, roleName } = JSON.parse(req.body);
      const roleIdQuery = `
        SELECT role_id
        FROM op_roles
        WHERE role_id=?
      `;
      const isRoleIdExist = await checkIsIdExists(roleIdQuery, roleId);

      // if role name exists already
      // then update role row
      if (isRoleIdExist) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_roles
            SET
              create_role=true,
              delete_role=false,
              display=true
            WHERE role_id=?`,
          [roleId]
        );

        return res.status(201).json({
          statusCode: 201,
          message: "Created",
        });
      }

      // else insert new role row
      const roleIdNew = generateId(roleIdQuery);

      await pool.query(
        `INSERT INTO op_roles (create_role, delete_role, display, role, role_id)
        VALUES (true, false, true, ?, ?)`,
        [roleName, roleIdNew]
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
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
