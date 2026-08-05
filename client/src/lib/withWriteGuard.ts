import { isAdmin, isSuperAdmin } from "@/lib/authz";
import { withAuth, type ApiHandlerWithSession } from "@/lib/withAuth";

// Gate MUTATIONS (non-GET) on an API route to a role, enforced server-side.
// Reads (GET) are left to the auth middleware (logged-in) so we don't break
// pages that list this data. Fixes routes that previously had no server-side
// role check at all (#595 / #596-B / #535). `level` = the minimum role for a
// write: "admin" (Admin or SuperAdmin) or "superadmin" (SuperAdmin only).
export function withWriteGuard(
  handler: ApiHandlerWithSession,
  level: "admin" | "superadmin"
) {
  return withAuth(async (req, res, session) => {
    if (req.method && req.method !== "GET") {
      const ok =
        level === "superadmin"
          ? await isSuperAdmin(session.shiftboardId)
          : await isAdmin(session.shiftboardId);
      if (!ok) {
        return res.status(403).json({
          statusCode: 403,
          message:
            level === "superadmin"
              ? "Super admin role required"
              : "Admin role required",
        });
      }
    }
    return handler(req, res, session);
  });
}
