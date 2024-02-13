import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all roles
    case "GET": {
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT display, roles
        FROM op_roles
        WHERE delete_role=false`
      );
      const resRoleList = dbRoleList.map(({ display, roles }) => {
        return { display: Boolean(display), name: roles };
      });

      return res.status(200).json(resRoleList);
    }
    // post - create role
    case "POST": {
      const { name } = JSON.parse(req.body);
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_roles
        WHERE roles=?`,
        [name]
      );
      const dbRoleItem = dbRoleList[0];

      // if role row exists
      // then update role row
      if (dbRoleItem) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_roles
          SET add_role=true, delete_role=false, display=true
          WHERE roles=?`,
          [name]
        );
        // else insert role row
      } else {
        await pool.query(
          "INSERT INTO op_roles (add_role, delete_role, display, roles) VALUES (1, 0, 1, ?)",
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
