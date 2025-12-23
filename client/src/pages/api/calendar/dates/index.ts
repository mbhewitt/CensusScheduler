import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { IResDateRowItem } from "@/components/types/calendar/dates";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

const calendar = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all dates
      const [dbDateList] = await pool.query<RowDataPacket[]>(
        `SELECT
          date_id,
          date,
          datename
        FROM op_dates`
      );

      const resDateList = dbDateList.map(({ date_id, date, datename }) => {
        const resDateItem: IResDateRowItem = {
          date,
          id: date_id,
          name: datename,
        };

        return resDateItem;
      });

      return res.status(200).json(resDateList);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // create date
      const { date, name } = JSON.parse(req.body);
      const dateIdNew = generateId(
        `SELECT date_id
        FROM op_dates
        WHERE date_id=?`
      );

      await pool.query(
        `INSERT INTO op_dates (
          date_id,
          date,
          datename
        )
        VALUES (?, ?, ?)`,
        [dateIdNew, date, name]
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
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

export default calendar;
