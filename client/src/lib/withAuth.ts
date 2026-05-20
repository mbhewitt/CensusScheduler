import type { NextApiRequest, NextApiResponse } from "next";

import { readSessionFromCookies } from "@/lib/session";

// Wrap an API handler so it requires a valid (HMAC-verified) session cookie.
// Belt-and-suspenders for the middleware, which only checks cookie presence
// in the Edge runtime. This catches forged cookies.
//
// Usage:
//
//   export default withAuth(async (req, res, session) => {
//     // session.shiftboardId is the authenticated user
//   });

export interface ApiHandlerWithSession {
  (
    req: NextApiRequest,
    res: NextApiResponse,
    session: { shiftboardId: number }
  ): Promise<void> | void;
}

export function withAuth(handler: ApiHandlerWithSession) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = readSessionFromCookies(req.cookies);
    if (!session) {
      return res.status(401).json({
        statusCode: 401,
        message: "Authentication required",
      });
    }
    return handler(req, res, session);
  };
}
