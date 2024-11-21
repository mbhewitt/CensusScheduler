import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IResShiftCategoryTypeItem } from "@/components/types/shifts/categories";
import { pool } from "lib/database";

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
        const resTypeItem: IResShiftCategoryTypeItem = {
          id: shift_name_id,
          name: shift_name,
        };

        return resTypeItem;
      });

      return res.status(200).json(resTypeList);
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
