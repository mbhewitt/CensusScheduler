import type { NextApiRequest, NextApiResponse } from "next";

import { isReadOnly, readOnlyMessage } from "@/lib/readOnly";

// GET /api/read-only — PUBLIC. Reports whether the site is in read-only mode and
// the banner message to show. The client (useReadOnly) polls this to render the
// site-wide banner; the actual write enforcement is in middleware (423). See
// ONPLAYA_CUTOVER.md.
const readOnlyStatus = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const readOnly = isReadOnly();
  return res.status(200).json({
    statusCode: 200,
    readOnly,
    message: readOnly ? readOnlyMessage() : "",
  });
};

export default readOnlyStatus;
