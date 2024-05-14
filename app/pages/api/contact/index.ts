import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IReqContact } from "src/components/types/contact";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // --------------------
    case "POST": {
      // store message
      const { email, isReplyWanted, message, name, to }: IReqContact =
        JSON.parse(req.body);

      await pool.query(
        `INSERT INTO op_messages (
          email,
          message,
          name,
          to,
          wants_reply
        )
        VALUES (?, ?, ?, ?, ?)`,
        [email, message, name, to, isReplyWanted]
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

export default contact;
