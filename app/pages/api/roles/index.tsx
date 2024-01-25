import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET": {
      const [dataDb] = await pool.query<RowDataPacket[]>(
        `SELECT delete_role, display, roles
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
