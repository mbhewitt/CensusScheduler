import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResShiftCategoryItem } from "src/components/types";

const shiftCategories = async (req: NextApiRequest, res: NextApiResponse) => {
  const { categoryId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all active types for category
      const [dbTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sn.shift_name,
          sn.shift_name_id
        FROM op_shift_name AS sn
        JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        AND sn.delete_shift=false
        WHERE sn.shift_category_id=?
        ORDER BY sn.shift_name`,
        [categoryId]
      );
      const resTypeList = dbTypeList.map(({ shift_name, shift_name_id }) => {
        return {
          id: shift_name_id,
          name: shift_name,
        };
      });

      return res.status(200).json(resTypeList);
    }

    // patch
    // --------------------
    case "PATCH": {
      // update category
      const { departmentName, name }: IResShiftCategoryItem = JSON.parse(
        req.body
      );

      await pool.query<RowDataPacket[]>(
        `UPDATE op_shift_category
        SET
          department=?,
          shift_category=?,
          update_category=true
        WHERE shift_category_id=?`,
        [departmentName, name, categoryId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // --------------------
    case "DELETE": {
      // delete category
      await pool.query<RowDataPacket[]>(
        `UPDATE op_shift_category
        SET delete_category=true
        WHERE shift_category_id=?`,
        [categoryId]
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

export default shiftCategories;
