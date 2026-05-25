import { NextRequest, NextResponse } from "next/server";

// Inlined deliberately — Next.js middleware runs in the Edge runtime which
// does not have access to Node's `crypto` module. The session module uses
// `import crypto from "crypto"` so importing from it would break the build.
// Cryptographic verification happens at the API layer (Node runtime).
const SESSION_COOKIE_NAME = "census-session";

// HOTFIX 2026-05-06: gate everything-except-allowlist on the census-session
// cookie. Public routes that volunteers (or new prospective volunteers) must
// be able to reach without a session go through the allowlist below.
//
// Cookie validity is verified server-side at the API layer (where we have
// access to crypto / Node APIs). The middleware only checks for cookie
// presence — a forged cookie passes here but fails at the API layer.
//
// This is a stopgap. The proper fix is per-route role-based authorization
// (issue #237). For now: block the obvious enumeration paths.

// On-playa deployments (passcode UI enabled) leave /shifts open so a
// walk-up volunteer with no session can see what's available without
// signing in. Off-playa (Okta-only, PIN_ENABLED=false) keeps it gated.
// NEXT_PUBLIC_* is inlined at build time, so this is a static decision
// per deployment.
const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

const ALLOWLIST = [
  // Sign-in surface (must be reachable while unauthenticated)
  "/sign-in",
  "/api/sign-in",
  "/api/auth/okta",
  "/api/auth/okta/callback",
  "/api/auth/sign-out",
  "/auth/complete",

  // Public information pages (per Mew, 2026-05-06)
  "/contact",
  "/help",
  "/reports",

  // Account creation (lets new volunteers self-register).
  // The page is at /volunteers/account/create but it POSTs to
  // /api/volunteers/account (no /create suffix — the handler file is
  // client/src/pages/api/volunteers/account/index.ts). Without the
  // bare /api/volunteers/account entry the self-signup POST gets 401
  // from this middleware before reaching the handler.
  "/volunteers/account/create",
  "/api/volunteers/account",

  // Volunteer dropdown for sign-in autocomplete — needed for on-playa
  // passcode UI. Off-playa Okta-only mode will gate this via PR #275.
  "/api/volunteers/dropdown",

  // Health / static
  "/_next",
  "/favicon.ico",
  "/banners",
  "/general",
  "/help/",
  "/reports/",

  // On-playa only: walk-up shifts view
  ...(isOnPlaya ? ["/shifts", "/api/shifts"] : []),
];

// Home is public again as of 2026-05-25 — the page now hosts the
// login affordance inline (Okta button off-playa, "Sign in with
// passcode" link on-playa for the PIN form), so there's no longer a
// reason to redirect unauth visitors away from it. Reverts the
// PUBLIC_PATHS purge that came in with PR #337 / closed-#306.
const PUBLIC_PATHS = new Set(["/"]);

function isAllowlisted(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of ALLOWLIST) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAllowlisted(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    return NextResponse.next();
  }

  // API requests get a 401 instead of a redirect so callers see the error
  if (pathname.startsWith("/api/")) {
    return new NextResponse(
      JSON.stringify({
        statusCode: 401,
        message: "Authentication required",
      }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  // Page requests redirect to /sign-in with a returnTo so the user lands
  // back where they tried to go after authenticating.
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("returnTo", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals + static files. The
    // allowlist above filters within these paths.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|css|js|woff|woff2|ttf)$).*)",
  ],
};
