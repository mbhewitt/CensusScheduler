import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, isReplyWanted, message, name, to } = JSON.parse(req.body);

  if (req.method === "POST") {
    await pool.query(
      "INSERT INTO op_messages (email, message, name, `to`, wants_reply) VALUES (?, ?, ?, ?, ?)",
      [email, message, name, to, Number(isReplyWanted)]
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Success",
    });
  }

  return res.status(404).json({
    statusCode: 404,
    message: "Not found",
  });
};

export default contact;
