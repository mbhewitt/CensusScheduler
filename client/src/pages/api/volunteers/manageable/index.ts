import type { NextApiRequest, NextApiResponse } from "next";

import { listManageableVolunteers } from "@/lib/authz";
import { isOnPlaya } from "@/lib/onPlaya";
import { withAuth } from "@/lib/withAuth";

// PEERS "Reset Volly Passcode": the roster a leader may reset passcodes for.
// Powers the name picker on /reset-passcode. Two gates on top of withAuth:
//   1. ON-PLAYA ONLY — this is a kiosk helper (papabear 2026-08-30); off-playa
//      it must NOT leak an enumerable roster, so we 403 rather than return data.
//   2. LEADERSHIP ONLY — listManageableVolunteers returns [] for a non-leader,
//      and we 403 so a squaddie who reaches this endpoint learns nothing.
// The actual passcode write is still gated per-target by canManageVolunteer in
// /api/volunteers/[shiftboardId]/account/passcode, so this list is convenience,
// not the security boundary.
const manageable = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      const onPlaya = isOnPlaya((name) => {
        const headerValue = req.headers[name.toLowerCase()];
        return Array.isArray(headerValue)
          ? headerValue[0]
          : (headerValue ?? null);
      });
      if (!onPlaya) {
        return res.status(403).json({ statusCode: 403, message: "Forbidden" });
      }

      const volunteerList = await listManageableVolunteers(session);
      if (volunteerList.length === 0) {
        // Either a non-leader (no rank) or a leader with nobody below them.
        // Both are "nothing to offer" — a 403 keeps the roster non-enumerable
        // for the non-leader case.
        return res.status(403).json({ statusCode: 403, message: "Forbidden" });
      }

      return res.status(200).json(volunteerList);
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({ statusCode: 404, message: "Not found" });
    }
  }
};

export default withAuth(manageable);
