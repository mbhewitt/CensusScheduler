// Compute a safe post-login landing path from a ?returnTo param.
//
// Honor returnTo only if it's a same-origin path that is NOT *another*
// volunteer's personal page. On a shared tablet the pre-login page is often
// the previous user's account (/volunteers/{otherId}/...), and the middleware
// forwards it as ?returnTo; without this guard the freshly-signed-in user
// lands on that other person's account page (Miah landed on Lizard King's,
// reported 2026-09-03). Falls back to the signed-in user's own account.
//
// Used by both login paths: passcode (SignIn.tsx) and Okta (AuthComplete.tsx).
export const safeReturnTo = (
  returnToParam: string | null | undefined,
  myId: number
): string => {
  const fallback = `/volunteers/${myId}/info`;
  // Only same-origin absolute paths; never an external URL or a bare query.
  if (!returnToParam || !returnToParam.startsWith("/")) return fallback;
  // A /volunteers/{id}/... path for a DIFFERENT id is someone else's page.
  const foreign = returnToParam.match(/^\/volunteers\/(\d+)(?:\/|$)/);
  if (foreign && Number(foreign[1]) !== myId) return fallback;
  return returnToParam;
};
