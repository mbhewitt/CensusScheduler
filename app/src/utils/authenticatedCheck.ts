import { ACCOUNT_TYPE_ADMIN, ACCOUNT_TYPE_AUTHENTICATED } from "src/constants";
import { IAccountTypePayload } from "src/state/developer-mode/reducer";

export const authenticatedCheck = (
  { isEnabled, value }: IAccountTypePayload,
  isAuthenticatedSession: boolean
) => {
  return (
    (isEnabled &&
      (value === ACCOUNT_TYPE_ADMIN || value === ACCOUNT_TYPE_AUTHENTICATED)) ||
    (!isEnabled && isAuthenticatedSession)
  );
};
