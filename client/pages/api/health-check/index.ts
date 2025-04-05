import type { NextApiRequest, NextApiResponse } from "next";

const healthCheck = async (_: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    statusCode: 200,
    message: "OK",
  });
};

export default healthCheck;
