import { isSuperAdmin } from "@/lib/authz";
import { withAuth, type ApiHandlerWithSession } from "@/lib/withAuth";

// Wrap an API handler so it requires a valid session AND the SuperAdmin role.
// Used by the SAP management endpoints, which are super-admin only. The 403 is
// enforced server-side here, not just by the client-side AuthGate on the page.
export function withSuperAdmin(handler: ApiHandlerWithSession) {
  return withAuth(async (req, res, session) => {
    if (!(await isSuperAdmin(session.shiftboardId))) {
      return res
        .status(403)
        .json({ statusCode: 403, message: "Super admin role required" });
    }
    return handler(req, res, session);
  });
}
