import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResShiftCategoryItem } from "src/components/types";
import { generateId } from "src/utils/generateId";

const shiftCategories = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift categories
      const [dbCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT
          category,
          shift_category,
          shift_category_id
        FROM op_shift_category
        WHERE delete_category=false
        ORDER BY shift_category`
      );
      const resCategoryList: IResShiftCategoryItem[] = dbCategoryList.map(
        ({ category, shift_category, shift_category_id }) => {
          return {
            category,
            id: shift_category_id,
            name: shift_category,
          };
        }
      );

      return res.status(200).json(resCategoryList);
    }

    // post
    // --------------------
    case "POST": {
      // create shift category
      const { category, name } = JSON.parse(req.body);
      const shiftCategoryIdNew = generateId(
        `SELECT shift_category_id
        FROM op_shift_category
        WHERE shift_category_id=?`
      );

      await pool.query(
        `INSERT INTO op_shift_category (
          category,
          create_category,
          shift_category,
          shift_category_id
        )
        VALUES (?, true, ?, ?)`,
        [category, name, shiftCategoryIdNew]
      );

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
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
