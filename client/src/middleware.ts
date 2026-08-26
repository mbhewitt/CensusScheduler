import { NextRequest, NextResponse } from "next/server";

import { isBlockedWrite, isReadOnly, readOnlyMessage } from "@/lib/readOnly";

// Inlined deliberately — Next.js middleware runs in the Edge runtime which
// does not have access to Node's `crypto` module. The session module uses
// `import crypto from "crypto"` so importing from it would break the build.
// Cryptographic verification happens at the API layer (Node runtime).
const SESSION_COOKIE_NAME = "census-session";
// Same reasoning: inline the device-cookie name rather than import lib/device
// (which pulls in node crypto). A provisioned tablet carries this cookie; we
// treat its PRESENCE as "on-playa" so a walk-up on a lab tablet gets the same
// unauthenticated /shifts + training access the on-playa build grants. We only
// check presence here (edge can't HMAC-verify) — that's fine because it only
// opens the non-PII shift LIST + bundled training; the volunteer-detail
// endpoint stays withAuth (HMAC-verified) at the API layer regardless.
const DEVICE_COOKIE_NAME = "census-device";

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

  // Tablet device provisioning (#015): the tablet scanning the QR is NOT logged
  // in, so the landing page and its claim endpoint must be reachable
  // unauthenticated. /api/auth/device reports provisioned-state for the sign-in
  // UI (also pre-login). NOTE: /api/provision/token is deliberately NOT here —
  // minting is super-admin only and goes through withSuperAdmin (needs session).
  "/provision",
  "/api/provision/claim",
  "/api/auth/device",
  "/api/auth/sign-out",
  // /api/auth/session is the cookie-validity probe used by
  // useSessionValidation to keep client SessionContext in sync with
  // the actual cookie. Must reach the handler (which returns 401 on
  // missing/bad cookie) — middleware can't 401 first or the client
  // can't distinguish stale state from genuinely-no-cookie.
  "/api/auth/session",
  // Read-only status for the site-wide banner — public, pre-login.
  "/api/read-only",
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

  // Public survey-reminder landing page + its hosted .ics files (#589).
  // Shareable from the newsletter; must work with no login / Burner Profile.
  // (.ics files go through middleware — .ics isn't in the matcher's static-
  // extension exclusion — so the asset dir needs allowlisting too.)
  "/census-survey-reminders",
  "/census-reminders",

  // Public perm-link to QR images (/api/qr/<id>.png) — embeddable anywhere.
  "/api/qr",
];

// On-playa-only allowlist — applied when effective-on-playa (build flag OR a
// provisioned-tablet cookie). Walk-up shifts view + the bundled training course
// files (.json/.pdf/.mp3 aren't in the matcher's static-extension exclusion, so
// they come through middleware and need allowlisting).
const ON_PLAYA_ALLOWLIST = [
  "/shifts",
  "/api/shifts",
  "/training/index.json",
  "/training/courses",
  "/training/assets",
  "/training/guides",
];

// Home is public again as of 2026-05-25 — the page now hosts the
// login affordance inline (Okta button off-playa, "Sign in with
// passcode" link on-playa for the PIN form), so there's no longer a
// reason to redirect unauth visitors away from it. Reverts the
// PUBLIC_PATHS purge that came in with PR #337 / closed-#306.
// Exact-match public paths. /manifest.webmanifest is deliberately allowlisted
// here (exact match) rather than added to the matcher's static-extension
// exclusion: a broad `*.webmanifest` exclusion would let crafted API URLs like
// /api/shifts/types/1.webmanifest skip auth and reach unguarded dynamic
// handlers. The exact allowlist serves the one static file without opening that
// hole. The PWA icons/sw.js are safe via the extension exclusion (.png/.js).
const PUBLIC_PATHS = new Set(["/", "/manifest.webmanifest"]);

// On-playa the offline course pages are readable without a session, so a
// walk-up volunteer at the Lab can study before signing in. Deliberately NOT
// a plain "/training" allowlist prefix: /training/confirmation/[code] records
// completion against the signed-in volunteer and must stay gated.
const isPublicTrainingPage = (pathname: string, onPlaya: boolean) =>
  onPlaya &&
  /^\/training(\/[a-z0-9-]+)?$/.test(pathname) &&
  !pathname.startsWith("/training/confirmation");

function isAllowlisted(pathname: string, onPlaya: boolean): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (isPublicTrainingPage(pathname, onPlaya)) return true;
  const lists = onPlaya ? [...ALLOWLIST, ...ON_PLAYA_ALLOWLIST] : ALLOWLIST;
  for (const prefix of lists) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Read-only mode: freeze data mutations site-wide (even for admins), but let
  // people sign in and read. Checked first so it applies regardless of auth or
  // allowlist. The client also shows a banner (see useReadOnly), but this is
  // the enforcement. Runtime env — flips with a restart. See ONPLAYA_CUTOVER.md.
  if (isReadOnly() && isBlockedWrite(req.method, pathname)) {
    return new NextResponse(
      JSON.stringify({ statusCode: 423, message: readOnlyMessage() }),
      { status: 423, headers: { "content-type": "application/json" } }
    );
  }

  // Effective on-playa: build flag OR a provisioned-tablet cookie (presence
  // only — see DEVICE_COOKIE_NAME note). Opens walk-up /shifts + training on a
  // lab tablet without a login, same as an on-playa deploy.
  const onPlaya =
    isOnPlaya || Boolean(req.cookies.get(DEVICE_COOKIE_NAME)?.value);
  if (isAllowlisted(pathname, onPlaya)) {
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
