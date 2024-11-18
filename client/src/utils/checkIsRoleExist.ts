import { IResVolunteerRoleItem } from "src/components/types/volunteers";
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_AUTHENTICATED,
  ROLE_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  ROLE_SUPER_ADMIN_ID,
} from "src/constants";
import { IAccountTypePayload } from "src/state/developer-mode/reducer";

// check for authentication
export const checkIsAuthenticated = (
  { isEnabled, value }: IAccountTypePayload,
  isAuthenticatedSession: boolean
) => {
  return (
    // for dev mode
    (isEnabled &&
      (value === ACCOUNT_TYPE_ADMIN || value === ACCOUNT_TYPE_AUTHENTICATED)) ||
    // for signing in
    (!isEnabled && isAuthenticatedSession)
  );
};

// check for general role
const checkIsRoleExist = (roleId: number, roleList: IResVolunteerRoleItem[]) =>
  roleList && roleList.some((roleItem) => roleItem.id === roleId);
// check for admin role, including when dev mode is on
export const checkIsAdmin = (
  { isEnabled, value }: IAccountTypePayload,
  roleList: IResVolunteerRoleItem[]
) => {
  return (
    (isEnabled && value === ACCOUNT_TYPE_ADMIN) ||
    (!isEnabled && checkIsRoleExist(ROLE_ADMIN_ID, roleList))
  );
};
// check for behavioral standards signed role
export const checkIsBehavioralStandardsSigned = (
  roleList: IResVolunteerRoleItem[]
) => {
  return checkIsRoleExist(ROLE_BEHAVIORAL_STANDARDS_ID, roleList);
};
// check for super admin role, including when dev mode is on
export const checkIsSuperAdmin = (roleList: IResVolunteerRoleItem[]) => {
  return checkIsRoleExist(ROLE_SUPER_ADMIN_ID, roleList);
};
