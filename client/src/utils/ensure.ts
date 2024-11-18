// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensure = (argument: any) => {
  if (argument === undefined || argument === null) {
    throw new TypeError("This value cannot be found.");
  }

  return argument;
};
