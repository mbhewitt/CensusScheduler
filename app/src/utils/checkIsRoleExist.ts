import { IResVolunteerRoleItem } from "src/components/types";
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_AUTHENTICATED,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  ROLE_CORE_CREW_ID,
  ROLE_SUPER_ADMIN_ID,
} from "src/constants";
import { IAccountTypePayload } from "src/state/developer-mode/reducer";

// check for authentication
export const checkIsAuthenticated = (
  { isEnabled, value }: IAccountTypePayload,
  isAuthenticatedSession: boolean
) => {
  return (
    (isEnabled &&
      (value === ACCOUNT_TYPE_ADMIN || value === ACCOUNT_TYPE_AUTHENTICATED)) ||
    (!isEnabled && isAuthenticatedSession)
  );
};

// check for general role
const checkIsRoleExist = (roleId: number, roleList: IResVolunteerRoleItem[]) =>
  roleList && roleList.some((roleItem) => roleItem.roleId === roleId);
// check for behavioral standards signed
export const checkIsBehavioralStandardsSigned = (
  roleList: IResVolunteerRoleItem[]
) => {
  return checkIsRoleExist(ROLE_BEHAVIORAL_STANDARDS_ID, roleList);
};
// check for core crew role, including when dev mode is on
export const checkIsCoreCrew = (
  { isEnabled, value }: IAccountTypePayload,
  roleList: IResVolunteerRoleItem[]
) => {
  return (
    (isEnabled && value === ACCOUNT_TYPE_ADMIN) ||
    (!isEnabled && checkIsRoleExist(ROLE_CORE_CREW_ID, roleList))
  );
};
// check for super admin role
export const checkIsSuperAdmin = (roleList: IResVolunteerRoleItem[]) => {
  return checkIsRoleExist(ROLE_SUPER_ADMIN_ID, roleList);
};
