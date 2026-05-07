import fs from "fs";
import path from "path";

import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";

const SAP_FILES_DIR = process.env.SAP_FILES_DIR ?? "/data/census/saps/";

const sapDownload = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId, sapId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // verify SAP belongs to this volunteer (or requester is admin)
      const [dbSapList] = await pool.query<RowDataPacket[]>(
        `SELECT s.filename, d.datename
        FROM op_saps s
        JOIN op_dates d ON s.date_id=d.date_id
        WHERE s.sap_id=?
        AND s.shiftboard_id=?`,
        [sapId, shiftboardId]
      );

      if (!dbSapList.length) {
        return res.status(404).json({
          statusCode: 404,
          message: "SAP not found",
        });
      }

      const { filename, datename } = dbSapList[0];
      const filePath = path.join(SAP_FILES_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          statusCode: 404,
          message: "SAP file not found",
        });
      }

      const fileBuffer = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sap-${datename}.pdf"`
      );
      return res.send(fileBuffer);
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(sapDownload);
