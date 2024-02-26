import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IRoleItem } from "src/components/types";
import { generateId } from "src/utils/generateId";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all roles
    case "GET": {
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT display, role, role_id
        FROM op_roles
        WHERE delete_role=false
        ORDER BY role`
      );
      const resRoleList: IRoleItem[] = dbRoleList.map(
        ({ display, role, role_id }) => {
          return { display: Boolean(display), roleId: role_id, roleName: role };
        }
      );

      return res.status(200).json(resRoleList);
    }
    // post - create role
    case "POST": {
      const { name } = req.body;
      let roleIdNew;
      // check if role name exists
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
          FROM op_roles
          WHERE role=?`,
        [name]
      );
      const dbRoleFirst = dbRoleList[0];

      // if role name exists already
      // then update role row
      if (dbRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_roles
            SET create_role=true, delete_role=false, display=true
            WHERE role=?`,
          [name]
        );

        return res.status(201).json({
          statusCode: 201,
          message: "Created",
        });
      }

      // check if role id exists
      const checkRoleId = async () => {
        roleIdNew = generateId();
        const [dbRoleList] = await pool.query<RowDataPacket[]>(
          `SELECT role_id
          FROM op_roles
          WHERE role_id=?`,
          [roleIdNew]
        );
        const dbRoleFirst = dbRoleList[0];

        // if role ID exists already
        // then execute function recursively
        if (dbRoleFirst) {
          checkRoleId();
        }
      };

      checkRoleId();
      await pool.query(
        `INSERT INTO op_roles (create_role, delete_role, display, role, role_id)
        VALUES (true, false, true, ?, ?)`,
        [name, roleIdNew]
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }
    // default - send an error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default roles;
