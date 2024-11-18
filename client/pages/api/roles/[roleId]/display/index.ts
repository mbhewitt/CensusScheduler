import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IReqRoleDisplayItem } from "src/components/types/roles";

const roles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // patch
    // --------------------
    case "PATCH": {
      // update role display
      const { checked }: IReqRoleDisplayItem = req.body;

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
