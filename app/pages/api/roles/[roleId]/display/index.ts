import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // patch - update role display
    case "PATCH": {
      const { checked } = req.body;

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET display=?
        WHERE role_id=?`,
        [checked, roleId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
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
