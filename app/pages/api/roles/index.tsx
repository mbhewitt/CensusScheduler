import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all roles
    case "GET": {
      const [dataDb] = await pool.query<RowDataPacket[]>(
        `SELECT display, roles
        FROM op_roles
        WHERE delete_role=false`
      );
      const roleList = dataDb.map(({ display, roles }) => {
        return { display: Boolean(display), name: roles };
      });

      return res.status(200).json({
        roleList,
      });
    }
    // post - create a role
    case "POST": {
      const { name } = JSON.parse(req.body);
      const [dataDb] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_roles
        WHERE roles=?`,
        [name]
      );
      const roleItem = dataDb[0];

      // if role row exists
      // then update role row
      if (roleItem) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_roles
          SET add_role=1, delete_role=0, display=1
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
    // default - send an error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default contact;
