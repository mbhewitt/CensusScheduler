// Unchecking someone is easy to do by accident on a tablet, so ask first.
// Returns true when the toggle should go ahead (checking in never asks).
export const confirmUncheckIn = (
  isCheckedIn: boolean,
  playaName: string,
  worldName: string,
  positionName: string
) =>
  isCheckedIn ||
  window.confirm(
    `Undo check-in for ${playaName} "${worldName}" (${positionName})?`
  );
