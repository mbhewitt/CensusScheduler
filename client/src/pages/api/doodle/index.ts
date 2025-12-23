import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IReqDoodle, IResDoodle } from "@/components/types/doodle";
import { pool } from "lib/database";

const doodle = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get image URL
      const [dbImageUrlList] = await pool.query<RowDataPacket[]>(
        `SELECT
          image_url
        FROM op_doodles`
      );
      const [resImageUrlFirst] = dbImageUrlList.map(({ id, image_url }) => {
        const resImageUrlItem: IResDoodle = {
          id,
          imageUrl: image_url ?? "",
        };

        return resImageUrlItem;
      });

      return res.status(200).json(resImageUrlFirst);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update image URL
      const { imageUrl }: IReqDoodle = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_doodles
        SET
          image_url=?
        WHERE id=1`,
        [imageUrl]
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

export default doodle;
