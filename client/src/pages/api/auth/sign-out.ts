import type { NextApiRequest, NextApiResponse } from "next";

import { buildClearSessionCookie } from "@/lib/session";

// Clears the server-side session cookie. Client-side code (signOut.tsx)
// also clears its sessionStorage state and redirects to /sign-in.
const signOut = async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader("Set-Cookie", buildClearSessionCookie());
  return res.status(200).json({ statusCode: 200, message: "Signed out" });
};

export default signOut;
