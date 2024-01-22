export const fetcherGet = async (url: string) =>
  fetch(url).then((res) => res.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcherTrigger = async (url: string, { arg }: { arg: any }) =>
  fetch(url, {
    method: arg.method,
    body: JSON.stringify(arg.body),
  }).then((res) => res.json());
