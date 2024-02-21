import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // check email and passcode credentials
    case "POST": {
      const { email, isReplyWanted, message, name, to } = JSON.parse(req.body);

      await pool.query(
        "INSERT INTO op_messages (email, message, name, `to`, wants_reply) VALUES (?, ?, ?, ?, ?)",
        [email, message, name, to, isReplyWanted]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
      });
    }
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default contact;
