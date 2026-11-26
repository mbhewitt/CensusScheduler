import type { NextApiRequest, NextApiResponse } from "next";

import { readSessionFromRequest } from "@/lib/session";

// Wrap an API handler so it requires a valid (HMAC-verified) session cookie
// or a pumpkin acting-as Bearer (lib/actingAs.ts).
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
    const session = await readSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        statusCode: 401,
        message: "Authentication required",
      });
    }
    return handler(req, res, session);
  };
}
