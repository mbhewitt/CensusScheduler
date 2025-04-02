import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IReqShiftCategoryItem } from "@/components/types/shifts/categories";
import { pool } from "lib/database";

const shiftCategories = async (req: NextApiRequest, res: NextApiResponse) => {
  const { categoryId } = req.query;

  switch (req.method) {
    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update category
      const {
        department: { name: departmentName },
        name: categoryName,
      }: IReqShiftCategoryItem = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_shift_category
        SET
          department=?,
          shift_category=?,
          update_category=true
        WHERE shift_category_id=?`,
        [departmentName, categoryName, categoryId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // ------------------------------------------------------------
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

export default shiftCategories;
