import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/withAuth";

// GET /api/auth/session — returns 200 + shiftboardId if the
// census-session cookie is currently valid, 401 otherwise.
//
// Purpose: let the client cheaply detect "client state thinks signed in
// but the server-side cookie is gone" so it can clear stale React /
// localStorage state and stop rendering the authenticated branch of
// the UI. See issue #389.
//
// No database hit — withAuth already verified the HMAC, so we can
// return the session shape immediately.
const sessionHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  return res.status(200).json({
    statusCode: 200,
    shiftboardId: session.shiftboardId,
  });
};

export default withAuth(sessionHandler);
