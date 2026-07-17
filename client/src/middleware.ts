import { NextRequest, NextResponse } from "next/server";

import { isOnPlaya, ON_PLAYA_COOKIE } from "@/lib/onPlaya";

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

const ALLOWLIST = [
  // Sign-in surface (must be reachable while unauthenticated)
  "/sign-in",
  "/api/sign-in",
  "/api/auth/okta",
  "/api/auth/okta/callback",
  "/api/auth/sign-out",
  // /api/auth/session is the cookie-validity probe used by
  // useSessionValidation to keep client SessionContext in sync with
  // the actual cookie. Must reach the handler (which returns 401 on
  // missing/bad cookie) — middleware can't 401 first or the client
  // can't distinguish stale state from genuinely-no-cookie.
  "/api/auth/session",
  "/auth/complete",

  // Public information pages (per Mew, 2026-05-06)
  "/contact",
  // /api/contact accepts the form POST. Must be unauthenticated so
  // walk-up visitors with no session can actually send a message —
  // the /contact page was already allowlisted but its API was not,
  // so the form silently 401'd for everyone signed-out (#312).
  "/api/contact",
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
];

// On-playa (walk-up) only: /shifts + /api/shifts are reachable without a
// session so a walk-up volunteer can browse. Now gated per-request by the
// client's IP (the on-playa gateway range) rather than a build-time flag.
const ON_PLAYA_ALLOWLIST = ["/shifts", "/api/shifts"];

// Home is public again as of 2026-05-25 — the page now hosts the
// login affordance inline (Okta button off-playa, "Sign in with
// passcode" link on-playa for the PIN form), so there's no longer a
// reason to redirect unauth visitors away from it. Reverts the
// PUBLIC_PATHS purge that came in with PR #337 / closed-#306.
const PUBLIC_PATHS = new Set(["/"]);

function isAllowlisted(pathname: string, onPlaya: boolean): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  const list = onPlaya ? [...ALLOWLIST, ...ON_PLAYA_ALLOWLIST] : ALLOWLIST;
  for (const prefix of list) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Is this request coming from the on-playa gateway network? Keyed off the
  // unspoofable X-Real-IP that nginx sets. Drives passcode availability.
  const onPlaya = isOnPlaya((name) => req.headers.get(name));

  // Expose the decision to client components via a readable cookie, set on
  // every response so the passcode UI can react at runtime.
  const withOnPlayaCookie = (res: NextResponse) => {
    res.cookies.set(ON_PLAYA_COOKIE, onPlaya ? "1" : "0", {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
    });
    return res;
  };

  if (isAllowlisted(pathname, onPlaya)) {
    return withOnPlayaCookie(NextResponse.next());
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    return withOnPlayaCookie(NextResponse.next());
  }

  // API requests get a 401 instead of a redirect so callers see the error
  if (pathname.startsWith("/api/")) {
    return withOnPlayaCookie(
      new NextResponse(
        JSON.stringify({
          statusCode: 401,
          message: "Authentication required",
        }),
        { status: 401, headers: { "content-type": "application/json" } }
      )
    );
  }

  // Page requests redirect to /sign-in with a returnTo so the user lands
  // back where they tried to go after authenticating.
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("returnTo", pathname + search);
  return withOnPlayaCookie(NextResponse.redirect(url));
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals + static files. The
    // allowlist above filters within these paths.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|css|js|woff|woff2|ttf)$).*)",
  ],
};
