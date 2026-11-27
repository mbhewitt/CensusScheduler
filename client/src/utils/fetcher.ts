// Set by Layout when the signed-in user is an admin: errors then carry the raw
// server response text too (#105). Server never sends DB details to anyone.
export const errorDetail = { show: false };

// One place that turns a failed response into an Error for the toasts (#105):
// the server's JSON `message` if there is one, else "Database error" for a
// 5xx / non-JSON body (e.g. Next's plain "Internal Server Error"), else a
// generic status line. Admins also get the raw response text appended.
const throwApiError = async (res: Response): Promise<never> => {
  const text = await res.text().catch(() => "");
  let message: string | undefined;
  try {
    message = JSON.parse(text)?.message;
  } catch {
    // not JSON
  }
  const friendly =
    message ??
    (res.status >= 500 ? "Database error" : `Request failed (${res.status})`);
  const detail =
    !message && errorDetail.show
      ? ` (${res.status}${text.trim() ? `: ${text.trim().slice(0, 300)}` : ""})`
      : "";
  throw new Error(friendly + detail);
};

export const fetcherGet = async (url: string) => {
  const res = await fetch(url);
  // Throw on non-2xx so SWR sets `error` (and retries) instead of handing the
  // error body back as `data`. Without this, a transient API failure (e.g. a
  // wedged DB pool → 500, or a 404 for a removed volunteer) got destructured
  // as if it were a real payload and white-screened the page. Callers already
  // guard with `if (error) return <ErrorPage/>`.
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcherTrigger = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: arg.method,
    body: JSON.stringify(arg.body),
  });
  // Mirror fetcherGet: throw on non-2xx so callers' catch/toast fires instead of
  // treating an error body as success. Without this a blocked write (e.g. a 423
  // in read-only mode, or a 500) resolved silently and the caller ran its
  // success path — dialog says "updated" while the DB was untouched.
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
};
