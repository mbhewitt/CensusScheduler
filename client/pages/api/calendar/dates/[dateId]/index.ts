import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { IReqDateItem } from "@/components/types/calendar/dates";
import { pool } from "lib/database";

const dates = async (req: NextApiRequest, res: NextApiResponse) => {
  const { dateId } = req.query;

  switch (req.method) {
    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update date
      const { date, name }: IReqDateItem = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_roles
        SET
          date=?,
          datename=?
        WHERE date_id=?`,
        [date, name, dateId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // ------------------------------------------------------------
    case "DELETE": {
      // delete date
      await pool.query<RowDataPacket[]>(
        `DELETE FROM op_dates
        WHERE date_id=?`,
        [dateId]
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

export default dates;
