import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftCategoryItem,
  IResShiftCategoryItem,
} from "@/components/types/shifts/categories";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

const shiftCategories = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all categories
      const [dbShiftCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT
          department,
          shift_category,
          shift_category_id
        FROM op_shift_category
        WHERE delete_category=false
        ORDER BY shift_category COLLATE utf8mb4_general_ci`
      );
      const resShiftCategoryList = dbShiftCategoryList.map(
        ({ department, shift_category, shift_category_id }) => {
          const resShiftCategoryItem: IResShiftCategoryItem = {
            department: { name: department },
            id: shift_category_id,
            name: shift_category,
          };

          return resShiftCategoryItem;
        }
      );

      return res.status(200).json(resShiftCategoryList);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // create shift category
      const {
        department: { name: departmentName },
        name: categoryName,
      }: IReqShiftCategoryItem = JSON.parse(req.body);
      const shiftCategoryIdNew = generateId(
        `SELECT shift_category_id
        FROM op_shift_category
        WHERE shift_category_id=?`
      );

      await pool.query(
        `INSERT INTO op_shift_category (
          department,
          create_category,
          shift_category,
          shift_category_id
        )
        VALUES (?, true, ?, ?)`,
        [departmentName, categoryName, shiftCategoryIdNew]
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

export default shiftCategories;
