export const fetcherGet = async (url: string) => {
  const res = await fetch(url);
  // Throw on non-2xx so SWR sets `error` (and retries) instead of handing the
  // error body back as `data`. Without this, a transient API failure (e.g. a
  // wedged DB pool → 500, or a 404 for a removed volunteer) got destructured
  // as if it were a real payload and white-screened the page. Callers already
  // guard with `if (error) return <ErrorPage/>`.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcherTrigger = async (url: string, { arg }: { arg: any }) =>
  fetch(url, {
    method: arg.method,
    body: JSON.stringify(arg.body),
  }).then((res) => res.json());
