import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all roles
    case "GET": {
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT display, role, role_id
        FROM op_roles
        WHERE delete_role=false`
      );
      const resRoleList = dbRoleList.map(({ display, role, role_id }) => {
        return { display: Boolean(display), name: role, id: role_id };
      });

      return res.status(200).json(resRoleList);
    }
    // post - create role
    case "POST": {
      const { name } = JSON.parse(req.body);
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
        FROM op_roles
        WHERE roles=?`,
        [name]
      );
      const dbRoleFirst = dbRoleList[0];

      // if role row exists
      // then update role row
      if (dbRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_roles
          SET add_role=true, delete_role=false, display=true
          WHERE roles=?`,
          [name]
        );
        // else insert role row
      } else {
        await pool.query(
          "INSERT INTO op_roles (add_role, delete_role, display, roles) VALUES (true, false, true, ?)",
          [name]
        );
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
      });
    }
    // patch - update role display
    case "PATCH": {
      const { checked, name } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET display=?
        WHERE roles=?`,
        [Number(checked), name]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
      });
    }
    // delete - delete role
    case "DELETE": {
      const { name } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET add_role=false, delete_role=true
        WHERE roles=?`,
        [name]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
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
